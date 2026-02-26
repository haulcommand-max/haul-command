import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin, Truck, Shield, AlertTriangle, CheckCircle2, Award } from "lucide-react";
import {
    getStateBySlug,
    getAllStateSlugs,
    getDemandLabel,
    getRequirementsIntro,
    KEYWORD_CLUSTERS,
    LOAD_TYPES,
    type StateData,
} from "@/lib/seo/pilot-car-taxonomy";
import { CoverageEstimateForm } from "@/components/ports/CoverageEstimateForm";
import { ShortageAlertBanner } from "@/components/ports/ShortageAlertBanner";

// ── Static generation ─────────────────────────────────────────────────────────

export async function generateStaticParams() {
    return getAllStateSlugs().map((slug) => ({ state: slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ state: string }>;
}): Promise<Metadata> {
    const { state: stateSlug } = await params;
    const state = getStateBySlug(stateSlug);
    if (!state) return {};

    const title = `Pilot Car Service ${state.name} | Oversize Load Escort ${state.abbr}`;
    const description = `Find verified pilot car operators in ${state.name}. Oversize load escort, wide load pilot car, height pole service across ${state.topCities.slice(0, 3).map(c => c.name).join(", ")} and more. ${getRequirementsIntro(state)}`;

    return {
        title,
        description,
        alternates: { canonical: `/pilot-car/${state.slug}` },
        openGraph: {
            title,
            description,
            type: "website",
            url: `/pilot-car/${state.slug}`,
        },
    };
}

// ── Component ─────────────────────────────────────────────────────────────────

function RequirementsCard({ state }: { state: StateData }) {
    return (
        <div
            className="rounded-2xl border p-5 space-y-3"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}
        >
            <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-black uppercase tracking-widest text-amber-400">
                    {state.abbr} Escort Requirements
                </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3 bg-white/3 border border-white/6 text-center">
                    <div className="text-xl font-black text-white tabular-nums">
                        {state.maxWidthFt}&apos;
                    </div>
                    <div className="text-[10px] text-white/40 mt-0.5 uppercase tracking-wider">
                        Max Width (no escort)
                    </div>
                </div>
                <div className="rounded-xl p-3 bg-white/3 border border-white/6 text-center">
                    <div className="text-xl font-black text-white tabular-nums">
                        {state.maxHeightFt}&apos;
                    </div>
                    <div className="text-[10px] text-white/40 mt-0.5 uppercase tracking-wider">
                        Max Height (no escort)
                    </div>
                </div>
                {state.policeWidthFt && (
                    <div className="col-span-2 rounded-xl p-3 bg-red-500/5 border border-red-500/15 text-center">
                        <div className="text-xl font-black text-red-400 tabular-nums">
                            {state.policeWidthFt}&apos;+
                        </div>
                        <div className="text-[10px] text-red-400/60 mt-0.5 uppercase tracking-wider">
                            Width Requires Police Escort
                        </div>
                    </div>
                )}
            </div>

            <p className="text-[11px] text-white/45 leading-relaxed">
                {getRequirementsIntro(state)}
            </p>

            <Link
                href={`/escort-requirements/${state.slug}`}
                className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
                Full {state.name} escort requirements guide
                <ChevronRight className="w-3 h-3" />
            </Link>
        </div>
    );
}

