import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin, Truck, Shield, CheckCircle2, Star } from "lucide-react";
import {
    getStateBySlug,
    getCityBySlug,
    getAllCitySlugs,
    getRequirementsIntro,
    KEYWORD_CLUSTERS,
    type StateData,
    type CityData,
} from "@/lib/seo/pilot-car-taxonomy";
import { checkIndexGate, geoRobots } from "@/lib/seo/index-gate";
import { getIndexabilityState, indexRobots } from "@/lib/seo/indexability";
import { CoverageEstimateForm } from "@/components/ports/CoverageEstimateForm";
import { ShortageAlertBanner } from "@/components/ports/ShortageAlertBanner";
import NearbyLogisticsNodes from "@/components/market-gravity/NearbyLogisticsNodes";
import ScarcityBanner from "@/components/market-gravity/ScarcityBanner";

// ── Static generation ─────────────────────────────────────────────────────────

export async function generateStaticParams() {
    return getAllCitySlugs().map(({ stateSlug, citySlug }) => ({
        state: stateSlug,
        city: citySlug,
    }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ state: string; city: string }>;
}): Promise<Metadata> {
    const { state: stateSlug, city: citySlug } = await params;
    const state = getStateBySlug(stateSlug);
    const city = getCityBySlug(stateSlug, citySlug);
    if (!state || !city) return {};

    // ── Unified indexability engine: hysteresis + revenue-weighted ──
    const ixState = await getIndexabilityState('city', { state: state.abbr, city: citySlug });

    const keywords = KEYWORD_CLUSTERS.tier1_city(city.name, state.name);
    const title = `Pilot Car ${city.name} ${state.abbr} | Oversize Escort Near ${city.name}`;
    const description = `Find verified pilot car operators near ${city.name}, ${state.name}. ${city.county ? `Serving ${city.county} and surrounding areas. ` : ""}Oversize load escort, wide load pilot car service${city.nearPort ? `, port access (${city.nearPort})` : ""}. Get an instant coverage estimate.`;

    return {
        title,
        description,
        keywords: keywords.join(", "),
        robots: indexRobots(ixState),
        alternates: { canonical: `/pilot-car/${state.slug}/${city.slug}` },
        openGraph: {
            title,
            description,
            type: "website",
            url: `/pilot-car/${state.slug}/${city.slug}`,
        },
    };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PilotCarCityPage({
    params,
}: {
    params: Promise<{ state: string; city: string }>;
}) {
    const { state: stateSlug, city: citySlug } = await params;
    const state = getStateBySlug(stateSlug);
    const city = getCityBySlug(stateSlug, citySlug);
    if (!state || !city) notFound();

    const keywords = KEYWORD_CLUSTERS.tier1_city(city.name, state.name);
    const isHighDemand = city.demandTier === "high";
    const demandScore = city.demandTier === "high" ? 80 : city.demandTier === "medium" ? 60 : 40;

    // Nearby cities (same state, exclude current)
    const nearbyCities = state.topCities
        .filter((c) => c.slug !== city.slug)
        .slice(0, 4);

    // Structured data
    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "LocalBusiness",
                "@id": `https://haulcommand.com/pilot-car/${state.slug}/${city.slug}`,
                name: `Pilot Car Service ${city.name} ${state.abbr}`,
                description: `Verified pilot car operators and oversize load escort services in ${city.name}, ${state.name}.`,
                address: {
                    "@type": "PostalAddress",
                    addressLocality: city.name,
                    addressRegion: state.abbr,
                    addressCountry: "US",
                },
                areaServed: {
                    "@type": "City",
                    name: city.name,
                    containsPlace: { "@type": "State", name: state.name },
                },
                serviceType: "Pilot Car / Oversize Load Escort",
            },
            {
                "@type": "BreadcrumbList",
                itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Haul Command", item: "/" },
                    { "@type": "ListItem", position: 2, name: "Pilot Car", item: "/pilot-car" },
                    { "@type": "ListItem", position: 3, name: state.name, item: `/pilot-car/${state.slug}` },
                    { "@type": "ListItem", position: 4, name: city.name, item: `/pilot-car/${state.slug}/${city.slug}` },
                ],
            },
            {
                "@type": "FAQPage",
                mainEntity: [
                    {
                        "@type": "Question",
                        name: `How do I find a pilot car in ${city.name}?`,
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: `Haul Command lists verified pilot car operators near ${city.name}, ${state.name}. Search by load type, corridor, or available dates to match with an available escort.`,
                        },
                    },
                    {
                        "@type": "Question",
                        name: `What are the escort requirements for oversize loads near ${city.name}?`,
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: getRequirementsIntro(state),
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
                    <div className="max-w-5xl mx-auto flex items-center gap-1.5 text-[11px] text-white/30 flex-wrap">
                        <Link href="/" className="hover:text-white/60 transition-colors">Haul Command</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/pilot-car" className="hover:text-white/60 transition-colors">Pilot Car</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/pilot-car/${state.slug}`} className="hover:text-white/60 transition-colors">{state.name}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-white/60">{city.name}</span>
                    </div>
                </div>

                {/* Hero */}
                <div className="px-6 py-12 border-b border-white/5" style={{ background: "linear-gradient(135deg, rgba(241,169,27,0.04) 0%, transparent 60%)" }}>
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                                {city.county ?? `${city.name}, ${state.abbr}`}
                            </span>
                            {isHighDemand && (
                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border text-red-400 bg-red-500/10 border-red-500/20">
                                    High Demand
                                </span>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                            Pilot Car Near{" "}
                            <span style={{ color: "#F1A91B" }}>{city.name}</span>
                            <br />
                            <span className="text-xl text-white/50">{state.name} Oversize Escort</span>
                        </h1>

                        <p className="text-sm text-white/50 max-w-xl leading-relaxed mb-5">
                            Find verified pilot car operators servicing {city.name} {city.county ? `(${city.county})` : ""} and corridors connecting to
                            {city.nearPort ? ` ${city.nearPort.replace(/-/g, " ")},` : ""} surrounding industrial zones and freight lanes in {state.abbr}.
                        </p>

                        {/* Keyword pills */}
                        <div className="flex flex-wrap gap-1.5">
                            {keywords.map((k) => (
                                <span key={k} className="text-[10px] text-white/25 border border-white/7 rounded-full px-2.5 py-1">
                                    {k}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main content grid */}
                <div className="max-w-5xl mx-auto px-6 py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Left col */}
                        <div className="lg:col-span-2 space-y-10">
                            {/* Intro */}
                            <section>
                                <h2 className="text-base font-black text-white mb-3">
                                    Oversize Load Escort in {city.name}, {state.name}
                                </h2>
                                <p className="text-sm text-white/50 leading-relaxed mb-3">
                                    {city.name} is a key freight node in {state.name} — {
                                        city.nearPort
                                            ? `serving as the primary access point for ${city.nearPort.replace(/-/g, " ")} cargo movements.`
                                            : city.nearCorridor
                                                ? `positioned along the ${city.nearCorridor.replace(/-/g, " ").toUpperCase()} corridor, one of the heaviest oversize freight lanes in the region.`
                                                : `supporting regional oversize freight movement throughout ${state.abbr}.`
                                    }{" "}
                                    {getRequirementsIntro(state)}
                                </p>
                                <p className="text-sm text-white/40 leading-relaxed">
                                    All pilot car operators listed on Haul Command serving {city.name} are verified by active freight brokers.
                                    Trust scores are based on real load completion data, response time, and peer reviews — not self-reported metrics.
                                </p>
                            </section>

                            {/* Port/Corridor context */}
                            {(city.nearPort || city.nearCorridor) && (
                                <section>
                                    <h2 className="text-base font-black text-white mb-4">
                                        Key Routes from {city.name}
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {city.nearPort && (
                                            <Link
                                                href={`/ports/${city.nearPort}`}
                                                className="group rounded-xl border px-4 py-4 transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]"
                                            >
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400/60 mb-1">Nearby Port</div>
                                                <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                                                    {city.nearPort.replace(/-/g, " ")}
                                                </div>
                                                <div className="text-[10px] text-white/30 mt-1">TWIC-verified escorts available</div>
                                            </Link>
                                        )}
                                        {city.nearCorridor && (
                                            <Link
                                                href={`/corridors/${city.nearCorridor}`}
                                                className="group rounded-xl border px-4 py-4 transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]"
                                            >
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400/60 mb-1">Primary Corridor</div>
                                                <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors uppercase">
                                                    {city.nearCorridor.replace(/-/g, " ")}
                                                </div>
                                                <div className="text-[10px] text-white/30 mt-1">Active sponsored operators</div>
                                            </Link>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Requirements summary */}
                            <section>
                                <h2 className="text-base font-black text-white mb-3">
                                    {state.abbr} Escort Requirements — Quick Reference
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                    {[
                                        { label: "Max Width (No Escort)", value: `${state.maxWidthFt}ft`, color: "text-emerald-400" },
                                        { label: "Max Height (No Escort)", value: `${state.maxHeightFt}ft`, color: "text-emerald-400" },
                                        { label: "Escort Required Above", value: `${state.maxWidthFt}ft`, color: "text-amber-400" },
                                        { label: "Police Trigger", value: state.policeWidthFt ? `${state.policeWidthFt}ft+` : "Case-by-case", color: "text-red-400" },
                                    ].map((stat) => (
                                        <div key={stat.label} className="rounded-xl border p-3 text-center">
                                            <div className={`text-lg font-black tabular-nums ${stat.color}`}>{stat.value}</div>
                                            <div className="text-[9px] text-white/30 mt-1 leading-tight">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                                <Link
                                    href={`/escort-requirements/${state.slug}`}
                                    className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
                                >
                                    Full {state.name} escort requirements guide
                                    <ChevronRight className="w-3 h-3" />
                                </Link>
                            </section>

                            {/* Logistics Nodes — truck stops & hotels (Layer 5) */}
                            <NearbyLogisticsNodes
                                city={city.name}
                                state={state.name}
                                limit={6}
                                className=""
                            />

                            {/* Nearby cities */}
                            {nearbyCities.length > 0 && (
                                <section>
                                    <h2 className="text-base font-black text-white mb-4">
                                        Pilot Car Coverage — Nearby {state.name} Cities
                                    </h2>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {nearbyCities.map((c) => (
                                            <Link
                                                key={c.slug}
                                                href={`/pilot-car/${state.slug}/${c.slug}`}
                                                className="group flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-3 h-3 text-amber-400/40" />
                                                    <span className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">{c.name}</span>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-amber-400 transition-colors" />
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* City-level FAQ */}
                            <section>
                                <h2 className="text-base font-black text-white mb-4">
                                    Pilot Car FAQ — {city.name}
                                </h2>
                                <div className="space-y-3">
                                    {[
                                        {
                                            q: `How do I find a pilot car near ${city.name}?`,
                                            a: `Haul Command lists broker-reviewed pilot car operators serving ${city.name} and ${city.county ?? state.name}. Use the coverage estimate form to describe your load and get matched with an available escort that covers your specific route.`,
                                        },
                                        {
                                            q: `What does pilot car service cost near ${city.name}?`,
                                            a: `Pilot car rates near ${city.name} typically run $1.75–$3.50 per loaded mile. Night moves, police-required loads, and short-notice bookings command higher rates. High-demand periods${isHighDemand ? " (frequent in this area)" : ""} can push rates 20–40% above base. Use the estimator to get a range for your specific load.`,
                                        },
                                        {
                                            q: `Are pilot car operators in ${city.name} TWIC certified?`,
                                            a: `${city.nearPort ? `Yes — operators near ${city.name} who serve ${city.nearPort.replace(/-/g, " ")} are required to carry TWIC cards for port gate access. ` : ""}Haul Command verifies TWIC status for all operators listed near port-accessible freight zones. Filter by TWIC-verified when searching.`,
                                        },
                                        {
                                            q: `How far in advance should I book a pilot car in ${city.name}?`,
                                            a: `For standard oversize loads near ${city.name}, book 24–48 hours in advance. Police escort requirements need 72 hours minimum notice. During high-demand windows or peak season, same-day availability is limited — especially for multi-escort jobs.`,
                                        },
                                    ].map((faq, i) => (
                                        <div key={i} className="rounded-xl border px-4 py-4">
                                            <h3 className="text-sm font-bold text-white mb-2">{faq.q}</h3>
                                            <p className="text-[12px] text-white/50 leading-relaxed">{faq.a}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* SEO link mesh */}
                            <section className="border-t border-white/5 pt-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-white/25 mb-3">
                                    Related Pages
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { label: `Pilot Car ${state.name}`, href: `/pilot-car/${state.slug}` },
                                        { label: `${state.abbr} Escort Requirements`, href: `/escort-requirements/${state.slug}` },
                                        ...(city.nearCorridor ? [{ label: `${city.nearCorridor.replace(/-/g, " ").toUpperCase()} Corridor`, href: `/corridors/${city.nearCorridor}` }] : []),
                                        ...(city.nearPort ? [{ label: city.nearPort.replace(/-/g, " "), href: `/ports/${city.nearPort}` }] : []),
                                        { label: "Oversize Load Directory", href: "/directory" },
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

                        {/* Right sidebar */}
                        <div className="space-y-4">
                            {/* Layer 4 — scarcity forecast banner (DB-driven, replaces static check) */}
                            <ScarcityBanner
                                geoKey={state.slug}
                                geoType="state"
                            />

                            {isHighDemand && (
                                <ShortageAlertBanner
                                    entityId={city.slug}
                                    entityType="corridor"
                                    entityName={`${city.name} escort market`}
                                    demandScore={demandScore}
                                    threshold={65}
                                    ctaHref="#estimate"
                                    ctaLabel="Get Coverage Estimate"
                                />
                            )}

                            <div id="estimate">
                                <CoverageEstimateForm
                                    defaultPortSlug={city.nearPort}
                                    defaultPortName={city.name}
                                    defaultCorridorSlug={city.nearCorridor}
                                />
                            </div>

                            {/* Trust badge */}
                            <div className="rounded-2xl border p-4 space-y-2.5" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Star className="w-3.5 h-3.5 text-amber-400/60" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                                        Haul Command Verified
                                    </span>
                                </div>
                                {[
                                    `Broker-reviewed operators in ${city.name}`,
                                    "TWIC verification where applicable",
                                    "Real response time data",
                                    "Corridor fill rate info",
                                ].map((p) => (
                                    <div key={p} className="flex items-center gap-2 text-[11px] text-white/40">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0" />
                                        {p}
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
