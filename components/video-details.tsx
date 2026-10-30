"use client";

import { useVideoDetails } from "@/hooks/use-video-details";
import { artistOrChannel } from "@/lib/youtube-metadata";

export function VideoDetails({ videoId }: { videoId: string }) {
    const details = useVideoDetails(videoId);
    return <>
        <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer" title={details?.title || "Open video on YouTube"}>{details?.title || "YouTube video"}</a>
        <span className="truncate text-[10px] text-muted-foreground" title={details ? `Artist / channel: ${artistOrChannel(details)}` : "Video details unavailable"}>{details ? artistOrChannel(details) : "YouTube"}</span>
    </>;
}
