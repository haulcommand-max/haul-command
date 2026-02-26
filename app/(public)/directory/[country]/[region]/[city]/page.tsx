import { supabaseServer } from "@/lib/supabase/server";
import React from "react";
import { MarketPulse } from "@/components/seo/MarketPulse";
import { RegulatoryMoat } from "@/components/seo/RegulatoryMoat";
import { ComplianceBadge } from "@/components/badges/ComplianceBadge";
import { DriverList } from "@/components/seo/DriverList";
import { Shield, ShieldCheck, ChevronRight, AlertTriangle, Star } from "lucide-react";
import { SchemaOrchestrator } from "@/components/seo/SchemaOrchestrator";
import { GeoAuthorityFloor } from "@/components/seo/GeoAuthorityFloor";
import { StaticRadarMap } from "@/components/seo/StaticRadarMap";
import { HubLinks, NearbyCities, RuralSatellites, AuthorityLinks } from "@/lib/seo/internal-links";
import { CITY_BY_SLUG, STATE_NAMES_US, PROVINCE_NAMES_CA } from "@/lib/seo/city-data";
import { PAGE_TITLE_TEMPLATES, META_DESC_TEMPLATES } from "@/lib/seo/keyword-vault";
import { GeoMarketplaceHero } from "@/components/seo/GeoMarketplaceHero";
import { CitySponsorshipCTA } from "@/components/monetization/CitySponsorshipCTA";
import LiveLoadFeed from "@/components/directory/LiveLoadFeed";
import EmailCaptureWidget from "@/components/monetization/EmailCaptureWidget";
import LiquidityPulse from "@/components/marketplace/LiquidityPulse";
import AdSlot from "@/components/monetization/AdSlot";
import { SeoSchema, SchemaBuilders } from "@/components/seo/SeoSchema";
import { CorridorReportCard } from "@/components/intelligence/ReportCards";
import CorridorRiskWidget from "@/components/intelligence/CorridorRiskWidget";
import { StickyClaimBar } from "@/components/directory/StickyClaimBar";
import { getIndexabilityState, indexRobots } from "@/lib/seo/indexability";
import Link from "next/link";
import type { Metadata } from "next";

// ── Known category slugs (depth-3 segment shared with city) ──────────────────
const KNOWN_CATEGORIES: Record<string, { label: string; description: string }> = {
    "escort-operators": { label: "Escort Operators", description: "Verified pilot car and escort vehicle operators" },
    "permit-services": { label: "Permit Services", description: "Oversize routing permits and multi-state filings" },
    "pilot-car-equipment": { label: "Pilot Car Equipment", description: "Flags, signs, height poles, warning lights and safety gear" },
    "hotels-motels": { label: "Hotels & Motels", description: "Oversized-load friendly lodging near major corridors" },
    "support-services": { label: "Support Services", description: "Fuel, breakdown assistance, towing and roadside support" },
    "route-compliance": { label: "Route & Compliance", description: "Route surveys, compliance consulting and regulatory resources" },
};

// Province names for Canada
const CA_NAMES: Record<string, string> = {
    AB: "Alberta", BC: "British Columbia", MB: "Manitoba", NB: "New Brunswick",
    NL: "Newfoundland & Labrador", NS: "Nova Scotia", NT: "Northwest Territories",
    NU: "Nunavut", ON: "Ontario", PE: "Prince Edward Island", QC: "Quebec",
    SK: "Saskatchewan", YT: "Yukon",
};

function getRegionLabel(country: string, region: string): string {
    const r = region.toUpperCase();
    if (country.toUpperCase() === "CA") return CA_NAMES[r] ?? r;
    return STATE_NAMES_US[r] ?? r;
}


