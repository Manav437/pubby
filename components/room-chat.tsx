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

    return <section className="chat">
        <div className="section-heading"><h2>Room chat</h2><span className="muted">Latest 50 messages</span></div>
        <div ref={list} className="messages" role="log" aria-label="Room messages" aria-live="polite" onScroll={event => {
            const element = event.currentTarget;
            follow.current = element.scrollHeight - element.scrollTop - element.clientHeight < 64;
        }}>
            {messages.length ? messages.map(message => <div className="message" key={message.id} data-own={message.user_id === userId}>
                <span className="message-avatar" aria-hidden="true">{message.display_name.slice(0, 1).toUpperCase()}</span>
                <div className="message-content"><div className="message-meta"><strong>{message.display_name}{message.user_id === userId && <span className="message-you">you</span>}</strong><time dateTime={message.created_at} title={new Date(message.created_at).toLocaleString()}>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div><p>{message.body}</p></div>
            </div>) : <div className="chat-empty"><MessageSquare size={25} aria-hidden="true"/><strong>Good music starts conversations.</strong><p>Say hello or share what’s on repeat.</p></div>}
        </div>
        <form ref={form} onSubmit={send} className="chat-composer">
            <label className="sr-only" htmlFor="chat-message">Message</label>
            <textarea id="chat-message" rows={2} maxLength={500} readOnly={pending} aria-busy={pending} placeholder="Say something…" value={body} onChange={event => setBody(event.target.value)} onKeyDown={event => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); form.current?.requestSubmit(); }
            }}/>
            <div className="composer-bottom"><span>{body.length ? `${body.length}/500` : "Enter to send · Shift+Enter for a new line"}</span><button className="button" aria-label="Send message" disabled={pending || !body.trim()}><Send size={14}/></button></div>
        </form>
    </section>;
}
