"use client";
import { primaryButtonClassName } from "@/lib/ui-styles";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ensureGuest, guestName, errorMessage } from "@/lib/room";
import styles from "./create-room-button.module.css";
export function CreateRoomButton({ className }: { className?: string }) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    async function create() {
        if (pending) return;
        setPending(true); setError("");
        try {
            await ensureGuest();
            const { data, error } = await supabase.rpc("create_listening_room", { p_name: guestName() });
            if (error) throw error;
            router.push(`/room/${data}`);
        } catch (error) { setError(errorMessage(error)); setPending(false); }
    }
    const label = pending ? "Creating room…" : "Create a room";
    return <div><button type="button" onClick={create} disabled={pending} data-create-room className={cn(primaryButtonClassName, styles.roomButton, className)}><span className={styles.labelWindow}><span className={styles.labelTrack}><span>{label}</span><span aria-hidden="true">{label}</span></span></span><ArrowUpRight size={17} aria-hidden="true" /></button>{error && <p role="alert" data-create-error className="my-3 text-[#d95f4e]">{error}</p>}</div>;
}
