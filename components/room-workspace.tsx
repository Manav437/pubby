"use client";

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

    return <main className="room-workspace">
        <section className="room-stage" aria-label="Video player">
            <div className="stage-heading"><span className="eyebrow">{current ? "Now playing" : "Ready when you are"}</span><span className="muted">{current ? `Added by ${current.display_name}` : "Your room, your soundtrack"}</span></div>
            <div className="stage-player"><YouTubePlayer key={current?.id || "empty"} videoId={current?.video_id || null} room={room} clockOffset={clockOffset} isHost={isHost} busy={busy} onControl={onControl} /></div>
            <div className="stage-add">
                <AddVideoForm roomId={room.id} onAdded={onRefresh} />
                {/*<p className="help">
                    {isHost ? "You control the room. Keep this tab open to advance the queue." : "Listening with the host. Enable playback if your browser blocks audio."}
                </p>*/}
            </div>
        </section>
        <aside className="room-panel" aria-label="Room activity">
            <div className="room-tabs" role="tablist" aria-label="Room panels">{tabs.map(({ id, label, icon: Icon }, index) => <button key={id} ref={element => { tabButtons.current[index] = element; }} id={`tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls={`panel-${id}`} tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)} onKeyDown={event => {
                let next = index;
                if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
                else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
                else if (event.key === "Home") next = 0;
                else if (event.key === "End") next = tabs.length - 1;
                else return;
                event.preventDefault(); setTab(tabs[next].id); tabButtons.current[next]?.focus();
            }}><Icon size={15} />{label}<span className="tab-count">{id === "queue" ? snapshot.queue.length : id === "people" ? snapshot.members.length : snapshot.messages.length}</span></button>)}</div>
            <div id="panel-queue" role="tabpanel" aria-labelledby="tab-queue" hidden={tab !== "queue"} tabIndex={0} className="room-tab-content queue-panel"><VideoQueue queue={snapshot.queue} currentId={room.current_entry_id} userId={userId} isHost={isHost} onRemove={onRemove} pending={busy} /><p className="panel-note">Everyone can add videos. {isHost ? "You can remove any queued video." : "You can remove the videos you add."}</p></div>
            <div id="panel-chat" role="tabpanel" aria-labelledby="tab-chat" hidden={tab !== "chat"} tabIndex={0} className="room-tab-content chat-panel"><RoomChat userId={userId} roomId={room.id} messages={snapshot.messages} onSent={onRefresh} active={tab === "chat"} /></div>
            <div id="panel-people" role="tabpanel" aria-labelledby="tab-people" hidden={tab !== "people"} tabIndex={0} className="room-tab-content people-panel"><section><div className="section-heading"><h2>In the room</h2><span className="muted">{snapshot.members.length} online</span></div><ul className="member-list">{snapshot.members.map(member => <li key={member.user_id}><span className="member-name"><span className="member-initial" aria-hidden="true">{member.display_name.slice(0, 1).toUpperCase()}</span><span>{member.display_name}{member.user_id === userId ? " (you)" : ""}</span></span><span className="muted">{member.user_id === room.host_id ? "Host" : "Guest"}</span></li>)}</ul></section><form className="panel-identity" onSubmit={onSaveName}><label htmlFor="guest-name">Your display name</label><div className="form-row"><input id="guest-name" required maxLength={32} value={name} onChange={event => onNameChange(event.target.value)} /><button className="button" disabled={savingName || !name.trim()}>Save</button></div></form></div>
            <div className="room-panel-footer"><span className="connection-indicator connected" aria-hidden="true" />Shared queue · YouTube</div>
        </aside>
    </main>;
}
