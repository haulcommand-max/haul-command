import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MapPin, Truck, AlertCircle } from "lucide-react";
import {
    PILOT_CAR_STATES,
    CANADIAN_PROVINCES,
    MAJOR_CORRIDORS,
    LOAD_TYPES,
    AI_ANSWER_SEEDS,
    getDemandLabel,
} from "@/lib/seo/pilot-car-taxonomy";

export const metadata: Metadata = {
    title: "Pilot Car Service Directory | Find Oversize Escort Near You",
    description: "Find verified pilot car operators across all 50 US states and Canadian provinces. Oversize load escort, wide load pilot car, and heavy haul escort services — state-specific requirements, corridor coverage, and instant estimates.",
    keywords: "pilot car service, oversize load escort, wide load escort, heavy haul escort, pilot car near me, escort vehicle service, pilot car company",
    alternates: { canonical: "/pilot-car" },
    openGraph: {
        title: "Pilot Car Service Directory | Haul Command",
        description: "Find verified pilot car operators across the US and Canada. State-specific requirements, corridor coverage, and instant coverage estimates.",
        type: "website",
        url: "/pilot-car",
    },
};

// Structured data — Service + directory signals for AI answer panels
const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "WebPage",
            name: "Pilot Car Service Directory",
            description: "Directory of verified pilot car and oversize load escort operators across the United States and Canada.",
            url: "https://haulcommand.com/pilot-car",
            publisher: { "@type": "Organization", name: "Haul Command" },
        },
        {
            "@type": "FAQPage",
            mainEntity: [
                {
                    "@type": "Question",
                    name: "What is a pilot car service?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "A pilot car service (also called escort vehicle service) provides lead or chase vehicles that accompany oversize loads on public roads. Pilot cars warn other traffic, navigate low clearances, and ensure compliance with state oversize regulations.",
                    },
                },
                {
                    "@type": "Question",
                    name: "When do I need a pilot car for my load?",
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: "You need a pilot car when your load exceeds legal width (typically 8.5ft in most US states), height (13.5–14.5ft depending on state), or certain length thresholds. Requirements vary by state — select your state below for the complete requirements guide.",
                    },
                },
            ],
        },
    ],
};