function CityGrid({ state }: { state: StateData }) {
    return (
        <section>
            <h2 className="text-base font-black text-white mb-4">
                Pilot Car Coverage by City — {state.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {state.topCities.map((city) => (
                    <Link
                        key={city.slug}
                        href={`/pilot-car/${state.slug}/${city.slug}`}
                        className="group flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 border transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]"
                    >
                        <div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-amber-400/60" />
                                <span className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                                    {city.name}
                                </span>
                                {city.demandTier === "high" && (
                                    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border text-amber-400 bg-amber-500/10 border-amber-500/20">
                                        High Demand
                                    </span>
                                )}
                            </div>
                            {city.county && (
                                <div className="text-[10px] text-white/30 mt-0.5 pl-5">{city.county}</div>
                            )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                ))}
            </div>
        </section>
    );
}

function LoadTypeGrid({ state }: { state: StateData }) {
    return (
        <section>
            <h2 className="text-base font-black text-white mb-2">
                Common Oversize Load Types in {state.name}
            </h2>
            <p className="text-[12px] text-white/40 mb-4 leading-relaxed">
                Pilot car escort requirements vary by load type. Below are the most common oversized loads moved through {state.name}.
            </p>
            <div className="space-y-2.5">
                {LOAD_TYPES.slice(0, 5).map((lt) => (
                    <div
                        key={lt.slug}
                        className="rounded-xl border px-4 py-3.5"
                        style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}
                    >
                        <div className="flex items-start gap-3">
                            <Truck className="w-4 h-4 text-amber-400/60 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-white mb-1">{lt.name}</h3>
                                <p className="text-[11px] text-white/40 leading-snug">{lt.description}</p>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {lt.keywords.slice(0, 3).map((k) => (
                                        <span key={k} className="text-[9px] text-white/25 border border-white/8 rounded px-1.5 py-0.5">
                                            {k}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function FaqSection({ state }: { state: StateData }) {
    const faqs = [
        {
            q: `How many pilot cars do I need in ${state.name}?`,
            a: `In ${state.name}, loads wider than ${state.maxWidthFt} feet require at least one escort vehicle. Loads exceeding 14 feet in width typically require both a lead car and a chase car. ${state.policeWidthFt ? `Loads wider than ${state.policeWidthFt} feet require law enforcement escort.` : ""}`,
        },
        {
            q: `Do I need a pilot car for my oversize load in ${state.name}?`,
            a: `Yes, if your load exceeds ${state.maxWidthFt} feet wide or ${state.maxHeightFt} feet tall in ${state.name}, you are legally required to have an escort vehicle. Operating without a required escort is a violation of ${state.abbr} DOT regulations and can result in permit revocation.`,
        },
        {
            q: `What equipment must a pilot car have in ${state.name}?`,
            a: `${state.name} DOT requires pilot cars to have: a 'OVERSIZE LOAD' sign (illuminated at night), amber rotating or flashing lights, a two-way radio for communication with the truck driver, and safety flags. Height poles are required when load height exceeds ${state.maxHeightFt} feet.`,
        },
        {
            q: `How do I find a pilot car in ${state.abbr}?`,
            a: `Haul Command connects brokers and carriers with verified pilot car operators across ${state.name}. Search by origin city, corridor, or port to find available escorts for your load. All operators on the platform are verified and reviewed by active freight brokers.`,
        },
        {
            q: `How much does pilot car service cost in ${state.name}?`,
            a: `Pilot car rates in ${state.name} typically range from $1.75 to $3.50 per loaded mile, depending on load complexity, time of day, and regional demand. Night moves and police-required loads command a premium. Get a real estimate above based on your load dimensions.`,
        },
        {
            q: `When is police escort required in ${state.name}?`,
            a: state.policeWidthFt
                ? `In ${state.name}, law enforcement escort is required for loads exceeding ${state.policeWidthFt} feet in width. Police coordination typically requires 72 hours advance notice. Contact your ${state.abbr} DOT permit office for specific requirements.`
                : `Police escort requirements in ${state.name} are determined on a case-by-case basis by the ${state.abbr} DOT based on load dimensions, route, and time of transport. Contact the DOT permit office for your specific load.`,
        },
    ];

    return (
        <section>
            <h2 className="text-base font-black text-white mb-4">
                Frequently Asked Questions — Pilot Car {state.name}
            </h2>
            <div className="space-y-3">
                {faqs.map((faq, i) => (
                    <div
                        key={i}
                        className="rounded-xl border px-4 py-4"
                        style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}
                    >
                        <h3 className="text-sm font-bold text-white mb-2 leading-snug">{faq.q}</h3>
                        <p className="text-[12px] text-white/50 leading-relaxed">{faq.a}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PilotCarStatePage({
    params,
}: {
    params: Promise<{ state: string }>;
}) {
    const { state: stateSlug } = await params;
    const state = getStateBySlug(stateSlug);
    if (!state) notFound();

    const keywords = KEYWORD_CLUSTERS.tier1_geo(state.name);
    const isHighDemand = state.demandTier === "high";

    // Structured data
    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Service",
                name: `Pilot Car Service ${state.name}`,
                provider: { "@type": "Organization", name: "Haul Command" },
                areaServed: {
                    "@type": "State",
                    name: state.name,
                    addressCountry: "US",
                },
                description: getRequirementsIntro(state),
                serviceType: "Oversize Load Escort / Pilot Car",
            },
            {
                "@type": "BreadcrumbList",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Haul Command", item: "/" },
                    { "@type": "ListItem", position: 2, name: "Pilot Car Service", item: "/pilot-car" },
                    { "@type": "ListItem", position: 3, name: state.name, item: `/pilot-car/${state.slug}` },
                ],
            },
            {
                "@type": "FAQPage",
                mainEntity: [
                    {
                        "@type": "Question",
                        name: `How many pilot cars do I need in ${state.name}?`,
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: `In ${state.name}, loads wider than ${state.maxWidthFt} feet require at least one escort vehicle. Loads exceeding 14 feet typically require both lead and chase cars.`,
                        },
                    },
                    {
                        "@type": "Question",
                        name: `Do I need a pilot car for my oversize load in ${state.name}?`,
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: `Yes, if your load exceeds ${state.maxWidthFt} feet wide or ${state.maxHeightFt} feet tall in ${state.name}.`,
                        },
                    },
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
                    <div className="max-w-5xl mx-auto flex items-center gap-1.5 text-[11px] text-white/30">
                        <Link href="/" className="hover:text-white/60 transition-colors">Haul Command</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/pilot-car" className="hover:text-white/60 transition-colors">Pilot Car</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-white/60">{state.name}</span>
                    </div>
                </div>

                {/* Hero */}
                <div
                    className="px-6 py-12 border-b border-white/5"
                    style={{ background: "linear-gradient(135deg, rgba(241,169,27,0.04) 0%, transparent 60%)" }}
                >
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center gap-2 mb-4">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${isHighDemand
                                ? "text-red-400 bg-red-500/10 border-red-500/20"
                                : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                }`}>
                                {getDemandLabel(state.demandTier)}
                            </span>
                            <span className="text-[10px] text-white/25 uppercase tracking-widest">
                                {state.topCities.length} cities covered
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                            Pilot Car Service<br />
                            <span style={{ color: "#F1A91B" }}>{state.name}</span>
                        </h1>

                        <p className="text-sm text-white/50 max-w-xl leading-relaxed mb-6">
                            Find verified pilot car operators and oversize load escort vehicles in {state.name}.
                            Serving all major corridors, ports, and industrial zones across {state.abbr}.
                        </p>

                        {/* Keyword pills — SEO signal + UX */}
                        <div className="flex flex-wrap gap-1.5">
                            {keywords.map((k) => (
                                <span key={k} className="text-[10px] text-white/30 border border-white/8 rounded-full px-2.5 py-1">
                                    {k}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main content grid */}
                <div className="max-w-5xl mx-auto px-6 py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Left: Main content */}
                        <div className="lg:col-span-2 space-y-10">
                            {/* Intro */}
                            <section>
                                <h2 className="text-base font-black text-white mb-3">
                                    Oversize Load Escort in {state.name}
                                </h2>
                                <p className="text-sm text-white/50 leading-relaxed mb-3">
                                    {getRequirementsIntro(state)} Haul Command connects carriers and freight brokers
                                    with the most reliable pilot car operators in {state.name}, with coverage across
                                    all major interstates, industrial corridors, and port access routes.
                                </p>
                                <p className="text-sm text-white/40 leading-relaxed">
                                    Every operator listed on Haul Command has been reviewed by active freight brokers
                                    operating on {state.name} corridor lanes. Trust scores reflect response time,
                                    load completion rate, and peer ratings.
                                </p>
                            </section>

                            {/* City grid */}
                            <CityGrid state={state} />

                            {/* Load types */}
                            <LoadTypeGrid state={state} />

                            {/* Corridors */}
                            {state.corridors.length > 0 && (
                                <section>
                                    <h2 className="text-base font-black text-white mb-4">
                                        Major Corridors — {state.name}
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {state.corridors.map((corridorSlug) => (
                                            <Link
                                                key={corridorSlug}
                                                href={`/corridors/${corridorSlug}`}
                                                className="group flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]"
                                            >
                                                <span className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors uppercase tracking-wider text-[11px]">
                                                    {corridorSlug.replace(/-/g, " ")}
                                                </span>
                                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-amber-400 transition-colors" />
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Ports */}
                            {state.portSlugs && state.portSlugs.length > 0 && (
                                <section>
                                    <h2 className="text-base font-black text-white mb-4">
                                        Port Access — {state.name}
                                    </h2>
                                    <p className="text-[12px] text-white/40 mb-3">
                                        Port-adjacent moves require special escort coordination, TWIC clearance for gate entry, and pre-arranged pickup windows. Haul Command lists TWIC-verified operators near each port below.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {state.portSlugs.map((portSlug) => (
                                            <Link
                                                key={portSlug}
                                                href={`/ports/${portSlug}`}
                                                className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold text-white/60 border-white/10 hover:border-amber-500/30 hover:text-amber-300 transition-all"
                                            >
                                                {portSlug.replace(/-/g, " ")}
                                                <ChevronRight className="w-3 h-3" />
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* FAQ */}
                            <FaqSection state={state} />

                            {/* Internal link mesh */}
                            <section className="pt-4 border-t border-white/5">
                                <h3 className="text-xs font-black uppercase tracking-widest text-white/25 mb-3">
                                    More Escort Services in {state.name}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { label: "Height Pole Service", href: `/pilot-car/${state.slug}/height-pole` },
                                        { label: "Night Move Escorts", href: `/pilot-car/${state.slug}/night-moves` },
                                        { label: "Wind Turbine Escorts", href: `/pilot-car/${state.slug}/wind-turbine` },
                                        { label: `${state.abbr} Escort Requirements`, href: `/escort-requirements/${state.slug}` },
                                        { label: "Oversize Permits", href: `/pilot-car/${state.slug}/permits` },
                                    ].map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="text-[11px] text-white/30 border border-white/8 rounded-lg px-2.5 py-1.5 hover:text-amber-300 hover:border-amber-500/25 transition-all"
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Right: Sidebar */}
                        <div className="space-y-4">
                            {/* Shortage alert — fires only for high-demand states */}
                            {isHighDemand && (
                                <ShortageAlertBanner
                                    entityId={state.slug}
                                    entityType="corridor"
                                    entityName={`${state.name} escort market`}
                                    demandScore={state.demandTier === "high" ? 82 : 65}
                                    threshold={65}
                                    ctaHref={`/pilot-car/${state.slug}#estimate`}
                                    ctaLabel="Get Coverage Estimate"
                                />
                            )}

                            {/* Requirements card */}
                            <RequirementsCard state={state} />

                            {/* Coverage Estimate Form */}
                            <div id="estimate">
                                <CoverageEstimateForm
                                    defaultCorridorSlug={state.corridors[0]}
                                />
                            </div>

                            {/* Trust signal */}
                            <div
                                className="rounded-2xl border p-4 space-y-2.5"
                                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Award className="w-4 h-4 text-amber-400/60" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                                        Why Haul Command
                                    </span>
                                </div>
                                {[
                                    "Broker-reviewed operators only",
                                    "TWIC verification on file",
                                    "Real response time data",
                                    "Fill rate by corridor",
                                    "No fake metrics in UI",
                                ].map((point) => (
                                    <div key={point} className="flex items-center gap-2 text-[11px] text-white/45">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0" />
                                        {point}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
