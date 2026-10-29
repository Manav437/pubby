"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Message, errorMessage } from "@/lib/room";

export function RoomChat({ roomId, messages, onSent, active = true, userId }: {
    roomId: string; messages: Message[]; onSent: () => Promise<void>; active?: boolean; userId?: string;
}) {
    const [body, setBody] = useState("");
    const [pending, setPending] = useState(false);
    const list = useRef<HTMLDivElement>(null);
    const form = useRef<HTMLFormElement>(null);
    const follow = useRef(true);
    const lastId = messages.at(-1)?.id;
    useEffect(() => { if (active && follow.current) list.current?.scrollTo({ top: list.current.scrollHeight }); }, [lastId, active]);

    async function send(event: React.FormEvent) {
        event.preventDefault();
        if (!body.trim() || pending) return;
        setPending(true);
        try {
            const { error } = await supabase.rpc("send_room_message", { p_room: roomId, p_body: body.trim() });
            if (error) throw error;
            setBody(""); follow.current = true; await onSent();
        } catch (error) { toast.error(errorMessage(error)); }
        finally { setPending(false); }
    }

    return <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border pb-3.5 [&>h2]:text-[13px] [&>h2]:font-medium [&>span]:text-[10px]"><h2>Room chat</h2><span className="text-muted-foreground">Latest 50 messages</span></div>
        <div ref={list} className="min-h-[180px] flex-1 overflow-y-auto pt-5 pb-3 [scrollbar-width:thin] min-[761px]:min-h-0" role="log" aria-label="Room messages" aria-live="polite" onScroll={event => {
            const element = event.currentTarget;
            follow.current = element.scrollHeight - element.scrollTop - element.clientHeight < 64;
        }}>
            {messages.length ? messages.map(message => <div className="group mb-[22px] flex gap-2.5 [overflow-wrap:anywhere]" key={message.id} data-own={message.user_id === userId}>
                <span className="inline-flex size-[26px] shrink-0 items-center justify-center border border-border bg-background text-[10px] text-muted-foreground group-data-[own=true]:border-transparent group-data-[own=true]:bg-accent-soft group-data-[own=true]:text-accent" aria-hidden="true">{message.display_name.slice(0, 1).toUpperCase()}</span>
                <div className="min-w-0 flex-1 [&>p]:text-xs [&>p]:leading-[1.75] [&>p]:whitespace-pre-wrap [&>p]:[overflow-wrap:anywhere]"><div className="mb-1 flex items-baseline justify-between gap-2.5 [&>strong]:mr-2.5 [&>strong]:text-[11px] [&>strong]:font-medium [&>strong]:text-foreground [&>strong]:[overflow-wrap:anywhere] [&>time]:shrink-0 [&>time]:font-mono [&>time]:text-[9px] [&>time]:whitespace-nowrap [&>time]:text-muted-foreground"><strong>{message.display_name}{message.user_id === userId && <span className="ml-1.5 text-[9px] text-accent">you</span>}</strong><time dateTime={message.created_at} title={new Date(message.created_at).toLocaleString()}>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div><p>{message.body}</p></div>
            </div>) : <div className="flex flex-col items-start gap-3 py-9 text-muted-foreground [&>svg]:text-accent [&>strong]:text-[13px] [&>strong]:font-medium [&>strong]:text-foreground [&>p]:text-xs [&>p]:leading-[1.7]"><MessageSquare size={25} aria-hidden="true" /><strong>Good music starts conversations.</strong><p>Say hello or share what’s on repeat.</p></div>}
        </div>
        <form ref={form} onSubmit={send} className="shrink-0 border border-border bg-background p-2.5 focus-within:border-accent">
            <label className="sr-only" htmlFor="chat-message">Message</label>
            <textarea className="block min-h-[42px] w-full resize-none rounded-none border-0 bg-transparent p-0 text-xs leading-[1.7] text-foreground placeholder:text-muted-foreground focus-visible:outline-none" id="chat-message" rows={2} maxLength={500} readOnly={pending} aria-busy={pending} placeholder="Say something…" value={body} onChange={event => setBody(event.target.value)} onKeyDown={event => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); form.current?.requestSubmit(); }
            }} />
            <div className="flex items-center justify-between gap-2.5 pt-1.5 [&>span]:text-[9px] [&>span]:text-muted-foreground"><span>{body.length ? `${body.length}/500` : "Enter to send · Shift+Enter for a new line"}</span><button className="inline-flex min-h-7 items-center justify-center gap-2 rounded-[2px] border border-transparent bg-accent-soft px-2 py-[5px] text-accent hover:bg-surface" aria-label="Send message" disabled={pending || !body.trim()}><Send size={14} /></button></div>
        </form>
    </section>;
}
