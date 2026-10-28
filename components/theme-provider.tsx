"use client";
import { ThemeProvider as Provider, useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return <Provider attribute="class" defaultTheme="dark" enableSystem>{children}</Provider>;
}

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    return <button className="button theme-toggle" aria-label="Toggle light and dark theme"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
        <Sun size={16} className="sun" />
        <Moon size={16} className="moon" />
        {/*<span>
            Theme
        </span>*/}
    </button>;
}
