import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Truck, Building2, AlertTriangle, CheckCircle2, MapPin } from "lucide-react";
import {
    LOAD_TYPES,
    PILOT_CAR_STATES,
    getLoadTypeBySlug,
    KEYWORD_CLUSTERS,
    type LoadTypeData,
} from "@/lib/seo/pilot-car-taxonomy";
import { CoverageEstimateForm } from "@/components/ports/CoverageEstimateForm";

// ── Static generation ─────────────────────────────────────────────────────────

export async function generateStaticParams() {
    return LOAD_TYPES.map((lt) => ({ slug: lt.slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const lt = getLoadTypeBySlug(slug);
    if (!lt) return {};

    const title = `${lt.name} Escort | Pilot Car for ${lt.name} Transport`;
    const description = `Find verified pilot car operators specializing in ${lt.name.toLowerCase()} transport escort. ${lt.description.slice(0, 120)}`;

    return {
        title,
        description,
        keywords: [...lt.keywords, `${lt.name} pilot car`, `oversize escort ${lt.name.toLowerCase()}`].join(", "),
        alternates: { canonical: `/industries/${slug}` },
        openGraph: { title, description, type: "website", url: `/industries/${slug}` },
    };
}

// ── Escort route tips per load type ──────────────────────────────────────────

function getEscortTips(lt: LoadTypeData): string[] {
    const base = [
        `Loads classified as ${lt.name.toLowerCase()} typically require ${lt.escortRequiredWidth > 14 ? "a lead car and chase car (2 escorts)" : "at minimum 1 rear chase escort"} in most US states.`,
        `Permits must be obtained in every state the load passes through. Processing times vary from same-day to 5 business days depending on the state.`,
        `Police escort is commonly required for ${lt.name.toLowerCase()} transport when loads exceed 16–20 ft wide.`,
    ];

    const specificTips: Record<string, string[]> = {
        "wind-turbine": [
            "Blade transport often requires route engineering to assess bridge load ratings and overhead utility clearances.",
            "Night moves are common for wind turbine blades due to traffic and clearance constraints on highway sections.",
            "Tip-extension vehicles and specialized trailers can add 20+ feet to effective escort width management requirements.",
        ],
        "mobile-home": [
            "Double-wide homes (28+ ft) require a lead escort, rear escort, and frequently a police escort for bridge crossings.",
            "Many states have seasonal movement restrictions for manufactured homes — check state-specific blackout periods.",
            "Axle-down transport through tight corners often requires traffic control assistance beyond standard pilot car scope.",
        ],
        "heavy-equipment": [
            "Excavator and dozer transport on lowboys frequently exceeds height limits — height pole escort required in most states.",
            "Bridge analysis and weight permits must be obtained separately from oversize dimension permits.",
            "Equipment with rubber tracks must be fully loaded on trailers — operational travel on public roads is prohibited.",
        ],
        "oil-field": [
            "Rig moves in Texas require specific TXDOT super-heavy permits. Applications can take 48–96 hours.",
            "Utility companies (power, gas, cable) must be notified in advance for rig moves crossing their infrastructure.",
            "Louisiana requires specialized rig move escort service with dedicated flagging personnel.",
        ],
        "transformers": [
            "Transformer transport may require railroad crossing agreements, bridge engineering letters, and utility relocation.",
            "Police corridor closures are frequently required for transformer moves in excess of 400,000 lbs.",
            "Hydraulic platform trailers used for transformer transport may require specialist escort experience beyond standard pilot car.",
        ],
    };

    return [...base, ...(specificTips[lt.slug] ?? [])];
}

// ── High-demand states for this industry ─────────────────────────────────────

function getRelevantStates(lt: LoadTypeData) {
    const industryStateMap: Record<string, string[]> = {
        "wind-turbine": ["texas", "oklahoma", "kansas", "iowa", "colorado", "wyoming", "minnesota"],
        "mobile-home": ["texas", "florida", "georgia", "north-carolina", "alabama", "mississippi"],
        "heavy-equipment": ["texas", "louisiana", "california", "georgia", "ohio", "michigan"],
        "precast-concrete": ["texas", "florida", "california", "georgia", "new-york", "ohio"],
        "modular-home": ["texas", "florida", "north-carolina", "virginia", "georgia"],
        "oil-field": ["texas", "louisiana", "oklahoma", "north-dakota", "wyoming"],
        "transformers": ["texas", "california", "florida", "ohio", "pennsylvania", "virginia"],
    };
    const slugs = industryStateMap[lt.slug] ?? PILOT_CAR_STATES.filter(s => s.demandTier === "high").map(s => s.slug);
    return PILOT_CAR_STATES.filter(s => slugs.includes(s.slug)).slice(0, 6);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function IndustryPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const lt = getLoadTypeBySlug(slug);
    if (!lt) notFound();

    const tips = getEscortTips(lt);
    const relevantStates = getRelevantStates(lt);
    const otherVerticals = LOAD_TYPES.filter((l) => l.slug !== slug);
    const escortTier = lt.escortRequiredWidth >= 16 ? "2 escorts + police likely" : lt.escortRequiredWidth >= 14 ? "2 escorts (lead + chase)" : "1 escort (chase car)";

    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Service",
                serviceType: `${lt.name} Escort / Pilot Car`,
                name: `Pilot Car for ${lt.name} Transport`,
                description: lt.description,
                provider: { "@type": "Organization", name: "Haul Command" },
                areaServed: { "@type": "Country", name: "United States" },
            },
            {
                "@type": "FAQPage",
                mainEntity: [
                    {
                        "@type": "Question",
                        name: `How many pilot cars are required for ${lt.name.toLowerCase()} transport?`,
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: `${lt.name} transport typically requires ${escortTier} based on the load's typical width of ${lt.escortRequiredWidth} feet or greater.`,
                        },
                    },
                    {
                        "@type": "Question",
                        name: `What permits are needed to transport ${lt.name.toLowerCase()}?`,
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: `Oversize/overweight permits are required from every state the load passes through. For ${lt.name.toLowerCase()}, dimensional permits are typically required due to width exceeding 8.5ft.`,
                        },
                    },
                ],
            },
            {
                "@type": "BreadcrumbList",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Haul Command", item: "/" },
                    { "@type": "ListItem", position: 2, name: "Industries", item: "/industries" },
                    { "@type": "ListItem", position: 3, name: `${lt.name} Escort`, item: `/industries/${slug}` },
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
                        <Link href="/industries" className="hover:text-white/60 transition-colors">Industries</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-white/60">{lt.name} Escort</span>
                    </div>
                </div>

                {/* Hero */}
                <div className="px-6 py-12 border-b border-white/5" style={{ background: "linear-gradient(135deg, rgba(241,169,27,0.04) 0%, transparent 60%)" }}>
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center gap-2 mb-4">
                            <Truck className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                                Industry Vertical · Oversize Escort
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                            Pilot Car for{" "}
                            <span style={{ color: "#F1A91B" }}>{lt.name}</span>
                            <br />
                            <span className="text-xl text-white/40">Transport — Escort Guide</span>
                        </h1>

                        <p className="text-sm text-white/50 max-w-xl leading-relaxed mb-5">
                            {lt.description}
                        </p>

                        {/* Keyword pills */}
                        <div className="flex flex-wrap gap-1.5">
                            {lt.keywords.map((k) => (
                                <span key={k} className="text-[10px] text-white/25 border border-white/7 rounded-full px-2.5 py-1">
                                    {k}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main grid */}
                <div className="max-w-5xl mx-auto px-6 py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Left col / main content */}
                        <div className="lg:col-span-2 space-y-10">

                            {/* Escort requirement summary */}
                            <section>
                                <h2 className="text-base font-black text-white mb-4">
                                    Escort Requirements for {lt.name} Transport
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                                    {[
                                        { label: "Typical Escort Trigger Width", value: `${lt.escortRequiredWidth}ft+`, color: "text-amber-400" },
                                        { label: "Escort Configuration", value: escortTier, color: "text-amber-300" },
                                        { label: "Industries Served", value: lt.industries.slice(0, 2).join(", "), color: "text-emerald-400" },
                                    ].map((stat) => (
                                        <div key={stat.label} className="rounded-xl border p-3">
                                            <div className={`text-sm font-black ${stat.color} mb-1`}>{stat.value}</div>
                                            <div className="text-[9px] text-white/30 leading-tight">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Expert tips */}
                            <section>
                                <h2 className="text-base font-black text-white mb-4">
                                    {lt.name} Escort — Expert Notes
                                </h2>
                                <div className="space-y-3">
                                    {tips.map((tip, i) => (
                                        <div
                                            key={i}
                                            className="flex items-start gap-3 rounded-xl border px-4 py-4"
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-amber-400/50 flex-shrink-0 mt-0.5" />
                                            <p className="text-[12px] text-white/50 leading-relaxed">{tip}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Industries served */}
                            <section>
                                <h2 className="text-base font-black text-white mb-4">
                                    Industries That Move {lt.name}
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {lt.industries.map((ind) => (
                                        <span
                                            key={ind}
                                            className="flex items-center gap-1.5 text-[11px] text-white/50 border border-white/8 rounded-lg px-3 py-1.5"
                                            style={{ background: "rgba(255,255,255,0.02)" }}
                                        >
                                            <Building2 className="w-3 h-3 text-amber-400/40" />
                                            {ind.charAt(0).toUpperCase() + ind.slice(1)}
                                        </span>
                                    ))}
                                </div>
                            </section>

                            {/* Top states for this vertical */}
                            <section>
                                <h2 className="text-base font-black text-white mb-4">
                                    High-Demand States — {lt.name} Transport
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    {relevantStates.map((s) => (
                                        <Link
                                            key={s.slug}
                                            href={`/pilot-car/${s.slug}`}
                                            className="group flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]"
                                        >
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3 h-3 text-amber-400/40" />
                                                <span className="text-sm font-bold text-white/70 group-hover:text-amber-300 transition-colors">{s.name}</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-amber-400 transition-colors" />
                                        </Link>
                                    ))}
                                </div>
                            </section>

                            {/* Safety warning for complex loads */}
                            {lt.escortRequiredWidth >= 16 && (
                                <div
                                    className="rounded-xl border px-4 py-4 flex items-start gap-3"
                                    style={{ background: "rgba(239,68,68,0.04)", borderColor: "rgba(239,68,68,0.15)" }}
                                >
                                    <AlertTriangle className="w-4 h-4 text-red-400/60 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-xs font-bold text-red-400/80 mb-1">Complex Load — Plan Ahead</div>
                                        <p className="text-[12px] text-white/40 leading-relaxed">
                                            {lt.name} transport at typical widths ({lt.escortRequiredWidth}ft+) is classified as complex oversize. Allow 5–10 business days for permit processing and route surveys. Book your escort team a minimum of 72 hours in advance of planned departure.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Internal link mesh — other verticals */}
                            <section className="border-t border-white/5 pt-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-white/25 mb-3">
                                    Other Industry Verticals
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {otherVerticals.map((l) => (
                                        <Link
                                            key={l.slug}
                                            href={`/industries/${l.slug}`}
                                            className="text-[11px] text-white/30 border border-white/8 rounded-lg px-2.5 py-1.5 hover:text-amber-300 hover:border-amber-500/25 transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]"
                                        >
                                            {l.name} Escort
                                        </Link>
                                    ))}
                                    {[
                                        { label: "Escort Requirements by State", href: "/escort-requirements/texas" },
                                        { label: "Find Pilot Car", href: "/pilot-car" },
                                        { label: "Common Questions", href: "/answers/how-many-pilot-cars-required" },
                                    ].map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="text-[11px] text-white/30 border border-white/8 rounded-lg px-2.5 py-1.5 hover:text-amber-300 hover:border-amber-500/25 transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]"
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-4">
                            <CoverageEstimateForm />

                            <div
                                className="rounded-2xl border p-4 space-y-2.5"
                                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
                            >
                                <div className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-3">
                                    Relevant Questions
                                </div>
                                {[
                                    { label: "How many pilot cars required?", href: "/answers/how-many-pilot-cars-required" },
                                    { label: "When is police escort required?", href: "/answers/when-is-police-escort-required" },
                                    { label: "Equipment requirements", href: "/answers/pilot-car-equipment-requirements" },
                                    { label: "Pilot car cost per mile", href: "/answers/pilot-car-cost-per-mile" },
                                ].map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="group flex items-center gap-2 text-[11px] text-white/40 hover:text-amber-300 transition-colors"
                                    >
                                        <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-amber-400 transition-colors" />
                                        {link.label}
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
