import Image from "next/image";
import { X, Play, ListMusic } from "lucide-react";
import { Entry } from "@/lib/room";

export function VideoQueue({ queue, currentId, userId, isHost, onRemove, pending }: {
    queue: Entry[]; currentId: string | null; userId: string; isHost: boolean;
    onRemove: (id: string) => void; pending: boolean;
}) {
    return <section className="">
        <div className="flex items-center justify-between border-b border-border pb-3.5 [&>h2]:text-[13px] [&>h2]:font-medium [&>span]:text-[10px]"><h2>Your shared queue</h2><span className="text-muted-foreground">{queue.length} {queue.length === 1 ? "video" : "videos"}</span></div>
        {queue.length ? <ol className="m-0 list-none p-0">{queue.map((video, index) => {
            const playing = video.id === currentId;
            return <li key={video.id} className="group relative flex items-center gap-2.5 border-b border-border py-[15px] data-[playing=true]:-mx-2.5 data-[playing=true]:bg-accent-soft data-[playing=true]:px-2.5 data-[playing=true]:shadow-[inset_2px_0_var(--accent)]" data-playing={playing}>
                <span className="inline-flex min-w-4 items-center justify-center p-0 font-mono text-[10px] text-muted-foreground group-data-[playing=true]:text-accent">{playing ? <Play size={12} aria-label="Now playing"/> : String(index + 1).padStart(2, "0")}</span>
                <a className="h-[42px] w-14 shrink-0 overflow-hidden bg-background [&>img]:h-full [&>img]:w-full [&>img]:object-cover" href={`https://www.youtube.com/watch?v=${video.video_id}`} target="_blank" rel="noopener noreferrer" aria-label={`Open video ${index + 1} on YouTube`}>
                    <Image src={`https://i.ytimg.com/vi/${video.video_id}/default.jpg`} width={64} height={48} alt="" unoptimized/>
                </a>
                <div className="flex min-w-0 flex-1 flex-col gap-[3px] [&>a]:truncate [&>a]:text-[11px] [&>a]:font-medium [&>a:hover]:underline [&>small]:text-[10px] [&>small]:text-muted-foreground [&>small]:[overflow-wrap:anywhere]">
                    <span className="font-mono text-[8px] tracking-[1px] text-muted-foreground uppercase group-data-[playing=true]:text-accent">{playing ? "Now playing" : "Up next"}</span>
                    <a href={`https://www.youtube.com/watch?v=${video.video_id}`} target="_blank" rel="noopener noreferrer">{video.video_id}</a>
                    <small>{video.display_name}{video.added_by === userId ? " · you" : ""}</small>
                </div>
                {!playing && (isHost || video.added_by === userId) && <button className="ml-auto shrink-0 border-0 bg-transparent p-[5px] text-muted-foreground hover:text-foreground" disabled={pending} onClick={() => onRemove(video.id)} aria-label={`Remove video ${index + 1}`} title="Remove from queue"><X size={14}/></button>}
            </li>;
        })}</ol> : <div className="flex flex-col items-start gap-3 py-9 text-muted-foreground [&>svg]:text-accent [&>strong]:text-[13px] [&>strong]:font-medium [&>strong]:text-foreground [&>p]:text-xs [&>p]:leading-[1.7]"><ListMusic size={25} aria-hidden="true"/><strong>A fresh queue.</strong><p>Add a YouTube link to start.<br/>Everyone can bring something good.</p></div>}
    </section>;
}
