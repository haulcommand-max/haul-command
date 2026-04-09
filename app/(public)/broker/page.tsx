import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { NativeAdCard } from "@/components/ads/NativeAdCardLazy";
import { Metadata } from "next";
import { ProofStrip } from '@/components/ui/ProofStrip';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

export const metadata: Metadata = {
    title: "Find Verified Escorts Fast — Without the Guesswork | Haul Command",
    description: "Real coverage visibility, compliance tracked, faster backfill. Built for brokers who can't afford delays on oversize load escorts. Find verified pilot car operators in any US state.",
    keywords: ['heavy haul broker','find pilot car for load','oversize load broker','escort vehicle for load','pilot car availability'],
    alternates: { canonical: 'https://www.haulcommand.com/broker' },
    openGraph: { title: 'Find Verified Escorts Fast | Haul Command Broker Hub', description: "Real coverage visibility, compliance tracked, faster backfill.", url: 'https://www.haulcommand.com/broker', siteName: 'Haul Command', type: 'website' },
};

async function getBrokerStats() {
    try {
        const supabase = await createClient();
        const [{ count: escortCount }, { count: jobCount }] = await Promise.all([
            supabase
                .from("profiles")
                .select("id", { count: "exact", head: true })
                .eq("claimed", true)
                .gte("updated_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
            supabase
                .from("escort_jobs")
                .select("id", { count: "exact", head: true })
                .eq("status", "completed")
                .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        ]);
        return {
            activeEscorts: escortCount ?? 0,
            jobsThisWeek: jobCount ?? 0,
        };
    } catch {
        return { activeEscorts: 0, jobsThisWeek: 0 };
    }
}

export const revalidate = 3600;

const BROKER_SCHEMA = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', name: 'Find Verified Escorts Fast | Haul Command Broker Hub', url: 'https://www.haulcommand.com/broker', description: 'The broker hub for finding verified pilot car operators and posting escort loads.', breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },{ '@type': 'ListItem', position: 2, name: 'Broker Hub', item: 'https://www.haulcommand.com/broker' }] } },
    { '@type': 'FAQPage', mainEntity: [
        { '@type': 'Question', name: 'How do I find a verified pilot car operator for my load?', acceptedAnswer: { '@type': 'Answer', text: 'Use the Haul Command directory to search for verified pilot car operators by state. You can also post your load on the load board and receive quotes from certified escorts in your area.' } },
        { '@type': 'Question', name: 'How do I post an escort need on Haul Command?', acceptedAnswer: { '@type': 'Answer', text: 'Go to the load board and post your escort requirement — include route, load dimensions, timing, and state requirements. Verified operators will be notified and can respond with availability.' } },
        { '@type': 'Question', name: 'Are pilot car operators on Haul Command verified?', acceptedAnswer: { '@type': 'Answer', text: 'Verified operators have submitted certifications, insurance documentation, and passed the Haul Command compliance checklist. They receive 3× more contact requests from brokers.' } },
    ]},
] };

