import { supabase } from "./supabase";
export interface Room {
    id: string; host_id: string; current_entry_id: string | null;
    is_playing: boolean; playback_seconds: number; playback_updated_at: string; revision: number;
}
export interface Entry { id: string; room_id: string; added_by: string; display_name: string; video_id: string; position: number; }
export interface Member { user_id: string; display_name: string; last_seen_at: string; }
export interface Message { id: number; user_id: string; display_name: string; body: string; created_at: string; }
export interface Snapshot { server_time: string; room: Room; queue: Entry[]; members: Member[]; messages: Message[]; }
let guestPromise: Promise<string> | null = null;
export async function ensureGuest(): Promise<string> {
    if (!guestPromise) guestPromise = (async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) return session.user.id;
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error || !data.user) throw new Error("Guest sign-in failed. Enable anonymous sign-ins in Supabase Authentication settings.");
        return data.user.id;
    })().catch(error => { guestPromise = null; throw error; });
    return guestPromise;
}
export function guestName() { return localStorage.getItem("pubby-name")?.trim().slice(0, 32) || "Guest"; }
export function errorMessage(error: unknown): string {
    const message = error && typeof error === "object" && "message" in error ? String(error.message) : "Something went wrong. Please try again.";
    if (/schema cache|does not exist|could not find the function/i.test(message)) return "Room setup is pending. Apply the SQL migration in Supabase, then retry.";
    return message;
}
