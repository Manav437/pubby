"use client";
import { useVideoDetails } from "@/hooks/use-video-details";
import { artistOrChannel } from "@/lib/youtube-metadata";
import { buttonClassName, inputClassName } from "@/lib/ui-styles";

import { useState, useRef } from "react";
import { ListMusic, MessageSquare, Users } from "lucide-react";
import { Snapshot } from "@/lib/room";
import { YouTubePlayer } from "./youtube-player";
import { AddVideoForm } from "./add-video-form";
import { VideoQueue } from "./video-queue";
import { RoomChat } from "./room-chat";

type Tab = "queue" | "chat" | "people";
const tabs = [
    { id: "queue" as const, label: "Queue", icon: ListMusic },
    { id: "chat" as const, label: "Chat", icon: MessageSquare },
    { id: "people" as const, label: "People", icon: Users },
];

export function RoomWorkspace({ snapshot, userId, name, onNameChange, onSaveName, savingName, busy, clockOffset, onControl, onRemove, onRefresh }: {
    snapshot: Snapshot;
    userId: string;
    name: string;
    onNameChange: (name: string) => void;
    onSaveName: (event: React.FormEvent) => void;
    savingName: boolean;
    busy: boolean;
    clockOffset: number;
    onControl: (action: "play" | "pause" | "skip" | "seek", seconds?: number) => Promise<boolean>;
    onRemove: (id: string) => void;
    onRefresh: () => Promise<void>;
}) {
    const [tab, setTab] = useState<Tab>("queue");
    const tabButtons = useRef<Array<HTMLButtonElement | null>>([]);
    const room = snapshot.room;
    const isHost = room.host_id === userId;
    const current = snapshot.queue.find(video => video.id === room.current_entry_id);
    const details = useVideoDetails(current?.video_id || null);

    return <main className="grid min-h-[calc(100dvh-68px)] grid-cols-1 min-[761px]:h-full min-[761px]:min-h-0 min-[761px]:grid-cols-[minmax(0,1fr)_320px] min-[761px]:overflow-hidden min-[1001px]:grid-cols-[minmax(0,1fr)_360px] min-[1800px]:grid-cols-[minmax(0,1fr)_400px]">
        <section className="min-w-0 px-4 pt-5 pb-7 min-[761px]:grid min-[761px]:min-h-0 min-[761px]:grid-rows-[auto_minmax(0,1fr)_auto] min-[761px]:overflow-auto min-[761px]:px-5 min-[761px]:py-[18px] min-[1001px]:px-7 min-[1800px]:px-10" aria-label="Video player">
            <div className="mb-4 flex min-w-0 items-center justify-between gap-4 text-[11px] min-[761px]:mb-3 min-[761px]:text-xs">
                <div className="min-w-0"><span className="text-[10px] font-semibold tracking-[1px] text-accent uppercase">{current ? "Now playing" : "Ready when you are"}</span>{current && <h2 className="mt-1 truncate text-sm font-medium" title={details?.title}>{details?.title || "YouTube video"}</h2>}{details && <p className="truncate text-[11px] text-muted-foreground" title="Artist / YouTube channel">{artistOrChannel(details)}</p>}</div>
                <span className="shrink-0 text-[11px] text-muted-foreground">{current ? `Added by ${current.display_name}` : "Your room, your soundtrack"}</span>
            </div>
            <div className="mx-auto w-full max-w-[1600px] min-[761px]:flex min-[761px]:min-h-0 min-[761px]:flex-col"><YouTubePlayer key={current?.id || "empty"} videoId={current?.video_id || null} room={room} clockOffset={clockOffset} isHost={isHost} busy={busy} onControl={onControl} /></div>
            <div className="mx-auto max-w-[1600px] pt-6 min-[761px]:w-full min-[761px]:pt-4">
                <AddVideoForm roomId={room.id} onAdded={onRefresh} />

            </div>
        </section>
        <aside className="flex h-[500px] min-w-0 flex-col border-t border-border bg-surface min-[761px]:h-full min-[761px]:min-h-0 min-[761px]:border-t-0 min-[761px]:border-l" aria-label="Room activity">
            <div className="flex shrink-0 border-b border-border" role="tablist" aria-label="Room panels">{tabs.map(({ id, label, icon: Icon }, index) => <button key={id} ref={element => { tabButtons.current[index] = element; }} className="flex flex-1 items-center justify-center gap-1.5 border-0 border-b-2 border-transparent bg-transparent px-1.5 pt-[18px] pb-[15px] text-xs text-muted-foreground hover:text-foreground aria-selected:border-accent aria-selected:bg-background aria-selected:text-accent" id={`tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls={`panel-${id}`} tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)} onKeyDown={event => {
                let next = index;
                if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
                else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
                else if (event.key === "Home") next = 0;
                else if (event.key === "End") next = tabs.length - 1;
                else return;
                event.preventDefault(); setTab(tabs[next].id); tabButtons.current[next]?.focus();
            }}><Icon size={15} />{label}<span className="text-[10px] tabular-nums opacity-70">{id === "queue" ? snapshot.queue.length : id === "people" ? snapshot.members.length : snapshot.messages.length}</span></button>)}</div>
            <div id="panel-queue" role="tabpanel" aria-labelledby="tab-queue" hidden={tab !== "queue"} tabIndex={0} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 min-[761px]:p-[18px] min-[1001px]:p-[22px] [&[hidden]]:hidden"><VideoQueue queue={snapshot.queue} currentId={room.current_entry_id} userId={userId} isHost={isHost} onRemove={onRemove} pending={busy} /><p className="pt-5 text-[11px] text-muted-foreground">Everyone can add videos. {isHost ? "You can remove any queued video." : "You can remove the videos you add."}</p></div>
            <div id="panel-chat" role="tabpanel" aria-labelledby="tab-chat" hidden={tab !== "chat"} tabIndex={0} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5 min-[761px]:p-[18px] min-[1001px]:p-[22px] [&[hidden]]:hidden"><RoomChat userId={userId} roomId={room.id} messages={snapshot.messages} onSent={onRefresh} active={tab === "chat"} /></div>
            <div id="panel-people" role="tabpanel" aria-labelledby="tab-people" hidden={tab !== "people"} tabIndex={0} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 min-[761px]:p-[18px] min-[1001px]:p-[22px] [&[hidden]]:hidden"><section><div className="flex items-center justify-between border-b border-border pb-3.5 [&>h2]:text-[13px] [&>h2]:font-medium [&>span]:text-[10px]"><h2>In the room</h2><span className="text-muted-foreground">{snapshot.members.length} online</span></div><ul className="m-0 list-none pt-3 pb-5 [&>li]:flex [&>li]:items-center [&>li]:justify-between [&>li]:gap-2.5 [&>li]:py-2 [&>li]:text-xs [&>li]:[overflow-wrap:anywhere]">{snapshot.members.map(member => <li key={member.user_id}><span className="flex min-w-0 items-center gap-2.5"><span className="flex size-7 shrink-0 items-center justify-center border border-border bg-background text-[11px] text-accent" aria-hidden="true">{member.display_name.slice(0, 1).toUpperCase()}</span><span>{member.display_name}{member.user_id === userId ? " (you)" : ""}</span></span><span className="text-muted-foreground">{member.user_id === room.host_id ? "Host" : "Guest"}</span></li>)}</ul></section><form className="mt-6 border-t border-border pt-6 [&>label]:mb-2 [&>label]:block [&>label]:text-xs [&>label]:font-semibold" onSubmit={onSaveName}><label htmlFor="guest-name">Your display name</label><div className="flex gap-2 max-[480px]:flex-wrap"><input className={inputClassName} id="guest-name" required maxLength={32} value={name} onChange={event => onNameChange(event.target.value)} /><button className={buttonClassName} disabled={savingName || !name.trim()}>Save</button></div></form></div>
            <div className="flex shrink-0 items-center gap-2 border-t border-border px-4 py-3 text-[10px] text-muted-foreground min-[761px]:px-[22px] min-[761px]:py-3.5"><span className="inline-block size-1.5 shrink-0 bg-accent" aria-hidden="true" />Shared queue · YouTube</div>
        </aside>
    </main>;
}
