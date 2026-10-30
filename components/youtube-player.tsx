"use client";
import { buttonClassName } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";

import { playbackPosition, clampSeek, formatPlaybackTime, needsPlaybackSeek } from "@/lib/playback";
import { useCallback, useEffect, useRef, useState } from "react";
import YouTube, { YouTubeProps, YouTubePlayer as Player } from "react-youtube";
import { Music2, Play, Pause, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { Room } from "@/lib/room";

type PlaybackAction = "play" | "pause" | "skip" | "seek";

export function YouTubePlayer({ videoId, room, clockOffset, isHost, busy, onControl }: {
    videoId: string | null;
    room: Room;
    clockOffset: number;
    isHost: boolean;
    busy: boolean;
    onControl: (action: PlaybackAction, seconds?: number) => Promise<boolean>;
}) {
    const player = useRef<Player | null>(null);
    const latest = useRef({ room, clockOffset, isHost, onControl });
    const committing = useRef(false);
    const optimisticRoom = useRef<Room | null>(null);
    const [optimisticPlayback, setOptimisticPlayback] = useState<{ revision: number; playing: boolean } | null>(null);
    const [blocked, setBlocked] = useState(false);
    const [playback, setPlayback] = useState({ current: 0, duration: 0, ready: false });
    const [draft, setDraft] = useState<number | null>(null);

    useEffect(() => { latest.current = { room, clockOffset, isHost, onControl }; }, [room, clockOffset, isHost, onControl]);

    const sync = useCallback((forceSeek = false) => {
        const p = player.current;
        if (!p) return;
        const { room: confirmed, clockOffset: offset } = latest.current;
        const pending = optimisticRoom.current;
        const state = pending && pending.revision >= confirmed.revision ? pending : confirmed;
        const duration = p.getDuration();
        const expected = playbackPosition(state, Date.now() + offset);
        const target = duration > 0 ? clampSeek(expected, duration) : expected;
        if (needsPlaybackSeek(p.getCurrentTime(), target, forceSeek)) p.seekTo(target, true);
        const status = p.getPlayerState();
        if (state.is_playing && status !== 1 && status !== 3 && status !== 0) p.playVideo();
        else if (!state.is_playing && status === 1) p.pauseVideo();
    }, []);

    useEffect(() => {
        sync(true);
        const timer = window.setInterval(() => sync(), 2000);
        return () => clearInterval(timer);
    }, [sync, room.revision]);

    useEffect(() => {
        const timer = window.setInterval(() => {
            const p = player.current;
            if (!p) return;
            const duration = p.getDuration();
            const current = p.getCurrentTime();
            setPlayback({
                current: Number.isFinite(current) ? Math.max(0, current) : 0,
                duration: Number.isFinite(duration) ? Math.max(0, duration) : 0,
                ready: true,
            });
        }, 250);
        return () => { clearInterval(timer); player.current = null; };
    }, []);

    async function act(action: "play" | "pause" | "seek", requestedSeconds?: number) {
        const p = player.current;
        if (!isHost || busy || committing.current || !p) return;
        committing.current = true;
        const state = latest.current.room;
        const current = p.getCurrentTime();
        const seconds = requestedSeconds ?? (Number.isFinite(current) ? current : playbackPosition(state, Date.now() + latest.current.clockOffset));
        const playing = action === "play" ? true : action === "pause" ? false : state.is_playing;
        // Respond locally before waiting for the shared database update.
        optimisticRoom.current = { ...state, is_playing: playing, playback_seconds: seconds, playback_updated_at: new Date(Date.now() + latest.current.clockOffset).toISOString() };
        setOptimisticPlayback({ revision: state.revision, playing });
        if (action === "seek") p.seekTo(seconds, true);
        else if (action === "play") p.playVideo();
        else p.pauseVideo();
        setPlayback(value => ({ ...value, current: seconds }));
        try {
            const accepted = await onControl(action, seconds);
            if (!accepted) {
                optimisticRoom.current = null;
                setOptimisticPlayback(null);
                sync(true);
            }
        } catch {
            optimisticRoom.current = null;
            setOptimisticPlayback(null);
            sync(true);
        } finally { committing.current = false; setDraft(null); }
    }

    async function seekTo(seconds: number) {
        if (!playback.duration) return;
        await act("seek", clampSeek(seconds, playback.duration));
    }

    const opts: YouTubeProps["opts"] = {
        height: "100%",
        width: "100%",
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, playsinline: 1, rel: 0 },
    };
    const canSeek = Boolean(videoId && playback.ready && playback.duration > 0 && isHost && !busy);
    const isPlaying = optimisticPlayback && room.revision <= optimisticPlayback.revision ? optimisticPlayback.playing : room.is_playing;
    const position = draft ?? Math.min(playback.current, playback.duration || playback.current);

    return <>
        <div className="aspect-video w-full border-0 bg-[#0b0d0a] min-[761px]:min-h-0 min-[761px]:flex-1 min-[761px]:aspect-auto [&>div]:h-full [&>div]:w-full [&_iframe]:h-full [&_iframe]:w-full">
            {videoId ? <YouTube
                videoId={videoId}
                opts={opts}
                onReady={event => { player.current = event.target; sync(true); }}
                onPlay={() => setBlocked(false)}
                onEnd={() => { if (latest.current.isHost) void latest.current.onControl("skip"); }}
                onError={() => toast.error(isHost ? "This video cannot play. Use Skip to continue." : "This video cannot play. Ask the host to skip it.")}
                onStateChange={event => { if (event.data === -1 && latest.current.room.is_playing) setBlocked(true); }}
                className="w-full h-full"
            /> : <div className="flex h-full flex-col items-center justify-center gap-2.5 p-5 text-center text-[#a1a898] [&>strong]:text-lg [&>strong]:font-medium [&>strong]:text-[#e8ebe3]"><Music2 size={28}/><strong>A little quiet in here.</strong><span>Add a video to start listening.</span></div>}
        </div>
        <div className="shrink-0 border-b border-border pt-2.5 pb-3.5" aria-label="Playback controls">
            <div className="flex items-center gap-4 max-[480px]:gap-2.5">
                <label className="sr-only" htmlFor="playback-timeline">Video timeline</label>
                <input
                    className="m-0 h-7 w-full min-w-0 flex-1 cursor-pointer border-0 bg-transparent p-0 accent-accent disabled:cursor-default disabled:opacity-65"
                    id="playback-timeline"
                    type="range"
                    min={0}
                    max={playback.duration || 1}
                    step={0.1}
                    value={position}
                    disabled={!canSeek}
                    aria-valuetext={`${formatPlaybackTime(position)} of ${formatPlaybackTime(playback.duration)}`}
                    aria-describedby="timeline-help"
                    onChange={event => setDraft(Number(event.target.value))}
                    onPointerDown={event => event.currentTarget.setPointerCapture(event.pointerId)}
                    onPointerUp={event => { void seekTo(Number(event.currentTarget.value)); }}
                    onPointerCancel={() => setDraft(null)}
                    onKeyUp={event => {
                        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)) void seekTo(Number(event.currentTarget.value));
                    }}
                    onBlur={event => { if (draft !== null) void seekTo(Number(event.currentTarget.value)); }}
                />
                <span className="text-xs whitespace-nowrap tabular-nums">{formatPlaybackTime(position)} <span className="text-muted-foreground">/ {playback.duration ? formatPlaybackTime(playback.duration) : "—:—"}</span></span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-4 max-[480px]:flex-wrap max-[480px]:gap-2.5">
                {isHost && <div className="flex items-center gap-3">
                    <button className={buttonClassName} onClick={() => act(isPlaying ? "pause" : "play")} disabled={!videoId || busy}>
                        {isPlaying ? <Pause size={15}/> : <Play size={15}/>}{isPlaying ? "Pause" : "Play"}
                    </button>
                    <button className={buttonClassName} onClick={() => onControl("skip")} disabled={!videoId || busy}><SkipForward size={15}/>Skip</button>
                </div>}
                {videoId && <button className={cn(buttonClassName, "ml-auto text-left text-xs whitespace-normal")} onClick={() => { if (room.is_playing) player.current?.playVideo(); else { player.current?.playVideo(); player.current?.pauseVideo(); } setBlocked(false); }}>{blocked ? "Browser blocked autoplay — click to enable playback" : "Enable playback on this device"}</button>}
                <p className="sr-only" id="timeline-help">{!videoId ? "Add a video to begin." : !playback.duration ? "Waiting for video duration…" : isHost ? "Drag the timeline to seek for everyone." : "Playback and seeking follow the host."}</p>
            </div>
        </div>
    </>;
}
