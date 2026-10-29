"use client";
import { cn } from "@/lib/utils";
import { buttonClassName } from "@/lib/ui-styles";
import { ThemeProvider as Provider, useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return <Provider attribute="class" defaultTheme="dark" enableSystem>{children}</Provider>;
}

export function ThemeToggle({ className }: { className?: string }) {
    const { resolvedTheme, setTheme } = useTheme();
    return <button data-theme-toggle className={cn(buttonClassName, className)} aria-label="Toggle light and dark theme"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
        <Sun size={16} className="hidden dark:block" />
        <Moon size={16} className="dark:hidden" />
        {/*<span>
            Theme
        </span>*/}
    </button>;
}
