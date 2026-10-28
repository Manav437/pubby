-- Additive v2 schema. Legacy rooms/video_queue remain untouched.
begin;
create table public.listening_rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  current_entry_id uuid,
  is_playing boolean not null default false,
  playback_seconds double precision not null default 0 check (playback_seconds >= 0 and playback_seconds < 864000),
  playback_updated_at timestamptz not null default now(),
  revision bigint not null default 0
);
create table public.room_members (
  room_id uuid not null references public.listening_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 32),
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create table public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.listening_rooms(id) on delete cascade,
  added_by uuid not null references auth.users(id),
  display_name text not null check (char_length(display_name) between 1 and 32),
  video_id text not null check (video_id ~ '^[a-zA-Z0-9_-]{11}$'),
  position bigint generated always as identity unique,
  played_at timestamptz,
  created_at timestamptz not null default now(),
  unique (room_id, id)
);
alter table public.listening_rooms add constraint current_entry_in_room
  foreign key (id, current_entry_id) references public.queue_entries(room_id, id) deferrable initially deferred;
create index queue_entries_pending on public.queue_entries(room_id, position) where played_at is null;
create index room_members_online on public.room_members(room_id, last_seen_at);
create table public.room_messages (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.listening_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  display_name text not null check (char_length(display_name) between 1 and 32),
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index room_messages_recent on public.room_messages(room_id, id desc);

-- Membership helper avoids recursive RLS on room_members.
create function public.is_room_member(p_room uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.room_members where room_id=p_room and user_id=auth.uid());
$$;
alter table public.listening_rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.queue_entries enable row level security;
alter table public.room_messages enable row level security;
create policy member_read on public.listening_rooms for select to authenticated using (public.is_room_member(id));
create policy member_read on public.room_members for select to authenticated using (public.is_room_member(room_id));
create policy member_read on public.queue_entries for select to authenticated using (public.is_room_member(room_id));
create policy member_read on public.room_messages for select to authenticated using (public.is_room_member(room_id));
revoke all on public.listening_rooms, public.room_members, public.queue_entries, public.room_messages from anon, authenticated;
grant select on public.listening_rooms, public.room_members, public.queue_entries, public.room_messages to authenticated;

create function public.create_listening_room(p_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if length(trim(p_name)) not between 1 and 32 then raise exception 'Name must be 1–32 characters'; end if;
 if (select count(*) from public.listening_rooms where host_id=auth.uid() and created_at > now()-interval '1 hour') >= 10 then raise exception 'Room limit reached. Try again later.'; end if;
 insert into public.listening_rooms(host_id) values(auth.uid()) returning id into v_id;
 insert into public.room_members(room_id,user_id,display_name) values(v_id,auth.uid(),trim(p_name));
 return v_id;
end; $$;

-- Possession of an unlisted room UUID is the invitation. It permits joining,
-- not host controls. The host cannot be changed by a guest.
create function public.join_listening_room(p_room uuid, p_name text) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if length(trim(p_name)) not between 1 and 32 then raise exception 'Name must be 1–32 characters'; end if;
 if not exists(select 1 from public.listening_rooms where id=p_room) then raise exception 'Room not found'; end if;
 insert into public.room_members(room_id,user_id,display_name) values(p_room,auth.uid(),trim(p_name))
 on conflict(room_id,user_id) do update set display_name=excluded.display_name,last_seen_at=now();
end; $$;

create function public.room_snapshot(p_room uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_room_member(p_room) then raise exception 'Join this room first'; end if;
 update public.room_members set last_seen_at=now() where room_id=p_room and user_id=auth.uid();
 return jsonb_build_object(
 'server_time',clock_timestamp(),
 'room',(select to_jsonb(r) from public.listening_rooms r where id=p_room),
 'queue',coalesce((select jsonb_agg(q order by q.position) from public.queue_entries q where q.room_id=p_room and q.played_at is null),'[]'::jsonb),
 'members',coalesce((select jsonb_agg(m order by m.joined_at) from public.room_members m where m.room_id=p_room and m.last_seen_at > now()-interval '45 seconds'),'[]'::jsonb),
 'messages',coalesce((select jsonb_agg(m order by m.id) from (select * from public.room_messages where room_id=p_room order by id desc limit 50) m),'[]'::jsonb));
end; $$;

create function public.enqueue_video(p_room uuid, p_video text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_name text; v_current uuid;
begin
 if not public.is_room_member(p_room) then raise exception 'Join this room first'; end if;
 -- Serialize queue insertion and advancement for a room.
 select current_entry_id into v_current from public.listening_rooms where id=p_room for update;
 if (select count(*) from public.queue_entries where room_id=p_room and played_at is null) >= 100 then raise exception 'Queue is full (100 videos)'; end if;
 select display_name into v_name from public.room_members where room_id=p_room and user_id=auth.uid();
 insert into public.queue_entries(room_id,added_by,display_name,video_id) values(p_room,auth.uid(),v_name,p_video) returning id into v_id;
 if v_current is null then
   update public.listening_rooms set current_entry_id=v_id,is_playing=true,playback_seconds=0,playback_updated_at=clock_timestamp(),revision=revision+1 where id=p_room;
 end if;
 return v_id;
end; $$;

create function public.control_playback(p_room uuid,p_entry uuid,p_revision bigint,p_action text,p_seconds double precision default 0) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.listening_rooms; v_next uuid;
begin
 select * into r from public.listening_rooms where id=p_room for update;
 if r.host_id is distinct from auth.uid() or auth.uid() is null then raise exception 'Only the host controls playback'; end if;
 -- A delayed end event or stale client must never skip the next track.
 if r.current_entry_id is distinct from p_entry or r.revision <> p_revision then raise exception 'Playback changed; refresh and try again'; end if;
 if p_entry is null then raise exception 'Queue is empty'; end if;
 if p_action='skip' then
   update public.queue_entries set played_at=now() where id=p_entry and room_id=p_room;
   select id into v_next from public.queue_entries where room_id=p_room and played_at is null order by position limit 1;
   update public.listening_rooms set current_entry_id=v_next,is_playing=(v_next is not null),playback_seconds=0,playback_updated_at=clock_timestamp(),revision=revision+1 where id=p_room;
 elsif p_action in ('play','pause','seek') then
   if p_seconds is null or p_seconds < 0 or p_seconds >= 864000 or p_seconds='NaN'::double precision then raise exception 'Invalid playback position'; end if;
   update public.listening_rooms set playback_seconds=p_seconds,playback_updated_at=clock_timestamp(),
     is_playing=case p_action when 'play' then true when 'pause' then false else r.is_playing end,revision=revision+1 where id=p_room;
 else raise exception 'Unknown playback action'; end if;
end; $$;

create function public.remove_queue_entry(p_room uuid,p_entry uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.listening_rooms; q public.queue_entries;
begin
 select * into r from public.listening_rooms where id=p_room for update;
 if not public.is_room_member(p_room) then raise exception 'Join this room first'; end if;
 select * into q from public.queue_entries where id=p_entry and room_id=p_room;
 if q.id is null then raise exception 'Video not found'; end if;
 if q.added_by <> auth.uid() and r.host_id <> auth.uid() then raise exception 'Only remove your own videos'; end if;
 if p_entry=r.current_entry_id then raise exception 'Use Skip for the current video'; end if;
 update public.queue_entries set played_at=now() where id=p_entry;
end; $$;

create function public.send_room_message(p_room uuid,p_body text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_name text;
begin
 if not public.is_room_member(p_room) then raise exception 'Join this room first'; end if;
 -- Lock member row to enforce the send interval across concurrent requests.
 select display_name into v_name from public.room_members where room_id=p_room and user_id=auth.uid() for update;
 if length(trim(p_body)) not between 1 and 500 then raise exception 'Messages must be 1–500 characters'; end if;
 if exists(select 1 from public.room_messages where room_id=p_room and user_id=auth.uid() and created_at>clock_timestamp()-interval '1 second') then raise exception 'Please wait a moment before sending again'; end if;
 insert into public.room_messages(room_id,user_id,display_name,body) values(p_room,auth.uid(),v_name,trim(p_body));
end; $$;

-- Postgres functions are executable by PUBLIC by default: explicitly restrict all RPCs.
revoke all on function public.is_room_member(uuid), public.create_listening_room(text), public.join_listening_room(uuid,text), public.room_snapshot(uuid), public.enqueue_video(uuid,text), public.control_playback(uuid,uuid,bigint,text,double precision), public.remove_queue_entry(uuid,uuid), public.send_room_message(uuid,text) from public, anon;
grant execute on function public.is_room_member(uuid), public.create_listening_room(text), public.join_listening_room(uuid,text), public.room_snapshot(uuid), public.enqueue_video(uuid,text), public.control_playback(uuid,uuid,bigint,text,double precision), public.remove_queue_entry(uuid,uuid), public.send_room_message(uuid,text) to authenticated;
do $$ declare t text; begin
 foreach t in array array['listening_rooms','queue_entries','room_messages'] loop
   if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
     execute format('alter publication supabase_realtime add table public.%I',t);
   end if;
 end loop;
end; $$;
commit;
