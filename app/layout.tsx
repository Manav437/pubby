import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
    title: "Pubby - listen together",
    description: "A small space to share music and videos with friends.",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-instrument-serif" });


export default function RootLayout({ children }: { children: React.ReactNode }) {
    return <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} ${instrumentSerif.variable} font-sans`}>
            <ThemeProvider>
                {children}
                <Toaster />
            </ThemeProvider>
        </body>
    </html>;
}
