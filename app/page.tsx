import Link from "next/link";
import { ArrowUpRight, Link2, ListMusic, Radio } from "lucide-react";
import { CreateRoomButton } from "@/components/create-room-button";
import { ThemeToggle } from "@/components/theme-provider";

const wave = [14, 24, 38, 22, 48, 64, 36, 76, 52, 90, 62, 100, 78, 48, 68, 88, 54, 34, 62, 42, 24, 36, 18];

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const { error } = await searchParams;

    return <div className="landing">
        <header className="landing-header">
            <Link href="/" className="brand"><span className="brand-mark">ııı</span>pubby</Link>
            {/*<span className="landing-tagline">A little room for good music.</span>*/}
            <ThemeToggle />
        </header>

        <main className="landing-main">
            <section className="landing-hero">
                <div className="landing-copy">
                    <span className="landing-kicker"><span aria-hidden="true" />Made for listening together</span>
                    <h1>Good music.<br /><span>Better company.</span></h1>
                    <p>A room for your friends and whatever’s on repeat. Share a link, build the queue, and press play.</p>
                    <div className="landing-cta">
                        <CreateRoomButton />
                        {/*<span>No account needed.
                            <br />
                            Just bring a good track.
                        </span>*/}
                    </div>
                    {error && <p role="alert" className="error">Could not create a room. Please try again.</p>}
                </div>
                <div className="listening-art" aria-hidden="true">
                    <div className="art-topline"><span>PUBBY / LISTENING CLUB</span><ArrowUpRight size={18} /></div>
                    <div className="art-composition">
                        <div className="record-sleeve"><span className="sleeve-label">SIDE A</span><div className="sound-wave">{wave.map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div><span className="sleeve-title">IN GOOD<br />COMPANY.</span></div>
                        <div className="vinyl"><div className="vinyl-label"><span>pubby</span><i /></div></div>
                    </div>
                    <div className="art-caption"><span>Different tastes. One queue.</span><span>VOL. 001</span></div>
                </div>
            </section>
            <section className="landing-steps" aria-label="How it works">
                <div><span className="step-number">01</span><div><h2><Link2 size={15} />Make a room</h2><p>Send the link. Your friends are invited.</p></div></div>
                <div><span className="step-number">02</span><div><h2><ListMusic size={15} />Pass the aux</h2><p>Everyone adds their YouTube favorites.</p></div></div>
                <div><span className="step-number">03</span><div><h2><Radio size={15} />Find your rhythm</h2><p>Listen in sync and talk in the room chat.</p></div></div>
            </section>
        </main>

        {/*<footer className="landing-footer">
            <span>pubby — a shared listening space</span>
            <span>Less scrolling. More listening.</span>
        </footer>*/}
    </div>;
}
