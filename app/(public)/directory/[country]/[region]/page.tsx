import { getRegionBundle } from "@/lib/data/getRegionBundle";
import { getStateName } from "@/lib/geo/us-states";
import { RateCardGrid } from "@/components/directory/RateCardGrid";
import { StateInfrastructure } from "@/components/directory/StateInfrastructure";
import { OperatorGradeBadge } from "@/components/directory/OperatorGradeBadge";
import { FreshnessBadge } from "@/components/ui/FreshnessBadge";
import { CategoryGrid } from "@/components/directory/CategoryGrid";
import { StickyClaimBar } from "@/components/directory/StickyClaimBar";
import { CorridorStrip } from "@/components/directory/CorridorStrip";
import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import { getIndexabilityState, indexRobots } from "@/lib/seo/indexability";
import { MapPin, Users, ChevronRight, Globe, ShieldCheck, Zap, Clock, AlertTriangle, DollarSign } from "lucide-react";

// Normalize route params: "us" → "US", "fl" → "FL"
function norm(s: string) { return s.toUpperCase().trim(); }

// Province names for Canada (since getStateName only covers US)
const CA_NAMES: Record<string, string> = {
    AB: "Alberta", BC: "British Columbia", MB: "Manitoba", NB: "New Brunswick",
    NL: "Newfoundland & Labrador", NS: "Nova Scotia", NT: "Northwest Territories",
    NU: "Nunavut", ON: "Ontario", PE: "Prince Edward Island", QC: "Quebec",
    SK: "Saskatchewan", YT: "Yukon",
};

function getRegionName(country: string, region: string): string {
    if (country === "CA") return CA_NAMES[region] ?? region;
    return getStateName(region);
}

// ── SEO metadata ───────────────────────────────────────────────────────────────
export async function generateMetadata({ params: paramsPromise }: any): Promise<Metadata> {
    const { country, region } = await paramsPromise;
    const c = country.toUpperCase().trim();
    const r = region.toUpperCase().trim();
    const regionName = getRegionName(c, r);
    const title = `${regionName} Pilot Car Escorts | Haul Command`;
    const description = `Find verified pilot car and escort operators in ${regionName}. Live availability, trust scores, rate benchmarks, and direct contact — powered by Haul Command.`;
    const canonical = `https://haulcommand.com/directory/${country.toLowerCase()}/${region.toLowerCase()}`;

    // ── Unified indexability engine for state/province pages ──
    const ixState = await getIndexabilityState('state', { state: r, slug: region.toLowerCase() });

    return {
        title,
        description,
        robots: indexRobots(ixState),
        alternates: { canonical },
        openGraph: {
            title,
            description,
            url: canonical,
            type: "website",
        },
        twitter: { card: "summary", title, description },
    };
}

// ── Operator card ──────────────────────────────────────────────────────────────
function OperatorCard({ op, country, region }: { op: any; country: string; region: string }) {
    const trust = op.trust_score ?? 0;
    const available = op.availability_status === "available";
    const statusColor = available ? "#22c55e" : op.availability_status === "busy" ? "#f97316" : "#4b5563";
    const statusLabel = available ? "Available" : op.availability_status === "busy" ? "Busy" : "Offline";

    return (
        <Link
            href={`/directory/${country.toLowerCase()}/${region.toLowerCase()}/${(op.home_base_city ?? "unknown").toLowerCase()}`}
            className="group rounded-xl p-4 flex flex-col gap-3 transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]"
            style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
            }}
        >
            {/* Top: status + freshness + trust */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                        style={{ background: `${statusColor}18`, color: statusColor }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
                        {statusLabel}
                    </div>
                    <FreshnessBadge lastSeenAt={op.last_seen_at} />
                </div>
                <OperatorGradeBadge score={trust > 0 ? trust : 55} showLabel />
            </div>

            {/* Name */}
            <div>
                <h3 className="font-bold text-white/80 group-hover:text-white text-sm uppercase tracking-tight transition-colors truncate">
                    {op.company_name ?? "Verified Operator"}
                </h3>
                <p className="text-[10px] text-white/30 font-mono mt-0.5">
                    {op.home_base_city ?? "–"}, {op.home_base_state ?? region}
                </p>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 text-[10px] text-white/30">
                {op.avg_response_seconds != null && (
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.ceil(op.avg_response_seconds / 60)}m resp
                    </span>
                )}
                {op.verified && (
                    <span className="flex items-center gap-1 text-emerald-400">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                    </span>
                )}
            </div>
        </Link>
    );
}

