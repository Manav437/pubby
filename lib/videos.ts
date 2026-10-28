export function extractVideoId(value: string): string | null {
    try {
        const url = new URL(value);
        if (url.protocol !== "https:" && url.protocol !== "http:") return null;
        const host = url.hostname.toLowerCase().replace(/^www\./, "");
        let id: string | null = null;
        if (host === "youtu.be") id = url.pathname.split("/")[1];
        else if (["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)) {
            if (url.pathname === "/watch") id = url.searchParams.get("v");
            else if (/^\/(embed|shorts|live)\//.test(url.pathname)) id = url.pathname.split("/")[2];
        }
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    } catch { return null; }
}