export default async function BrokerLandingPage() {
    const stats = await getBrokerStats();

    const brokerHooks = [
        { icon: "👁️", text: "See who's actually available — not just listed" },
        { icon: "🛡️", text: "Avoid no-show escorts — compliance verified before dispatch" },
        { icon: "📋", text: "Keep compliance organized — certs and insurance on file" },
        { icon: "⚡", text: "Backfill faster on tight loads — live coverage density map" },
    ];

    const trustStack = [
        {
            metric: stats.activeEscorts > 0 ? stats.activeEscorts.toString() : "Live",
            label: "Verified escorts active",
            icon: "🚘",
        },
        {
            metric: "< 15 min",
            label: "Median first response",
            icon: "⚡",
        },
        {
            metric: stats.jobsThisWeek > 0 ? `${stats.jobsThisWeek}` : "Active",
            label: "Jobs covered this week",
            icon: "✅",
        },
    ];

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(BROKER_SCHEMA) }} />
            <ProofStrip variant="bar" />
            <main className="min-h-screen bg-slate-900 text-slate-50">
            {/* ── HERO ─────────────────────────────────────────────── */}
            <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 py-24 px-4 overflow-hidden">
                {/* Background glow */}
                <div className="absolute inset-0 bg-amber-500/5 pointer-events-none" />
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-3xl mx-auto text-center relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-6">
                        🚛 Built for Heavy Haul Brokers
                    </div>

                    <h1 className="text-5xl lg:text-6xl font-extrabold text-white mb-5 leading-tight tracking-tight">
                        Find Verified Escorts Fast —{" "}
                        <span className="text-amber-400">Without the Guesswork</span>
                    </h1>

                    <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
                        Real coverage visibility · Compliance tracked · Faster backfill
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link aria-label="Navigation Link"
                            href="/map"
                            id="broker-cta-live-coverage"
                            className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-amber-500/20"
                        >
                            Check Live Coverage →
                        </Link>
                        <Link aria-label="Navigation Link"
                            href="/loads/new"
                            id="broker-cta-post-need"
                            className="inline-flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors"
                        >
                            Post an Escort Need
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── TRUST STACK ──────────────────────────────────────── */}
            <section className="border-b border-slate-700/50 py-8 px-4">
                <div className="max-w-3xl mx-auto grid grid-cols-3 gap-6 text-center">
                    {trustStack.map((s) => (
                        <div key={s.label}>
                            <div className="text-2xl mb-1">{s.icon}</div>
                            <div className="text-2xl font-extrabold text-amber-400">{s.metric}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── NATIVE AD ──────────────────────────────────────── */}
            <section className="py-6 px-4">
                <div className="max-w-3xl mx-auto">
                    <NativeAdCard
                        surface="broker_mid"
                        placementId="broker-below-trust-stack"
                        variant="inline"
                    />
                </div>
            </section>

            {/* ── BROKER HOOKS ─────────────────────────────────────── */}
            <section className="py-20 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-white mb-3">
                            Built for brokers who can&apos;t afford delays
                        </h2>
                        <p className="text-slate-400">
                            Every hour an escort is missing is money on the table. We solve that.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {brokerHooks.map((h) => (
                            <div
                                key={h.text}
                                className="flex items-start gap-4 bg-slate-800/60 border border-slate-700 rounded-xl p-5"
                            >
                                <span className="text-2xl flex-shrink-0">{h.icon}</span>
                                <p className="text-slate-300 font-medium">{h.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ─────────────────────────────────────── */}
            <section className="bg-slate-800/40 border-y border-slate-700/50 py-20 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-extrabold text-white mb-12">
                        From Load Post to Confirmed Escort in Minutes
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {[
                            {
                                step: "1",
                                title: "Post Your Need",
                                desc: "Route, dimensions, timing. Takes 90 seconds.",
                            },
                            {
                                step: "2",
                                title: "See Live Options",
                                desc: "Verified escorts with availability, compliance status, and response time.",
                            },
                            {
                                step: "3",
                                title: "Confirm & Move",
                                desc: "Book the escort, share documents, and track the move.",
                            },
                        ].map((s) => (
                            <div key={s.step} className="text-center">
                                <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg mx-auto mb-4">
                                    {s.step}
                                </div>
                                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                                <p className="text-slate-400 text-sm">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FINAL CTA ────────────────────────────────────────── */}
            <section className="py-20 px-4 text-center">
                <div className="max-w-xl mx-auto">
                    <h2 className="text-3xl font-extrabold text-white mb-4">Ready to stop cold-calling for escorts?</h2>
                    <p className="text-slate-400 mb-8">Free to start. Find your first verified escort today.</p>
                    <Link aria-label="Navigation Link" href="/map" id="broker-cta-bottom" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors">Check Live Coverage →</Link>
                </div>
            </section>

            {/* Internal link mesh */}
            <section className="border-t border-slate-700/50 py-8 px-4">
                <div className="max-w-3xl mx-auto flex flex-wrap gap-3 justify-center">
                    <Link href="/glossary/pilot-car" className="text-xs px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-amber-400 transition-all">📖 What Is a Pilot Car?</Link>
                    <Link href="/tools/escort-calculator" className="text-xs px-4 py-2 rounded-lg border border-amber-500/25 text-amber-400 hover:bg-amber-500/10 transition-all">🧮 Escort Calculator</Link>
                    <Link href="/escort-requirements" className="text-xs px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-amber-400 transition-all">⚖️ State Escort Rules</Link>
                    <Link href="/directory" className="text-xs px-4 py-2 rounded-lg border border-green-500/25 text-green-400 hover:bg-green-500/10 transition-all">🔍 Browse Directory</Link>
                    <Link href="/available-now" className="text-xs px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-amber-400 transition-all">🟢 Available Right Now</Link>
                    <Link href="/pricing" className="text-xs px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-amber-400 transition-all">💲 Broker Plans</Link>
                </div>
            </section>

            <NoDeadEndBlock heading="Ready to Find Escorts or Cover a Load?" moves={[
                { href: '/map', icon: '🗺️', title: 'Check Live Coverage', desc: 'Real-time operator density', primary: true, color: '#D4A844' },
                { href: '/loads/new', icon: '📦', title: 'Post an Escort Need', desc: 'Quotes in under 15 min', primary: true, color: '#22C55E' },
                { href: '/available-now', icon: '🟢', title: 'Available Now', desc: 'Operators broadcasting live' },
                { href: '/directory', icon: '🔍', title: 'Browse Directory', desc: 'Search by state & specialty' },
                { href: '/tools/escort-calculator', icon: '🧮', title: 'Escort Calculator', desc: 'How many pilot cars?' },
                { href: '/pricing', icon: '💎', title: 'Broker Pro Plan', desc: 'Priority access $99/mo' },
            ]} />

            </main>
        </>
    );
}
