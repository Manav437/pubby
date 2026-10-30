import Image from "next/image";
import Link from "next/link";
import { Headphones, Link2, ListMusic, MessageSquare } from "lucide-react";
import { DismissibleDetails } from "@/components/dismissible-details";
import { CreateRoomButton } from "@/components/create-room-button";
import { ThemeToggle } from "@/components/theme-provider";
import styles from "./landing.module.css";
import { cn } from "@/lib/utils";

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const { error } = await searchParams;

    return <div className={cn(styles.page, "relative isolate grid h-dvh min-h-svh grid-rows-[88px_minmax(0,1fr)_44px] overflow-auto bg-[#f6f2e7] text-[var(--landing-ink)] dark:bg-[#1a2a30] max-[600px]:min-h-[680px] max-[600px]:grid-rows-[72px_minmax(0,1fr)_44px]")}>
        <div className={cn(styles.scenery, "pointer-events-none absolute inset-0 -z-2 overflow-hidden")} aria-hidden="true">
            <Image src="/images/pubby-san-francisco-color.png"
                alt="" fill priority sizes="(max-width: 600px) 1200px, 100vw"
                quality={90}
                className={cn(styles.background, "object-cover object-bottom max-[900px]:object-[55%_bottom] max-[600px]:object-[62%_bottom]")}
            />
        </div>
        <header className="relative z-2 mx-auto flex w-[min(1240px,calc(100%-96px))] items-center justify-between gap-6 max-[900px]:w-[calc(100%-48px)] max-[600px]:w-[calc(100%-40px)] max-[600px]:gap-4">
            <Link href="/" className="inline-flex items-center gap-2.5 text-[29px] font-semibold tracking-[-1.5px] max-[600px]:text-[27px]" aria-label="Pubby home">
                <span className="flex h-[23px] items-center gap-[3px] text-[#52653e] dark:text-[#c7d6b8] [&>i]:block [&>i]:h-3 [&>i]:w-[3px] [&>i]:bg-current [&>i:nth-child(2)]:h-[22px] [&>i:nth-child(3)]:h-4" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                </span>
                pubby
            </Link>

            <nav className="flex items-center gap-6 max-[600px]:gap-4" aria-label="Main navigation">
                <DismissibleDetails className="relative text-xs [&>summary]:cursor-pointer [&>summary]:list-none [&>summary]:py-2.5 [&>summary]:text-[var(--landing-muted)] [&>summary::-webkit-details-marker]:hidden [&>summary:hover]:text-[var(--landing-ink)] [&[open]>summary]:text-[var(--landing-ink)] [&>ol]:absolute [&>ol]:top-11 [&>ol]:right-0 [&>ol]:m-0 [&>ol]:grid [&>ol]:w-[300px] [&>ol]:list-none [&>ol]:gap-5 [&>ol]:border [&>ol]:border-[var(--landing-line)] [&>ol]:bg-[var(--landing-panel)] [&>ol]:p-5 [&>ol]:shadow-[0_12px_30px_#293c2410] max-[600px]:[&>ol]:-right-[52px] max-[600px]:[&>ol]:w-[min(300px,calc(100vw-40px))] [&_li]:flex [&_li]:items-start [&_li]:gap-3 [&_li>svg]:mt-[3px] [&_li>svg]:shrink-0 [&_li>svg]:text-[var(--landing-muted)] [&_strong]:mb-[3px] [&_strong]:block [&_strong]:text-xs [&_strong]:font-semibold [&_li_span]:block [&_li_span]:text-[11px] [&_li_span]:leading-[1.6] [&_li_span]:text-[var(--landing-muted)]">
                    <summary>How it works</summary>
                    <ol>
                        <li><Link2 size={17} /><div><strong>Make a room</strong><span>Share the link with your friends.</span></div></li>
                        <li><ListMusic size={17} /><div><strong>Build the queue</strong><span>Everyone can add a YouTube video.</span></div></li>
                        <li><MessageSquare size={17} /><div><strong>Settle in</strong><span>Listen together and chat along.</span></div></li>
                    </ol>
                </DismissibleDetails>
                <ThemeToggle className="size-9 min-h-9 border-[var(--landing-line)] bg-[#ffffff25] p-2 text-[var(--landing-ink)] hover:bg-[#ffffff60] dark:bg-[#ffffff08]" />
            </nav>
        </header>
        <main className={cn(styles.main, "flex min-h-0 items-start justify-center px-8 pt-[clamp(64px,13vh,170px)] pb-[100px] max-[900px]:pt-[11vh] max-[600px]:px-[22px] max-[600px]:pt-[70px]")}>
            <section className={cn(styles.hero, "w-full max-w-[1120px] text-center")} aria-labelledby="landing-title">
                <p className="inline-flex items-center justify-center gap-[9px] text-[10px] text-[var(--landing-muted)] uppercase max-[600px]:text-[8px] max-[600px]:tracking-[1.3px]">
                    <Headphones size={13} aria-hidden="true" />
                    For the songs you share
                </p>
                <h1 className="font-serif tracking-normal mt-7 mb-6 text-[clamp(48px,5.5vw,82px)] leading-[1.12] font-medium text-balance max-[900px]:mx-auto max-[900px]:max-w-[700px] max-[600px]:my-6 max-[600px]:text-[clamp(42px,10.5vw,58px)] max-[600px]:tracking-[-2px] [&>em]:font-medium [&>em]:italic max-[600px]:[&>em]:block" id="landing-title">
                    Good music,{" "}
                    <span className=" tracking-tight">Better together</span>
                </h1>
                <p className="mx-auto max-w-[650px] text-[15px] leading-[1.9] text-pretty text-[var(--landing-muted)] max-[600px]:max-w-[340px] max-[600px]:text-[13px] max-[600px]:leading-[1.85]">One room, your favorite people, and whatever’s on repeat.<br className="max-[600px]:hidden" /> Share a link, pass the aux, and stay a little longer.</p>
                <div className={cn(styles.actions, "mt-[34px] flex justify-center [&>div]:max-w-[480px] max-[600px]:mt-[27px]")}><CreateRoomButton className="min-h-[46px] rounded-[3px] border-[#29352c] bg-[#29352c] px-6 py-[11px] text-xs font-medium text-[#fffdf6] shadow-[0_3px_7px_#2636281c,inset_0_1px_#ffffff18] hover:bg-[#39483c] hover:brightness-100 dark:border-[#f2f1e5] dark:bg-[#f2f1e5] dark:text-[#263529] dark:hover:bg-white ring-2 dark:ring-white/30 ring-black/20" /></div>
                {/*<p className="mt-[15px] text-[10px] text-[var(--landing-muted)]"f>No account needed. Just bring a good track.</p>*/}
                {error &&
                    <p role="alert" className="mt-3 text-xs text-[#922c24] dark:text-[#ffc2ad]">
                        Could not create a room. Please try again.
                    </p>
                }
            </section>
        </main>
        <footer className="flex items-center justify-between gap-4 px-9 text-[10px] text-[#fffdf1] [text-shadow:0_1px_4px_#152016a0] max-[600px]:justify-center max-[600px]:px-5 max-[600px]:text-[9px] max-[600px]:[&>span:last-child]:hidden"><span>Different places. Same soundtrack.</span><span>Made for good company.</span></footer>
    </div>;
}