export async function generateMetadata({ params }: any): Promise<Metadata> {
    const cityEntry = CITY_BY_SLUG[params.city];
    const cityName = cityEntry?.city ?? params.city.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    const st = params.region.toUpperCase();
    const stateName = STATE_NAMES_US[st] || PROVINCE_NAMES_CA[st] || st;

    // ── Unified indexability engine: hysteresis + revenue-weighted ──
    const ixState = await getIndexabilityState('city', { state: st, city: params.city });

    return {
        title: PAGE_TITLE_TEMPLATES.city_service(cityName, stateName),
        description: META_DESC_TEMPLATES.city_service(cityName, stateName, 0),
        robots: indexRobots(ixState),
        keywords: [
            `pilot car service in ${cityName} ${st}`,
            `oversize load escort in ${cityName} ${st}`,
            `pilot car jobs in ${cityName} ${st}`,
            `wide load escort near ${cityName}`,
            `escort vehicle service ${cityName}`,
            `pilot car directory ${cityName} ${st}`,
        ],
        openGraph: { title: `Pilot Car Services in ${cityName}, ${st}`, description: `Verified escort drivers in ${cityName}. Instant dispatch.` },
    };
}

export default async function CityDirectory({ params }: any) {
    const supabase = supabaseServer();
    const { country, region, city } = params;

    // ── Category handler: if city param is a known category slug, render category view ──
    if (KNOWN_CATEGORIES[city]) {
        const cat = KNOWN_CATEGORIES[city];
        const regionLabel = getRegionLabel(country, region);
        let listings: any[] = [];

        try {
            if (city === "escort-operators") {
                const { data } = await supabase
                    .from("escort_profiles")
                    .select("id, company_name, display_name, home_base_city, home_base_state, trust_score, availability_status, twic_verified, verified, slug")
                    .eq("home_base_state", region.toUpperCase())
                    .eq("is_published", true)
                    .order("trust_score", { ascending: false })
                    .limit(50);
                listings = data ?? [];
            } else {
                const { data } = await supabase
                    .from("directory_listings")
                    .select("id, name, city, state, trust_score, verified, slug")
                    .eq("state", region.toUpperCase())
                    .eq("category_slug", city)
                    .eq("is_active", true)
                    .order("trust_score", { ascending: false })
                    .limit(50);
                listings = data ?? [];
            }
        } catch (_) {
            listings = [];
        }

        const verifiedCount = listings.filter((l: any) => l.verified || l.twic_verified).length;

        return (
            <div className="min-h-screen bg-gray-950 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-xs text-white/30 mb-8 uppercase tracking-widest font-bold flex-wrap">
                        <Link href="/directory" className="hover:text-[#F1A91B] transition-colors">Directory</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/directory/${country.toLowerCase()}`} className="hover:text-[#F1A91B] transition-colors">{country.toUpperCase()}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/directory/${country.toLowerCase()}/${region.toLowerCase()}`} className="hover:text-[#F1A91B] transition-colors">{regionLabel}</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-white/50">{cat.label}</span>
                    </nav>

                    {/* Header */}
                    <header className="mb-8">
                        <h1 className="text-5xl font-black tracking-tight uppercase leading-none mb-2">
                            {cat.label}
                        </h1>
                        <p className="text-white/40 text-base max-w-xl">{cat.description} in {regionLabel}.</p>
                        <div className="flex items-center gap-3 mt-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold"
                                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                {listings.length > 0 ? `${listings.length} listings` : "No listings yet"}
                            </div>
                            {verifiedCount > 0 && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold"
                                    style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    {verifiedCount} Verified
                                </div>
                            )}
                        </div>
                    </header>

                    {/* Claim CTA */}
                    <div className="mb-8">
                        <StickyClaimBar context="category" regionName={regionLabel} claimHref="/claim" suggestHref="/claim" />
                    </div>

                    {/* Listings or empty state */}
                    {listings.length === 0 ? (
                        <div className="rounded-2xl p-12 text-center"
                            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <AlertTriangle className="w-8 h-8 text-white/20 mx-auto mb-4" />
                            <h2 className="text-lg font-bold text-white/40 mb-2">Coverage growing in {regionLabel}</h2>
                            <p className="text-white/25 text-sm mb-6 max-w-sm mx-auto">
                                No verified {cat.label.toLowerCase()} yet for this area. Be the first to list.
                            </p>
                            <Link href="/claim"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest text-black"
                                style={{ background: "#F1A91B" }}>
                                <ShieldCheck className="w-4 h-4" />
                                Add your listing — Free
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {listings.map((l: any) => {
                                const name = l.company_name || l.display_name || l.name || "Verified Listing";
                                const verified = l.verified || l.twic_verified;
                                return (
                                    <div key={l.id} className="rounded-2xl p-5 flex flex-col gap-3"
                                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="font-bold text-white/90 text-sm leading-tight">{name}</div>
                                                {(l.home_base_city || l.city) && (
                                                    <div className="text-[11px] text-white/35 mt-0.5">{l.home_base_city || l.city}, {region.toUpperCase()}</div>
                                                )}
                                            </div>
                                            {verified ? (
                                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex-shrink-0"
                                                    style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
                                                    <ShieldCheck className="w-2.5 h-2.5" />Verified
                                                </div>
                                            ) : (
                                                <Link href="/claim"
                                                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex-shrink-0 text-black"
                                                    style={{ background: "#F1A91B" }}>
                                                    Claim
                                                </Link>
                                            )}
                                        </div>
                                        {l.trust_score != null && (
                                            <div className="flex items-center gap-1 text-xs text-white/40">
                                                <Star className="w-3 h-3" style={{ color: "#F1A91B" }} />
                                                Trust {l.trust_score}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── Normal city page ────────────────────────────────────────────────────────
    const { data: drivers } = await supabase
        .from("directory_drivers")
        .select("*")
        .eq("country_code", country)
        .eq("region_code", region)
        .eq("city_slug", city)
        .order("is_verified", { ascending: false })
        .limit(50);

    // 2. Fetch Market Pulse Data
    const { data: pulse } = await supabase
        .from("seo_market_pulse")
        .select("*")
        .eq("country", country.toUpperCase())
        .eq("region_code", region.toUpperCase())
        .eq("city", city.charAt(0).toUpperCase() + city.slice(1)) // Basic capitalization
        .single();

    // 3. Fetch Regulatory Summary
    const { data: regSummary } = await supabase.rpc("get_state_reg_summary", {
        p_state_code: region.toUpperCase(),
    });

    const cityName = city.charAt(0).toUpperCase() + city.slice(1);
    const regionName = region.toUpperCase();

    // Calculate dynamic gap score if not strictly coming from pulse table
    const safeDriverCount = drivers?.length || 0;
    const safeLoadCount = pulse?.active_loads || 0;
    const computedGap = safeDriverCount > 0 ? Math.min(100, (safeLoadCount / safeDriverCount) * 25) : 100;

    // Calculate dynamic sponsorship price based on city volume / demand
    const dynamicPrice = Math.max(250, safeLoadCount * 15 + safeDriverCount * 5);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-amber-500/30">
            <SchemaOrchestrator
                type="CityDirectory"
                data={{
                    city: cityName,
                    state: regionName,
                    url: `https://haulcommand.com/directory/${country}/${region}/${city}`,
                    driverCount: safeDriverCount,
                    loadCount: safeLoadCount,
                    breadcrumbs: [
                        { name: 'Home', url: 'https://haulcommand.com' },
                        { name: 'Directory', url: 'https://haulcommand.com/directory' },
                        { name: regionName, url: `https://haulcommand.com/directory/${country}/${region}` },
                        { name: cityName, url: `https://haulcommand.com/directory/${country}/${region}/${city}` }
                    ]
                }}
            />
            <SeoSchema schemas={[
                SchemaBuilders.localBusiness({
                    name: `Pilot Car Services - ${cityName}, ${regionName}`,
                    url: `https://haulcommand.com/directory/${country}/${region}/${city}`,
                    areaServed: `${cityName}, ${regionName}`,
                }),
                SchemaBuilders.breadcrumbList([
                    { name: 'Home', item: 'https://haulcommand.com' },
                    { name: 'Directory', item: 'https://haulcommand.com/directory' },
                    { name: regionName, item: `https://haulcommand.com/directory/${country}/${region}` },
                    { name: cityName, item: `https://haulcommand.com/directory/${country}/${region}/${city}` },
                ]),
            ]} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Embedded Marketplace Dashboard Smashing Feature */}
                <GeoMarketplaceHero
                    cityName={cityName}
                    regionName={regionName}
                    activeDrivers={safeDriverCount}
                    activeLoads={safeLoadCount}
                    supplyGapScore={computedGap}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 mt-6">
                    <div className="lg:col-span-2">
                        <CorridorRiskWidget corridorSlug={`${city}-${region}`} />
                    </div>
                    <div>
                        <CorridorReportCard corridorSlug={`${city}-${region}`} />
                    </div>
                </div>

                {/* 🧬 LIQUIDITY PREDICTION (10X Directive) */}
                <LiquidityPulse state={regionName} />

                {/* 🔴 LIVE MARKETPLACE SMASH (Phase 0) */}
                <LiveLoadFeed city={cityName} state={regionName} limit={5} />

                {/* 🔴 EMAIL CAPTURE WIDGET (Phase 0) */}
                <EmailCaptureWidget
                    headline={`Get notified when loads hit ${cityName}`}
                    geoInterest={`${cityName}, ${regionName}`}
                    context="city"
                />

                <GeoAuthorityFloor citySlug={city} cityName={cityName} stateName={regionName} />

                {/* Radar Map (Spatial Context) */}
                <section className="mb-16">
                    <StaticRadarMap
                        cityName={cityName}
                        state={regionName}
                        radiusMiles={50}
                        activeDrivers={drivers?.length || 3}
                    />
                </section>

                {/* Market Pulse Section */}
                <section className="mb-16">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                            Real-Time Market Pulse
                        </h2>
                    </div>
                    <MarketPulse
                        totalProviders={pulse?.total_providers || 0}
                        activeLoads={pulse?.active_loads || 0}
                        avgTrust={pulse?.avg_trust_score || 0}
                        benchmarkLow={pulse?.benchmark_low}
                        benchmarkHigh={pulse?.benchmark_high}
                        regionCode={regionName}
                    />
                </section>

                {/* Regulatory Moat */}
                {regSummary && (
                    <section className="mb-16">
                        <RegulatoryMoat
                            stateName={regSummary.state_name || regionName}
                            escortWidth={regSummary.escort_width}
                            escortHeight={regSummary.escort_height}
                            poleTrigger={regSummary.pole_trigger}
                            nightRules={regSummary.night_rules}
                            holidayRules={regSummary.holiday_rules}
                            confidence={regSummary.confidence || 0}
                        />
                    </section>
                )}

                {/* Directory Grid */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                            Verified Providers in {cityName}
                        </h2>
                        <div className="text-xs text-slate-500">
                            Showing {drivers?.length || 0} local operators
                        </div>
                    </div>

                    <DriverList drivers={drivers ?? []} cityName={cityName} />
                </section>

                {/* Aggressive Monetization Hook: Exclusive City Sponsorship */}
                <section className="mt-16">
                    <CitySponsorshipCTA
                        cityName={cityName}
                        regionName={regionName}
                        pricePerMonth={dynamicPrice}
                    />
                </section>

                {/* 💰 RTB AD SLOT (10X Directive) */}
                <AdSlot placement="city-directory-bottom" geoKey={regionName} pageType="directory" format="banner" />

                {/* Internal Linking Geo Mesh — SEO Authority Stack */}
                <div className="mt-16 pt-10 border-t border-slate-900 space-y-8">
                    <div>
                        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-4">Pilot Car Resources</div>
                        <HubLinks />
                    </div>
                    <NearbyCities currentCity={cityName} state={regionName} />
                    {CITY_BY_SLUG[params.city]?.ruralSatellites && (
                        <RuralSatellites
                            satellites={CITY_BY_SLUG[params.city]!.ruralSatellites!}
                            state={regionName}
                            country={params.country as 'us' | 'ca'}
                        />
                    )}
                    <AuthorityLinks type="directory" />
                </div>
                <footer className="mt-10 pt-6 border-t border-slate-900 text-center">
                    <div className="text-[10px] text-slate-600 uppercase tracking-[0.2em]">
                        Pilot Car Coverage Network • {cityName}, {regionName} • Haul Command
                    </div>
                </footer>
            </div>
        </div>
    );
}
