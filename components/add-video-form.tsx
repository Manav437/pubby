"use client";
import { primaryButtonClassName, inputClassName } from "@/lib/ui-styles";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { extractVideoId } from "@/lib/videos";
import { errorMessage } from "@/lib/room";
export function AddVideoForm({ roomId, onAdded }: { roomId: string; onAdded: () => Promise<void> }) {
    const [url, setUrl] = useState("");
    const [pending, setPending] = useState(false);
    async function submit(event: React.FormEvent) {
        event.preventDefault();
        if (pending) return;
        const id = extractVideoId(url.trim());
        if (!id) { toast.error("Enter a valid YouTube video link."); return; }
        setPending(true);
        try {
            const { error } = await supabase.rpc("enqueue_video", { p_room: roomId, p_video: id });
            if (error) throw error;
            setUrl("");
            await onAdded();
        } catch (error) { toast.error(errorMessage(error)); }
        finally { setPending(false); }
    }
    return <form onSubmit={submit} className="[&>label]:mb-2 [&>label]:block [&>label]:text-xs [&>label]:font-semibold">
        <label htmlFor="video-url">Add something to the queue</label>
        <div className="flex gap-2 max-[480px]:flex-wrap [&>input]:max-[480px]:flex-[1_1_180px]">
            <input className={inputClassName} id="video-url" type="url" required placeholder="Paste a YouTube video link" value={url} onChange={e => setUrl(e.target.value)} />
            <button className={primaryButtonClassName} disabled={pending}><Plus size={16} />{pending ? "Adding…" : "Add video"}</button>
        </div>
        {/*<p className="help">YouTube videos, Shorts, and live links are supported.</p>*/}
    </form>;
}
