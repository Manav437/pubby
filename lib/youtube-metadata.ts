export interface VideoDetails {
    videoId: string;
    title: string;
    author: string;
}

export function isYouTubeVideoId(value: string): boolean {
    return value.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(value);
}

export function parseVideoDetails(videoId: string, value: unknown): VideoDetails | null {
    if (!isYouTubeVideoId(videoId) || !value || typeof value !== "object") return null;
    const data = value as Record<string, unknown>;
    if (typeof data.title !== "string" || typeof data.author_name !== "string") return null;
    const title = data.title.trim().slice(0, 300);
    const author = data.author_name.trim().slice(0, 150);
    return title && author ? { videoId, title, author } : null;
}

// YouTube provides the uploader/channel name, not verified song-artist metadata.
export function artistOrChannel(details: VideoDetails): string {
    return details.author.replace(/ - Topic$/, "");
}
