"use client";
import { playbackPosition } from "@/lib/playback";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Copy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { RoomWorkspace } from "@/components/room-workspace";
import { ThemeToggle } from "@/components/theme-provider";
import { Snapshot, ensureGuest, guestName, errorMessage } from "@/lib/room";
import { toast } from "sonner";
export default function RoomClient({ roomId }: { roomId: string }) {
    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
    const [userId, setUserId] = useState("");
    const [name, setName] = useState("Guest");
    const [status, setStatus] = useState("Joining…");
    const [error, setError] = useState("");
    const [retry, setRetry] = useState(0);
    const [busy, setBusy] = useState(false);
    const [savingName, setSavingName] = useState(false);
    const [clockOffset, setClockOffset] = useState(0);
    const active = useRef(false);
    const request = useRef(0);
    const mutation = useRef(false);
    const refresh = useCallback(async () => {
        const sequence = ++request.current;
        const start = Date.now();
        const { data, error } = await supabase.rpc("room_snapshot", { p_room: roomId });
        if (error) throw error;
        if (!active.current || sequence !== request.current) return;
        const state = data as Snapshot;
        setClockOffset(Date.parse(state.server_time) - (start + Date.now()) / 2);
        setSnapshot(state);
    }, [roomId]);
    useEffect(() => {
        let cancelled = false;
        active.current = true;
        request.current++;
        let channel: ReturnType<typeof supabase.channel> | undefined;
        let timer: ReturnType<typeof setInterval> | undefined;
        const update = () => { void refresh().then(() => { if (!cancelled) setStatus("Connected"); }).catch(() => { if (!cancelled) setStatus("Reconnecting…"); }); };
        async function join() {
            try {
                const id = await ensureGuest();
                if (cancelled) return;
                const displayName = guestName();
                setUserId(id); setName(displayName); setError("");
                const { error } = await supabase.rpc("join_listening_room", { p_room: roomId, p_name: displayName });
                if (error) throw error;
                if (cancelled) return;
                await refresh();
                if (cancelled) return;
                setStatus("Connected");
                channel = supabase.channel(`listening-${roomId}`);
                for (const table of ["listening_rooms", "queue_entries", "room_messages"]) {
                    channel = channel.on("postgres_changes", { event: "*", schema: "public", table, filter: `${table === "listening_rooms" ? "id" : "room_id"}=eq.${roomId}` }, update);
                }
                channel.subscribe(state => { if (!cancelled) { setStatus(state === "SUBSCRIBED" ? "Connected" : "Reconnecting…"); if (state === "SUBSCRIBED") update(); } });
                timer = setInterval(update, 10000);
                window.addEventListener("focus", update);
            } catch (error) { if (!cancelled) { setError(errorMessage(error)); setStatus("Could not join"); } }
        }
        void join();
        return () => { cancelled = true; active.current = false; clearInterval(timer); window.removeEventListener("focus", update); if (channel) void supabase.removeChannel(channel); };
    }, [roomId, refresh, retry]);
    async function control(action: "play" | "pause" | "skip" | "seek", requestedSeconds?: number) {
        if (!snapshot || mutation.current) return false;
        mutation.current = true; setBusy(true);
        try {
            const room = snapshot.room;
            const seconds = requestedSeconds ?? playbackPosition(room, Date.now() + clockOffset);
            if (!Number.isFinite(seconds) || seconds < 0 || seconds >= 864000) throw new Error("Enter a valid number of seconds.");
            const { error } = await supabase.rpc("control_playback", { p_room: roomId, p_entry: room.current_entry_id, p_revision: room.revision, p_action: action, p_seconds: seconds });
            if (error) throw error;
            await refresh();
            return true;
        } catch (error) { toast.error(errorMessage(error)); void refresh().catch(() => { }); return false; }
        finally { mutation.current = false; setBusy(false); }
    }
    async function remove(id: string) {
        if (mutation.current) return;
        mutation.current = true; setBusy(true);
        try { const { error } = await supabase.rpc("remove_queue_entry", { p_room: roomId, p_entry: id }); if (error) throw error; await refresh(); }
        catch (error) { toast.error(errorMessage(error)); }
        finally { mutation.current = false; setBusy(false); }
    }
    async function saveName(event: React.FormEvent) {
        event.preventDefault(); setSavingName(true);
        try { const { error } = await supabase.rpc("join_listening_room", { p_room: roomId, p_name: name.trim() }); if (error) throw error; localStorage.setItem("pubby-name", name.trim()); await refresh(); toast.success("Name updated"); }
        catch (error) { toast.error(errorMessage(error)); }
        finally { setSavingName(false); }
    }
    async function copy() {
        try { await navigator.clipboard.writeText(window.location.href); toast.success("Room link copied"); }
        catch { toast.error("Could not copy. Share the URL from your address bar."); }
    }
    const room = snapshot?.room;
    const isHost = room?.host_id === userId;
    return <div className="room-app">
        <header className="room-topbar">
            <div className="room-topbar-start">
                <Link href="/" className="brand"><span className="brand-mark">ııı</span>pubby</Link>
                <span className="room-topbar-divider" />
                <div className="room-address">
                    {/*<Headphones size={15} />*/}
                    <div className="flex flex-col items-start">
                        <h1>Room ID</h1>
                        <span className="room-id">
                            {roomId.slice(0, 8)}
                        </span>
                    </div>
                </div>
                <div className="room-topbar-status" role="status">
                    <span className={`connection-indicator ${status === "Connected" ? "connected" : ""}`} aria-hidden="true" />
                    <span className="connection-label">{status}</span>
                    <span className="sr-only mobile-connection-label">{status}.</span>
                    {snapshot && <><span className="status-separator" aria-hidden="true">·</span><span>{snapshot.members.length} online</span><span className="room-role">· {isHost ? "Host" : "Guest"}</span></>}
                </div>
            </div>
            <div className="header-actions">
                <button className="button primary" onClick={copy}><Copy size={14} />Invite</button>
                <ThemeToggle />
                <Link href="/" className="button room-leave"><ArrowLeft size={14} /><span>Leave</span></Link>
            </div>
        </header>
        {error ? <main className="room-error"><p role="alert" className="error">{error}</p><button className="button" onClick={() => { setError(""); setRetry(v => v + 1); }}>Retry</button><p className="help">Older rooms use the previous schema. Create a new room after applying the migration.</p></main> : !snapshot || !room ? <main className="room-loading">Joining the room…</main> :
            <RoomWorkspace snapshot={snapshot} userId={userId} name={name} onNameChange={setName} onSaveName={saveName} savingName={savingName} busy={busy} clockOffset={clockOffset} onControl={control} onRemove={remove} onRefresh={refresh} />}
    </div>;
}