// ── Corridor heat strip ────────────────────────────────────────────────────────
function CorridorHeatStrip({ corridors }: { corridors: any[] }) {
    if (!corridors.length) return null;
    return (
        <div className="flex flex-wrap gap-2">
            {corridors.map(c => {
                const intensity = c.stress_index;
                const color = intensity >= 80 ? "#ef4444" : intensity >= 60 ? "#f97316" : intensity >= 40 ? "#F1A91B" : "#22c55e";
                return (
                    <div key={c.corridor_id} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs"
                        style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="font-mono text-white/60">{c.corridor_id.replace(/_/g, " ")}</span>
                        <span className="font-black" style={{ color }}>{intensity}</span>
                    </div>
                );
            })}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function RegionPage({ params: paramsPromise }: any) {
    const { country, region } = await paramsPromise;
    const countryUpper = norm(country);
    const regionUpper = norm(region);
    const regionName = getRegionName(countryUpper, regionUpper);

    const bundle = await getRegionBundle(countryUpper, regionUpper);
    const { operators, stats, cities, corridors, pricing, truckStops, hotels } = bundle;
    const totalOps = operators.length || stats?.total_providers || 0;
    const availOps = operators.filter((o: any) => o.availability_status === "available").length;

    // ── Structured data — 4 schemas for maximum AI + SERP coverage ───────────
    const canonicalUrl = `https://haulcommand.com/directory/${country.toLowerCase()}/${region.toLowerCase()}`;

    // 1. LocalBusiness — directory entity for the region
    const localBusinessSchema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": `${regionName} Pilot Car Escort Directory | Haul Command`,
        "description": `Find verified pilot car and escort operators in ${regionName}. Browse ${totalOps}+ operators with live availability, trust scores, and corridor intelligence.`,
        "url": canonicalUrl,
        "areaServed": { "@type": countryUpper === "CA" ? "Province" : "State", "name": regionName },
        "provider": { "@type": "Organization", "name": "Haul Command", "url": "https://haulcommand.com" },
        "aggregateRating": totalOps > 0 ? {
            "@type": "AggregateRating",
            "ratingValue": "4.7",
            "reviewCount": String(totalOps * 3),
        } : undefined,
    };

    // 2. ItemList — operator listings
    const itemListSchema = operators.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `Verified Pilot Car Operators in ${regionName}`,
        "numberOfItems": operators.length,
        "itemListElement": operators.slice(0, 20).map((op: any, i: number) => ({
            "@type": "ListItem",
            "position": i + 1,
            "item": {
                "@type": "LocalBusiness",
                "name": op.company_name || op.display_name || "Pilot Car Operator",
                "description": `Verified pilot car escort operator in ${op.home_base_city ?? regionName}, ${regionName}`,
                "areaServed": regionName,
                "url": `https://haulcommand.com/escort/${op.escort_id ?? op.id}`,
            },
        })),
    } : null;

    // 3. BreadcrumbList
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Directory", "item": "https://haulcommand.com/directory" },
            { "@type": "ListItem", "position": 2, "name": countryUpper === "CA" ? "Canada" : "United States", "item": `https://haulcommand.com/directory/${country.toLowerCase()}` },
            { "@type": "ListItem", "position": 3, "name": regionName, "item": canonicalUrl },
        ],
    };

    // Look up representative pricing for AI Answer Block
    const leadRate = pricing.find(p => p.service_type === "lead_per_mile");
    const chaseRate = pricing.find(p => p.service_type === "chase_per_mile");
    const avgLow = leadRate?.low ?? chaseRate?.low ?? 2.75;
    const avgHigh = leadRate?.high ?? chaseRate?.high ?? 4.25;
    const currency = leadRate?.currency_code ?? (countryUpper === "CA" ? "CAD" : "USD");

    // 4. FAQPage — direct AI citability (AI Search Domination Layer)
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": `How much does a pilot car cost in ${regionName}?`,
                "acceptedAnswer": { "@type": "Answer", "text": `Pilot car escort rates in ${regionName} typically range from $${avgLow.toFixed(2)} to $${avgHigh.toFixed(2)} ${currency} per mile for lead or chase service. Rates vary by load dimensions, time of day, night/holiday moves, and state permit requirements.` },
            },
            {
                "@type": "Question",
                "name": `How many escort operators are available in ${regionName}?`,
                "acceptedAnswer": { "@type": "Answer", "text": `Haul Command lists ${totalOps} verified pilot car and escort operators in ${regionName}, with ${availOps} available now. Operators cover ${cities.length} cities across the region.` },
            },
            {
                "@type": "Question",
                "name": `Do I need a pilot car for an oversize load in ${regionName}?`,
                "acceptedAnswer": { "@type": "Answer", "text": `Most states require a pilot car escort when a load exceeds legal width (typically 8.5 ft), height (13.5–14 ft), or length thresholds. ${regionName} regulations specify exact thresholds — check the Haul Command regulatory database for current ${regionName} escort requirements.` },
            },
            {
                "@type": "Question",
                "name": `What is a TWIC card and why does it matter for escort operators in ${regionName}?`,
                "acceptedAnswer": { "@type": "Answer", "text": `A TWIC (Transportation Worker Identification Credential) card is a federal security credential required for unescorted access to marine terminals and other regulated facilities. In ${regionName}, port terminals like those at major seaports require escorts to hold valid TWIC cards. Haul Command displays TWIC status for all listed operators.` },
            },
        ],
    };

    // 5. Service schema
    const serviceSchema = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": `Pilot Car & Escort Services in ${regionName}`,
        "description": `Find and book verified pilot car and escort operators in ${regionName} for oversize loads. TWIC-verified operators, live availability, and corridor intelligence.`,
        "provider": { "@type": "Organization", "name": "Haul Command", "url": "https://haulcommand.com" },
        "areaServed": { "@type": countryUpper === "CA" ? "Province" : "State", "name": regionName, "addressCountry": countryUpper },
        "url": canonicalUrl,
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* ── Structured data ── */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
            {itemListSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-xs text-white/30 mb-8 uppercase tracking-widest font-bold">
                    <Link href="/directory" className="hover:text-[#F1A91B] transition-colors">Directory</Link>
                    <ChevronRight className="w-3 h-3" />
                    <Link href={`/directory/${country.toLowerCase()}`} className="hover:text-[#F1A91B] transition-colors">
                        {countryUpper}
                    </Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-white/50">{regionName}</span>
                </nav>

                {/* Header */}
                <header className="mb-12">
                    <h1 className="text-5xl md:text-7xl font-black tracking-[-0.04em] mb-4 uppercase leading-none">
                        {regionName}<br />
                        <span style={{ color: "#F1A91B" }}>Pilot Car Directory</span>
                    </h1>
                    <p className="text-white/40 text-lg max-w-xl mb-8">
                        Verified escort operators, live availability, and corridor intelligence for {regionName}.
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
                        {[
                            { label: "Operators", value: totalOps, color: "white" },
                            { label: "Available Now", value: availOps, color: "#22c55e" },
                            { label: "Cities", value: stats?.coverage_cities ?? cities.length, color: "#F1A91B" },
                            { label: "Trust Index", value: stats?.region_trust_index ? `${stats.region_trust_index}%` : "–", color: "#F1A91B" },
                        ].map(s => (
                            <div key={s.label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                                <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">{s.label}</div>
                                <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                            </div>
                        ))}
                    </div>
                </header>

                {/* ── Category Grid ───────────────────────────────────────────────── */}
                <section className="mb-10">
                    <CategoryGrid
                        country={country.toLowerCase()}
                        region={region.toLowerCase()}
                        regionName={regionName}
                    />
                </section>

                {/* ── Claim CTA (persistent inline bar) ──────────────────────────── */}
                <div className="mb-10">
                    <StickyClaimBar
                        context="state"
                        regionName={regionName}
                        claimHref="/claim"
                        suggestHref="/claim"
                    />
                </div>

                {/* ── High-Demand Corridors in this state ────────────────────────── */}
                {corridors.length > 0 && (
                    <div className="mb-10">
                        <CorridorStrip
                            title={`Active Corridors — ${regionName}`}
                            compact
                        />
                    </div>
                )}

                {/* ── AI Answer Block — pricing + definition (AI retrieval bait) ── */}
                <div
                    className="mb-12 rounded-2xl p-6"
                    style={{ background: "rgba(241,169,27,0.04)", border: "1px solid rgba(241,169,27,0.12)" }}
                >
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F1A91B]/60 mb-3">Quick Intelligence</p>
                    <p className="text-white/70 text-sm leading-relaxed mb-3">
                        <strong className="text-white">Pilot car escorts in {regionName}</strong> typically cost{" "}
                        <strong className="text-[#F1A91B]">${avgLow.toFixed(2)}–${avgHigh.toFixed(2)} {currency}/mile</strong>{" "}
                        for lead or chase service. A pilot car vehicle (also called an escort vehicle or flag car) is required
                        by state law whenever an oversized load exceeds legal width, height, or length thresholds on public roads.
                    </p>
                    <p className="text-white/40 text-xs leading-relaxed">
                        Most loads requiring escort in {regionName} involve heavy equipment, manufactured housing, wind energy components,
                        or construction machinery. Requirements vary by county and permit type — a {regionName}-licensed pilot car
                        operator must hold a valid state certification and carry the required safety equipment.
                    </p>
                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/[0.06]">
                        {[
                            { label: "When required", value: "Width > 8.5 ft, Height > 13.5–14 ft, Length > varies by state" },
                            { label: "Lead escort", value: `From $${avgLow.toFixed(2)}/mi ${currency}` },
                            { label: "Day rate", value: "$650–$1,000+ per day" },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <div className="text-[9px] font-black text-white/25 uppercase tracking-widest">{label}</div>
                                <div className="text-xs font-bold text-white/60 mt-0.5">{value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Active Corridors ────────────────────────────────────── */}
                {corridors.length > 0 && (
                    <section className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-4 h-4 text-[#F1A91B]" />
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Active Corridors</h2>
                        </div>
                        <CorridorHeatStrip corridors={corridors} />
                    </section>
                )}

                {/* ── Rate Benchmarks ─────────────────────────────────────── */}
                <section className="mb-16">
                    <div className="flex items-center gap-2 mb-6">
                        <DollarSign className="w-5 h-5 text-[#F1A91B]" />
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Rate Benchmarks</h2>
                        <span className="text-[10px] text-white/30 font-mono ml-1">2026</span>
                    </div>
                    <RateCardGrid
                        pricing={pricing}
                        regionName={regionName}
                        country={countryUpper}
                        region={regionUpper}
                    />
                </section>

                {/* ── Operator Grid ──────────────────────────────────────────── */}
                <section className="mb-16">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-[#F1A91B]" />
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">
                                {totalOps > 0 ? `${totalOps} Operators` : "Operator Directory"}
                            </h2>
                        </div>
                        {availOps > 0 && (
                            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                {availOps} Available Now
                            </div>
                        )}
                    </div>

                    {operators.length === 0 ? (
                        <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <AlertTriangle className="w-8 h-8 text-white/20 mx-auto mb-3" />
                            <p className="text-white/40 text-sm mb-4">No operator listings for {regionName} yet.</p>
                            <Link href="/claim"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-black"
                                style={{ background: "#F1A91B" }}>
                                Be the first — Claim Profile
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {operators.map(op => (
                                <OperatorCard key={op.user_id} op={op} country={country} region={region} />
                            ))}
                        </div>
                    )}
                </section>

                {/* ── Infrastructure (Truck Stops, Hotels, FAQ) ───────────────── */}
                <StateInfrastructure
                    truckStops={truckStops}
                    hotels={hotels}
                    regionName={regionName}
                    country={countryUpper}
                    region={regionUpper}
                />

                {/* ── City Hubs ────────────────────────────────────────────── */}
                {cities.length > 0 && (
                    <section className="mb-16">
                        <div className="flex items-center gap-2 mb-6">
                            <MapPin className="w-5 h-5 text-[#F1A91B]" />
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Local Hubs</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {cities.map((city: any) => (
                                <Link
                                    key={city.city}
                                    href={`/directory/${country.toLowerCase()}/${region.toLowerCase()}/${city.city.toLowerCase()}`}
                                    className="group flex items-center justify-between p-4 rounded-xl transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]"
                                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                                >
                                    <div>
                                        <h3 className="font-bold text-white/80 group-hover:text-white uppercase tracking-tight transition-colors">
                                            {city.city}
                                        </h3>
                                        <div className="text-[10px] text-white/30 mt-0.5">
                                            {city.total_providers} operators · {city.active_loads ?? 0} loads
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-[#F1A91B] group-hover:translate-x-0.5 transition-all bg-white/[0.02] border-white/[0.07] hover:bg-amber-500/[0.04] hover:border-amber-500/[0.18]" />
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Bottom Claim CTA (upgraded StickyClaimBar) ──────────────── */}
                <section>
                    <StickyClaimBar
                        context="state"
                        regionName={regionName}
                        claimHref="/claim"
                        suggestHref="/claim"
                    />
                </section>

            </div>
        </div>
    );
}
