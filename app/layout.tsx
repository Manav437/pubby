import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { Inter } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
    title: "Pubby - listen together",
    description: "A small space to share music and videos with friends.",
};

const inter = Inter({ subsets: ["latin"] });


export default function RootLayout({ children }: { children: React.ReactNode }) {
    return <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
            <ThemeProvider>
                {children}
                <Toaster />
            </ThemeProvider>
        </body>
    </html>;
}
