"use client";

import { useEffect, useState } from "react";
import { isYouTubeVideoId, VideoDetails } from "@/lib/youtube-metadata";

// Share in-flight requests between queue rows and now-playing, including repeated tracks.
const cache = new Map<string, { expires: number; promise: Promise<VideoDetails | null> }>();
function loadDetails(videoId: string): Promise<VideoDetails | null> {
    const cached = cache.get(videoId);
    if (cached && cached.expires > Date.now()) return cached.promise;
    const entry = {
        expires: Date.now() + 3600000,
        promise: fetch(`/api/videos/${videoId}`, { signal: AbortSignal.timeout(8000) })
            .then(async response => {
                if (!response.ok) return null;
                return await response.json() as VideoDetails;
            }).catch(() => null),
    };
    cache.set(videoId, entry);
    // Failed lookups can retry after a minute; successful metadata remains cached.
    void entry.promise.then(details => { if (!details) entry.expires = Date.now() + 60000; });
    if (cache.size > 256) cache.delete(cache.keys().next().value!);
    return entry.promise;
}

export function useVideoDetails(videoId: string | null): VideoDetails | null {
    const [details, setDetails] = useState<VideoDetails | null>(null);
    useEffect(() => {
        if (!videoId || !isYouTubeVideoId(videoId)) return;
        const id = videoId;
        let active = true;
        let retry: ReturnType<typeof setTimeout> | undefined;
        async function load() {
            const value = await loadDetails(id);
            if (!active) return;
            setDetails(value);
            if (!value) retry = setTimeout(() => { void load(); }, 60000);
        }
        void load();
        return () => { active = false; clearTimeout(retry); };
    }, [videoId]);
    // Never show the preceding track's metadata while a new lookup is pending.
    return details?.videoId === videoId ? details : null;
}