export default function PilotCarIndexPage() {
    const highDemand = PILOT_CAR_STATES.filter((s) => s.demandTier === "high");
    const mediumLow = PILOT_CAR_STATES.filter((s) => s.demandTier !== "high");
    const highCorridors = MAJOR_CORRIDORS.filter((c) => c.demandTier === "high");

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            <main className="min-h-screen" style={{ background: "#050505" }}>
                {/* Breadcrumb */}
                <div className="border-b border-white/5 px-6 py-3">
                    <div className="max-w-6xl mx-auto flex items-center gap-1.5 text-[11px] text-white/30">
                        <Link href="/" className="hover:text-white/60 transition-colors">Haul Command</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-white/60">Pilot Car</span>
                    </div>
                </div>

                {/* Hero */}
                <div className="px-6 py-14 border-b border-white/5" style={{ background: "linear-gradient(135deg, rgba(241,169,27,0.05) 0%, transparent 60%)" }}>
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center gap-2 mb-5">
                            <Truck className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                                US + Canada · Verified Operators
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                            Pilot Car{" "}
                            <span style={{ color: "#F1A91B" }}>Service Directory</span>
                        </h1>
                        <p className="text-sm text-white/50 max-w-xl leading-relaxed mb-6">
                            Find verified oversize escort operators across all US states and Canadian provinces.
                            State-specific requirements, corridor coverage, and live availability indicators.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {["pilot car near me", "oversize load escort", "wide load escort", "heavy haul escort", "escort vehicle service", "pilot car dispatch"].map((k) => (
                                <span key={k} className="text-[10px] text-white/20 border border-white/7 rounded-full px-2.5 py-1">{k}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-6 py-10 space-y-14">

                    {/* High demand US states */}
                    <section>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-black text-white">High-Demand States</h2>
                            <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider border border-red-500/20 rounded px-2 py-1">
                                Active Shortage Alerts
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {highDemand.map((s) => (
                                <Link
                                    key={s.slug}
                                    href={`/pilot-car/${s.slug}`}
                                    className="group rounded-2xl border p-4 flex flex-col gap-2 transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-amber-400/50" />
                                            <span className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">{s.name}</span>
                                        </div>
                                        <span className="font-mono text-[10px] text-white/25">{s.abbr}</span>
                                    </div>
                                    <div className="text-[10px] text-white/30">{s.topCities.length} cities · {s.corridors.length} corridors</div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-red-400 border border-red-500/20 rounded px-1.5 py-0.5">
                                            {getDemandLabel(s.demandTier)}
                                        </span>
                                        <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-amber-400 transition-colors" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* All other US states */}
                    <section>
                        <h2 className="text-base font-black text-white mb-5">All US States</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                            {mediumLow.map((s) => (
                                <Link
                                    key={s.slug}
                                    href={`/pilot-car/${s.slug}`}
                                    className="group flex items-center gap-2 rounded-lg px-3 py-2.5 border text-[11px] transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]"
                                >
                                    <span className="font-mono text-[9px] text-white/25 w-5 flex-shrink-0">{s.abbr}</span>
                                    <span className="font-bold text-white/60 group-hover:text-amber-300 transition-colors">{s.name}</span>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* Canada */}
                    <section>
                        <h2 className="text-base font-black text-white mb-2">Canadian Provinces</h2>
                        <p className="text-[12px] text-white/35 mb-5">Transport Canada regulated escort requirements · Alberta, Ontario, BC, and more</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {CANADIAN_PROVINCES.map((p) => (
                                <Link
                                    key={p.slug}
                                    href={`/escort-requirements/${p.slug}`}
                                    className="group flex items-center gap-2 rounded-xl px-4 py-3 border transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]"
                                >
                                    <MapPin className="w-3 h-3 text-amber-400/40" />
                                    <span className="text-sm font-bold text-white/60 group-hover:text-amber-300 transition-colors">{p.name}</span>
                                    <span className="ml-auto font-mono text-[10px] text-white/20">{p.abbr}</span>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* Corridors */}
                    <section>
                        <h2 className="text-base font-black text-white mb-5">Major Corridor Coverage</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {highCorridors.map((c) => (
                                <Link
                                    key={c.slug}
                                    href={`/corridors/${c.slug}/pilot-car`}
                                    className="group rounded-xl border px-4 py-4 flex items-center justify-between transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]"
                                >
                                    <div>
                                        <div className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">{c.label}</div>
                                        <div className="text-[10px] text-white/30 mt-0.5">{c.states.length} states covered</div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-amber-400 transition-colors" />
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* Quick answers */}
                    <section>
                        <h2 className="text-base font-black text-white mb-5">Common Questions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {AI_ANSWER_SEEDS.slice(0, 6).map((a) => (
                                <Link
                                    key={a.slug}
                                    href={`/answers/${a.slug}`}
                                    className="group flex items-start gap-2 rounded-xl border px-4 py-3 transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]"
                                >
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-400/40 flex-shrink-0 mt-0.5" />
                                    <span className="text-[12px] text-white/50 group-hover:text-amber-300 transition-colors font-medium">{a.question}</span>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* Industry verticals */}
                    <section>
                        <h2 className="text-base font-black text-white mb-5">Escort by Load Type</h2>
                        <div className="flex flex-wrap gap-2">
                            {LOAD_TYPES.map((lt) => (
                                <Link key={lt.slug} href={`/industries/${lt.slug}`}
                                    className="text-[11px] text-white/35 border border-white/8 rounded-lg px-3 py-1.5 hover:text-amber-300 hover:border-amber-500/25 transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]">
                                    {lt.name} Escort
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
