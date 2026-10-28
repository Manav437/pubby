import Image from "next/image";
import { X, Play, ListMusic } from "lucide-react";
import { Entry } from "@/lib/room";

export function VideoQueue({ queue, currentId, userId, isHost, onRemove, pending }: {
    queue: Entry[]; currentId: string | null; userId: string; isHost: boolean;
    onRemove: (id: string) => void; pending: boolean;
}) {
    return <section className="queue-section">
        <div className="section-heading"><h2>Your shared queue</h2><span className="muted">{queue.length} {queue.length === 1 ? "video" : "videos"}</span></div>
        {queue.length ? <ol className="queue-list">{queue.map((video, index) => {
            const playing = video.id === currentId;
            return <li key={video.id} className="queue-item" data-playing={playing}>
                <span className="queue-number">{playing ? <Play size={12} aria-label="Now playing"/> : String(index + 1).padStart(2, "0")}</span>
                <a className="queue-thumbnail" href={`https://www.youtube.com/watch?v=${video.video_id}`} target="_blank" rel="noopener noreferrer" aria-label={`Open video ${index + 1} on YouTube`}>
                    <Image src={`https://i.ytimg.com/vi/${video.video_id}/default.jpg`} width={64} height={48} alt="" unoptimized/>
                </a>
                <div className="queue-details">
                    <span className="queue-state">{playing ? "Now playing" : "Up next"}</span>
                    <a href={`https://www.youtube.com/watch?v=${video.video_id}`} target="_blank" rel="noopener noreferrer">{video.video_id}</a>
                    <small>{video.display_name}{video.added_by === userId ? " · you" : ""}</small>
                </div>
                {!playing && (isHost || video.added_by === userId) && <button className="icon-button" disabled={pending} onClick={() => onRemove(video.id)} aria-label={`Remove video ${index + 1}`} title="Remove from queue"><X size={14}/></button>}
            </li>;
        })}</ol> : <div className="queue-empty"><ListMusic size={25} aria-hidden="true"/><strong>A fresh queue.</strong><p>Add a YouTube link to start.<br/>Everyone can bring something good.</p></div>}
    </section>;
}
