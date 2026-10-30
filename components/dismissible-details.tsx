"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function DismissibleDetails({ children, className }: { children: ReactNode; className?: string }) {
    const ref = useRef<HTMLDetailsElement>(null);

    useEffect(() => {
        function dismissOutside(event: PointerEvent) {
            const details = ref.current;
            if (details?.open && event.target instanceof Node && !details.contains(event.target)) {
                details.open = false;
            }
        }
        function dismissOnEscape(event: KeyboardEvent) {
            const details = ref.current;
            if (event.key !== "Escape" || !details?.open) return;
            const focusInside = details.contains(document.activeElement);
            details.open = false;
            if (focusInside) {
                event.preventDefault();
                details.querySelector("summary")?.focus();
            }
        }
        document.addEventListener("pointerdown", dismissOutside, true);
        document.addEventListener("keydown", dismissOnEscape);
        return () => {
            document.removeEventListener("pointerdown", dismissOutside, true);
            document.removeEventListener("keydown", dismissOnEscape);
        };
    }, []);

    return <details ref={ref} className={className}>{children}</details>;
}
