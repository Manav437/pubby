\set ON_ERROR_STOP on
begin;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002'),('00000000-0000-4000-8000-000000000003');
create function pg_temp.assert_true(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %',label; end if; end; $$;
create function pg_temp.expect_error(statement text, expected text) returns void language plpgsql as $$
begin
 begin execute statement;
 exception when others then
   if position(expected in SQLERRM)>0 then return; end if;
   raise exception 'Unexpected error: % (wanted %)',SQLERRM,expected;
 end;
 raise exception 'Expected rejection: %',statement;
end; $$;
set local role anon;
select pg_temp.expect_error('select public.create_listening_room(''Host'')','permission denied');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
select public.create_listening_room('Host') as room_id \gset
select public.enqueue_video(:'room_id','dQw4w9WgXcQ') as first_id \gset
select public.enqueue_video(:'room_id','jNQXAC9IVRw') as second_id \gset
select pg_temp.assert_true((select current_entry_id=:'first_id'::uuid and is_playing from public.listening_rooms where id=:'room_id'),'first track selected');
select pg_temp.expect_error(format('select public.enqueue_video(%L,''invalid'')',:'room_id'),'check constraint');
select public.control_playback(:'room_id',:'first_id',1,'pause',12);
select pg_temp.assert_true((select not is_playing and playback_seconds=12 from public.listening_rooms where id=:'room_id'),'pause persisted');
select public.control_playback(:'room_id',:'first_id',2,'seek',30);
select public.control_playback(:'room_id',:'first_id',3,'play',30);
-- A logged-in outsider cannot read the room or call membership RPCs.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);
select pg_temp.assert_true((select count(*)=0 from public.listening_rooms where id=:'room_id'),'outsider cannot read room');
select pg_temp.expect_error(format('select public.room_snapshot(%L)',:'room_id'),'Join this room first');
-- A guest may join, add videos and chat, but cannot control host playback.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
select public.join_listening_room(:'room_id','Friend');
select pg_temp.assert_true((select count(*)=1 from public.listening_rooms where id=:'room_id'),'member can read room');
select pg_temp.expect_error(format('select public.control_playback(%L,%L,4,''skip'',0)',:'room_id',:'first_id'),'Only the host');
select pg_temp.expect_error(format('update public.listening_rooms set host_id=auth.uid() where id=%L',:'room_id'),'permission denied');
select pg_temp.expect_error(format('select public.remove_queue_entry(%L,%L)',:'room_id',:'second_id'),'Only remove your own');
select public.enqueue_video(:'room_id','aqz-KE-bpKQ') as guest_entry \gset
select public.send_room_message(:'room_id','Hello, room!');
select pg_temp.assert_true((public.room_snapshot(:'room_id')->'messages'->0->>'display_name')='Friend','message author is assigned by database');
select pg_temp.expect_error(format('select public.send_room_message(%L,''Too soon'')',:'room_id'),'Please wait');
select public.remove_queue_entry(:'room_id',:'guest_entry');
select public.join_listening_room(:'room_id','Updated name');
select pg_temp.assert_true((select display_name='Updated name' from public.room_members where room_id=:'room_id' and user_id=auth.uid()),'name updates');
-- Host advancement rejects stale commands and cannot skip twice.
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
select public.control_playback(:'room_id',:'first_id',4,'skip',0);
select pg_temp.assert_true((select current_entry_id=:'second_id'::uuid from public.listening_rooms where id=:'room_id'),'advances to next track');
select pg_temp.expect_error(format('select public.control_playback(%L,%L,4,''skip'',0)',:'room_id',:'first_id'),'Playback changed');
select public.control_playback(:'room_id',:'second_id',5,'skip',0);
select pg_temp.assert_true((select current_entry_id is null and not is_playing from public.listening_rooms where id=:'room_id'),'empty queue stops playback');
select public.enqueue_video(:'room_id','dQw4w9WgXcQ') as restart_id \gset
select pg_temp.assert_true((select current_entry_id=:'restart_id'::uuid and is_playing from public.listening_rooms where id=:'room_id'),'new entry restarts empty queue');
rollback;
\echo 'All room permission and playback tests passed.'
