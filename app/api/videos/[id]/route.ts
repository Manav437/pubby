import { NextResponse } from "next/server";
import { isYouTubeVideoId, parseVideoDetails } from "@/lib/youtube-metadata";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!isYouTubeVideoId(id)) return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });

    // Never accept an arbitrary URL: the upstream host and watch URL are fixed.
    const endpoint = new URL("https://www.youtube.com/oembed");
    endpoint.searchParams.set("url", `https://www.youtube.com/watch?v=${id}`);
    endpoint.searchParams.set("format", "json");
    try {
        const response = await fetch(endpoint, { signal: AbortSignal.timeout(5000), next: { revalidate: 86400 } });
        if (!response.ok) {
            const status = response.status === 404 || response.status === 401 || response.status === 403 ? 404 : 502;
            return NextResponse.json({ error: "Video details unavailable" }, { status, headers: { "Cache-Control": status === 404 ? "public, max-age=60" : "no-store" } });
        }
        const details = parseVideoDetails(id, await response.json());
        if (!details) throw new Error("Invalid video metadata");
        return NextResponse.json(details, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
    } catch {
        return NextResponse.json({ error: "Video details temporarily unavailable" }, { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "30" } });
    }
}
