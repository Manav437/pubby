"use client";

import Link from "next/link";
import { LogOut, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClassName, primaryButtonClassName } from "@/lib/ui-styles";
import { ThemeToggle } from "./theme-provider";

export function RoomNavbar({ roomId, status, onlineCount, isHost, onInvite }: {
    roomId: string;
    status: string;
    onlineCount?: number;
    isHost: boolean;
    onInvite: () => void;
}) {
    const connected = status === "Connected";

    return <header className="flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-border bg-surface/40 px-4 min-[1001px]:gap-6 min-[1001px]:px-7 max-[380px]:gap-2 max-[380px]:px-3">
        <div className="flex min-w-0 items-center gap-5">
            <Link href="/" aria-label="Pubby home" className="inline-flex shrink-0 items-center gap-2 text-[24px] leading-none font-semibold tracking-[-1.2px] max-[380px]:text-[22px]">
                <span className="flex h-5 items-center gap-[3px] text-accent [&>i]:block [&>i]:w-[3px] [&>i]:bg-current" aria-hidden="true"><i className="h-3"/><i className="h-5"/><i className="h-4"/></span>
                pubby
            </Link>
            <div className="hidden min-w-0 items-center gap-4 min-[641px]:flex">
                <span className="h-5 w-px bg-border" aria-hidden="true"/>
                <div className="flex items-baseline gap-2">
                    <h1 className="text-[11px] text-muted-foreground">Room</h1>
                    <span className="font-mono text-[11px] text-foreground" title={roomId}>{roomId.slice(0, 8)}</span>
                </div>
            </div>
            <h1 className="sr-only min-[641px]:hidden">Listening room {roomId.slice(0, 8)}</h1>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3 text-[11px] text-muted-foreground min-[1001px]:gap-4" role="status">
            <span className="inline-flex items-center gap-2" title={status}>
                <span className={cn("size-[5px] shrink-0", connected ? "bg-accent" : "bg-amber-500")} aria-hidden="true"/>
                <span className="hidden min-[1001px]:inline">{status}</span>
                <span className="sr-only min-[1001px]:hidden">{status}.</span>
            </span>
            {onlineCount !== undefined && <span className="inline-flex items-center gap-1.5 whitespace-nowrap tabular-nums"><Users size={13} className="max-[380px]:hidden" aria-hidden="true"/>{onlineCount}<span className="hidden min-[1001px]:inline">online</span><span className="sr-only min-[1001px]:hidden">online</span></span>}
            {onlineCount !== undefined && <span className="hidden border-l border-border pl-4 text-[10px] min-[1201px]:inline">{isHost ? "You’re the host" : "Guest"}</span>}
        </div>

        <nav className="flex shrink-0 items-center gap-1.5 border-l border-border pl-3 min-[1001px]:ml-1 min-[1001px]:gap-2 min-[1001px]:pl-5 max-[380px]:pl-2" aria-label="Room actions">
            <button type="button" onClick={onInvite} className={cn(primaryButtonClassName, "min-h-9 gap-1.5 px-3 py-1.5 text-[11px] font-medium max-[380px]:px-2")}><UserPlus size={14} aria-hidden="true"/>Invite<span className="hidden min-[1101px]:inline">friends</span></button>
            <ThemeToggle className="size-9 min-h-9 border-transparent p-2 text-muted-foreground hover:border-border hover:text-foreground"/>
            <Link href="/" aria-label="Leave room" title="Leave room" className={cn(buttonClassName, "size-9 min-h-9 border-transparent p-2 text-muted-foreground hover:border-border hover:text-foreground min-[901px]:w-auto min-[901px]:gap-1.5 min-[901px]:px-2.5 min-[901px]:text-[11px]")}><LogOut size={14} aria-hidden="true"/><span className="hidden min-[901px]:inline">Leave</span></Link>
        </nav>
    </header>;
}
