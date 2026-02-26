import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, HelpCircle, BookOpen, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import {
    AI_ANSWER_SEEDS,
    PILOT_CAR_STATES,
    LOAD_TYPES,
    getAiAnswerBySlug,
    type AiAnswerSeed,
} from "@/lib/seo/pilot-car-taxonomy";

// ── Static generation ─────────────────────────────────────────────────────────

export async function generateStaticParams() {
    return AI_ANSWER_SEEDS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const answer = getAiAnswerBySlug(slug);
    if (!answer) return {};

    const title = `${answer.question} | Haul Command`;
    const description = answer.shortAnswer.slice(0, 160);

    return {
        title,
        description,
        keywords: [answer.question, ...answer.relatedQuestions.slice(0, 3), "pilot car", "oversize escort"].join(", "),
        alternates: { canonical: `/answers/${slug}` },
        openGraph: { title, description, type: "article", url: `/answers/${slug}` },
    };
}

// ── Supplemental content per tag ──────────────────────────────────────────────

function getTagContext(seed: AiAnswerSeed) {
    const highDemandStates = PILOT_CAR_STATES.filter((s) => s.demandTier === "high");

    if (seed.tags.includes("escort-count")) {
        return {
            tableTitle: "Escort Count by Load Width — US Reference",
            rows: [
                { label: "Up to 8.5 ft wide", value: "No escort required (most states)" },
                { label: "8.6 – 12 ft wide", value: "1 escort (rear chase car)" },
                { label: "12.1 – 14 ft wide", value: "1–2 escorts (state dependent)" },
                { label: "14.1 – 16 ft wide", value: "2 escorts (lead + chase)" },
                { label: "16.1 – 20 ft wide", value: "2 escorts + often police required" },
                { label: "Over 20 ft wide", value: "Police escort mandatory in most states" },
            ],
        };
    }
    if (seed.tags.includes("pricing") || seed.tags.includes("cost")) {
        return {
            tableTitle: "Pilot Car Rate Ranges by Scenario",
            rows: [
                { label: "Standard daytime move", value: "$1.75 – $2.50/loaded mile" },
                { label: "Night move surcharge", value: "+$0.50 – $1.00/mile" },
                { label: "Urban corridor surcharge", value: "+$0.25 – $0.75/mile" },
                { label: "Police-required load fee", value: "+$150 – $400/day" },
                { label: "Minimum trip fee", value: "$150 – $300 flat" },
                { label: "Multi-day rate (negotiated)", value: "$400 – $800/day + mileage" },
                { label: "Canadian rate (C$/km)", value: "C$2.50 – C$4.50/km" },
            ],
        };
    }
    if (seed.tags.includes("equipment")) {
        return {
            tableTitle: "Pilot Car Equipment — US Requirements",
            rows: [
                { label: "OVERSIZE LOAD banner", value: "Mandatory in all US states" },
                { label: "Amber strobe/rotating light", value: "Mandatory in all US states" },
                { label: "CB Radio (Channel 19)", value: "Required or strongly recommended in all states" },
                { label: "Height pole", value: "Required when load > state max height" },
                { label: "Safety flags", value: "Required on corners of load vehicle" },
                { label: "Load permit copy", value: "Must be laminated and carried in escort vehicle" },
                { label: "Reflective triangles/flares", value: "Required for breakdowns" },
            ],
        };
    }
    if (seed.tags.includes("police-escort") || seed.tags.includes("law-enforcement")) {
        return {
            tableTitle: "Police Escort Width Triggers by State",
            rows: highDemandStates
                .filter((s) => s.policeWidthFt)
                .map((s) => ({ label: s.name, value: `${s.policeWidthFt!} ft and wider` })),
        };
    }
    if (seed.tags.includes("by-state") || seed.tags.includes("requirements")) {
        return {
            tableTitle: "Escort Requirements — Key States",
            rows: highDemandStates.slice(0, 8).map((s) => ({
                label: s.name,
                value: `>${s.maxWidthFt}ft wide or >${s.maxHeightFt}ft tall requires escort`,
            })),
        };
    }
    return null;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AnswerPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const seed = getAiAnswerBySlug(slug);
    if (!seed) notFound();

    const tableContext = getTagContext(seed);
    const allAnswers = AI_ANSWER_SEEDS.filter((a) => a.slug !== slug).slice(0, 6);
    const relatedLoadTypes = LOAD_TYPES.slice(0, 4);

    // Structured data — FAQPage + Article (dual schema for max AI snippet coverage)
    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "FAQPage",
                mainEntity: [
                    {
                        "@type": "Question",
                        name: seed.question,
                        acceptedAnswer: { "@type": "Answer", text: seed.shortAnswer },
                    },
                    ...seed.relatedQuestions.map((q) => ({
                        "@type": "Question",
                        name: q,
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: `See the full answer for "${seed.question}" on this page. Related information is provided below.`,
                        },
                    })),
                ],
            },
            {
                "@type": "Article",
                headline: seed.question,
                description: seed.shortAnswer,
                author: { "@type": "Organization", name: "Haul Command" },
                publisher: { "@type": "Organization", name: "Haul Command", url: "https://haulcommand.com" },
                url: `https://haulcommand.com/answers/${slug}`,
            },
            {
                "@type": "BreadcrumbList",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Haul Command", item: "/" },
                    { "@type": "ListItem", position: 2, name: "Answers", item: "/answers" },
                    { "@type": "ListItem", position: 3, name: seed.question, item: `/answers/${slug}` },
                ],
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            <main className="min-h-screen" style={{ background: "#050505" }}>
                {/* Breadcrumb */}
                <div className="border-b border-white/5 px-6 py-3">
                    <div className="max-w-5xl mx-auto flex items-center gap-1.5 text-[11px] text-white/30 flex-wrap">
                        <Link href="/" className="hover:text-white/60 transition-colors">Haul Command</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/answers" className="hover:text-white/60 transition-colors">Answers</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-white/50 truncate max-w-xs">{seed.question}</span>
                    </div>
                </div>

                {/* Hero */}
                <div className="px-6 py-12 border-b border-white/5" style={{ background: "linear-gradient(135deg, rgba(241,169,27,0.04) 0%, transparent 60%)" }}>
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center gap-2 mb-4">
                            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                                Pilot Car Expert Answer
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight">
                            {seed.question}
                        </h1>
                        <p className="text-[11px] text-white/25 mt-1">
                            Updated {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })} · Verified by active freight brokers
                        </p>
                    </div>
                </div>

                {/* Main content */}
                <div className="max-w-5xl mx-auto px-6 py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                        {/* Left col — answer content */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Quick answer box — designed to win AI snippets */}
                            <div
                                className="rounded-2xl border p-6"
                                style={{ background: "rgba(241,169,27,0.04)", borderColor: "rgba(241,169,27,0.18)" }}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                                        Quick Answer
                                    </span>
                                </div>
                                <p className="text-sm text-white/80 leading-relaxed font-medium">
                                    {seed.shortAnswer}
                                </p>
                            </div>

                            {/* Reference table */}
                            {tableContext && (
                                <section>
                                    <h2 className="text-base font-black text-white mb-4">{tableContext.tableTitle}</h2>
                                    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                                        {tableContext.rows.map((row, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between px-4 py-3 text-sm border-b last:border-b-0"
                                                style={{
                                                    background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                                                    borderColor: "rgba(255,255,255,0.05)",
                                                }}
                                            >
                                                <span className="text-white/60 font-medium">{row.label}</span>
                                                <span className="text-amber-300 font-bold text-[12px] text-right max-w-[55%]">{row.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Related questions */}
                            <section>
                                <h2 className="text-base font-black text-white mb-4">Related Questions</h2>
                                <div className="space-y-3">
                                    {seed.relatedQuestions.map((q, i) => (
                                        <div
                                            key={i}
                                            className="rounded-xl border px-4 py-4"
                                        >
                                            <h3 className="text-sm font-bold text-white mb-1.5 flex items-start gap-2">
                                                <HelpCircle className="w-3.5 h-3.5 text-amber-400/60 mt-0.5 flex-shrink-0" />
                                                {q}
                                            </h3>
                                            <p className="text-[12px] text-white/40 leading-relaxed pl-5">
                                                The answer depends on your specific load dimensions, the states you&apos;re crossing, and your route. Use the
                                                coverage estimate tool on this page for a customized answer.
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* State index for regulation-tagged pages */}
                            {(seed.tags.includes("requirements") || seed.tags.includes("by-state") || seed.tags.includes("regulations")) && (
                                <section>
                                    <h2 className="text-base font-black text-white mb-4">
                                        Escort Requirements by State
                                    </h2>
                                    <p className="text-sm text-white/40 mb-4 leading-relaxed">
                                        Requirements vary significantly between states. Select your origin or destination state for the complete requirements guide:
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {PILOT_CAR_STATES.map((s) => (
                                            <Link
                                                key={s.slug}
                                                href={`/escort-requirements/${s.slug}`}
                                                className="group flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 border text-[11px] transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]"
                                            >
                                                <span className="font-bold text-white/60 group-hover:text-amber-300 transition-colors">{s.name}</span>
                                                <span className="text-white/20 font-mono">{s.abbr}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Disclaimer */}
                            <div
                                className="rounded-xl border px-4 py-3 flex items-start gap-2.5"
                                style={{ background: "rgba(255,175,0,0.03)", borderColor: "rgba(255,175,0,0.1)" }}
                            >
                                <AlertCircle className="w-3.5 h-3.5 text-amber-400/60 mt-0.5 flex-shrink-0" />
                                <p className="text-[11px] text-white/30 leading-relaxed">
                                    Regulations change. Always verify requirements directly with the state DOT or province transportation authority before moving.
                                    Haul Command is a marketplace platform — not a legal authority.
                                </p>
                            </div>
                        </div>

                        {/* Right sidebar */}
                        <div className="space-y-4">
                            {/* Get a match CTA */}
                            <div
                                className="rounded-2xl border p-5 space-y-3"
                                style={{ background: "rgba(241,169,27,0.04)", borderColor: "rgba(241,169,27,0.15)" }}
                            >
                                <div className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                                    Find a Pilot Car
                                </div>
                                <p className="text-[12px] text-white/50 leading-relaxed">
                                    Get an instant coverage estimate and match with verified pilot car operators for your specific load and route.
                                </p>
                                <Link
                                    href="/"
                                    className="block w-full text-center text-xs font-black py-3 rounded-lg transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]"
                                    style={{ background: "#F1A91B", color: "#000" }}
                                >
                                    Get Coverage Estimate →
                                </Link>
                            </div>

                            {/* Industry verticals */}
                            <div
                                className="rounded-2xl border p-4 space-y-2.5"
                                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
                            >
                                <div className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-3">
                                    By Load Type
                                </div>
                                {relatedLoadTypes.map((lt) => (
                                    <Link
                                        key={lt.slug}
                                        href={`/industries/${lt.slug}`}
                                        className="group flex items-center gap-2 text-[11px] text-white/40 hover:text-amber-300 transition-colors"
                                    >
                                        <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-amber-400 transition-colors" />
                                        {lt.name} Escort Guide
                                    </Link>
                                ))}
                            </div>

                            {/* More answers */}
                            <div
                                className="rounded-2xl border p-4 space-y-2.5"
                                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
                            >
                                <div className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-3">
                                    More Answers
                                </div>
                                {allAnswers.map((a) => (
                                    <Link
                                        key={a.slug}
                                        href={`/answers/${a.slug}`}
                                        className="group flex items-start gap-2 text-[11px] text-white/40 hover:text-amber-300 transition-colors leading-snug"
                                    >
                                        <BookOpen className="w-3 h-3 text-white/20 group-hover:text-amber-400 transition-colors flex-shrink-0 mt-0.5" />
                                        {a.question}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
