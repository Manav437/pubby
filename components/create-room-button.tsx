"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ensureGuest, guestName, errorMessage } from "@/lib/room";
export function CreateRoomButton() {
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
    return <div><button type="button" onClick={create} disabled={pending} className="button primary">{pending ? "Creating room…" : "Create a room"}<ArrowUpRight size={17}/></button>{error && <p role="alert" className="error">{error}</p>}</div>;
}
