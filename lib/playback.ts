import type { Room } from "./room";
export function playbackPosition(room: Room, now: number): number {
    const elapsed = room.is_playing ? Math.max(0, (now - Date.parse(room.playback_updated_at)) / 1000) : 0;
    return Math.max(0, Math.min(863999, room.playback_seconds + elapsed));
}

export function clampSeek(seconds: number, duration: number): number {
    if (!Number.isFinite(seconds) || !Number.isFinite(duration) || duration <= 0) return 0;
    // Stay just inside the video so a seek to the end does not fire a skip accidentally.
    return Math.max(0, Math.min(seconds, duration - 0.2, 863999));
}
export function formatPlaybackTime(seconds: number): string {
    const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor(total / 60) % 60;
    const remainder = String(total % 60).padStart(2, "0");
    return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${remainder}` : `${minutes}:${remainder}`;
}
