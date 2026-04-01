// CRITICAL FIX: This page was timing out during static generation while querying
// 50,000+ hc_places rows from Supabase. With 1.56M+ entities, static gen is
// architecturally impossible here. This page MUST be dynamic.
// DO NOT add generateStaticParams() to this route or its subdirectories.
// DO NOT remove the dynamic export or revert to revalidate = 3600.
export const dynamic = 'force-dynamic'
export const revalidate = 0

import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { supabaseServer } from "@/lib/supabase-server";
import {
    countryName,
    categoryLabel,
    categoryIcon,
    ALL_COUNTRY_CODES,
    COUNTRY_NAMES,
    CATEGORY_LABELS,
    normalizeCategory,
} from "@/lib/directory-helpers";
import { getCountriesByTier } from "@/lib/seo-countries";
import DirectorySearchForm from "@/components/hc/DirectorySearchForm";


export const metadata: Metadata = {
    title: "Global Operator Directory — Pilot Cars, Escorts, Brokers | Haul Command",
    description:
        "Browse verified pilot car operators, escort vehicles, freight brokers, and heavy haul professionals across 120 countries. Search by location, service type, or capability.",
};

type Agg = { key: string; count: number };

// Tiers from central config
const TIER_A = getCountriesByTier('A').map(c => c.code.toLowerCase());
const TIER_B = getCountriesByTier('B').map(c => c.code.toLowerCase());
const TIER_C = getCountriesByTier('C').map(c => c.code.toLowerCase());
const TIER_D = getCountriesByTier('D').map(c => c.code.toLowerCase());
const TIER_E = getCountriesByTier('E').map(c => c.code.toLowerCase());

export default async function DirectoryPage() {
    const sb = supabaseServer();

    // Canonical source: hc_global_operators
    let rows: any[] = [];
    
    try {
        const lr = await sb.from("hc_global_operators").select("country_code, entity_type").limit(50000);
        rows = lr.data ?? [];
    } catch { /* table may not exist yet */ }

    // Aggregate
    const countryCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();

    for (const r of rows) {
        const cc = (r.country_code ?? "").toLowerCase();
        const cat = r.entity_type ? normalizeCategory(r.entity_type) : "";
        if (cc) countryCounts.set(cc, (countryCounts.get(cc) ?? 0) + 1);
        if (cat) categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
    }

    const totalListings = rows.length;
    const totalCountries = countryCounts.size || Object.keys(COUNTRY_NAMES).length;
    const totalCategories = categoryCounts.size || Object.keys(CATEGORY_LABELS).length;

    // Sort countries: Tier A first, then countries with data, then alphabetical
    const countriesWithData: Agg[] = Array.from(countryCounts.entries())
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => {
            const aIdx = TIER_A.indexOf(a.key);
            const bIdx = TIER_A.indexOf(b.key);
            if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
            if (aIdx >= 0) return -1;
            if (bIdx >= 0) return 1;
            return b.count - a.count;
        });

    const countriesWithoutData = ALL_COUNTRY_CODES
        .filter((c) => !countryCounts.has(c))
        .sort((a, b) => {
            const aIdx = TIER_A.indexOf(a);
            const bIdx = TIER_A.indexOf(b);
            if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
            if (aIdx >= 0) return -1;
            if (bIdx >= 0) return 1;
            const aTier = TIER_A.indexOf(a) >= 0 ? 0 : (TIER_B.indexOf(a) >= 0 ? 1 : (TIER_C.indexOf(a) >= 0 ? 2 : (TIER_D.indexOf(a) >= 0 ? 3 : 4)));
            const bTier = TIER_A.indexOf(b) >= 0 ? 0 : (TIER_B.indexOf(b) >= 0 ? 1 : (TIER_C.indexOf(b) >= 0 ? 2 : (TIER_D.indexOf(b) >= 0 ? 3 : 4)));
            if (aTier !== bTier) return aTier - bTier;
            return (COUNTRY_NAMES[a] ?? a).localeCompare(COUNTRY_NAMES[b] ?? b);
        })
        .map((key) => ({ key, count: 0 }));

    const allCountries = [...countriesWithData, ...countriesWithoutData];

    // Categories: if no data, show core categories from taxonomy
    const categories: Agg[] = categoryCounts.size > 0
        ? Array.from(categoryCounts.entries())
            .map(([key, count]) => ({ key, count }))
            .sort((a, b) => b.count - a.count)
        : [
            { key: 'pilot_car_operator', count: 0 },
            { key: 'freight_broker', count: 0 },
            { key: 'steerman', count: 0 },
            { key: 'high_pole', count: 0 },
            { key: 'route_survey', count: 0 },
            { key: 'heavy_towing', count: 0 },
            { key: 'twic_cleared_operator', count: 0 },
            { key: 'dod_cleared_escort', count: 0 },
            { key: 'permit_services', count: 0 },
          ];

    // Market status label
    const getMarketLabel = (count: number, countryCode: string) => {
        if (count > 0) return `${count.toLocaleString()} operators`;
        if (TIER_A.includes(countryCode)) return 'Priority market';
        if (TIER_B.includes(countryCode)) return 'Expanding';
        if (TIER_C.includes(countryCode) || TIER_D.includes(countryCode)) return 'Mapped';
        if (TIER_E.includes(countryCode)) return 'Pending Expansion';
        return 'Mapped';
    };

    return (
        <>
            <Navbar />
            <main className="flex-grow">
                {/* Hero */}
                <section className="relative py-24 sm:py-32 px-4 overflow-hidden border-b border-white/5 bg-[#05080f]">
                    {/* Background Image Setup */}
                    <div 
                        className="absolute inset-0 z-0 opacity-40 mix-blend-screen bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: 'url(/ads/directory_hero.png)' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-[#05080f] z-0" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent,black_80%)] z-0" />

                    <div className="max-w-7xl mx-auto relative z-10 text-center">
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter mb-4 sm:mb-6 leading-[0.9] drop-shadow-2xl">
                            Global <span className="text-accent">Directory</span>
                        </h1>
                        <p className="text-gray-300 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 drop-shadow-md">
                            Search verified pilot car operators, escort vehicles, and heavy haul professionals across 120 countries.
                        </p>

                        {/* Stats — only show meaningful numbers, never zeros */}
                        <div className="flex flex-wrap justify-center gap-8 mb-10">
                            {totalListings > 0 && (
                                <div className="text-center">
                                    <div className="text-3xl md:text-4xl font-black text-accent">{totalListings.toLocaleString()}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Operators</div>
                                </div>
                            )}
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl font-black text-accent">{totalCountries}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Countries</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl font-black text-accent">{totalCategories}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Service Types</div>
                            </div>
                        </div>

                        {/* Voice Search Form */}
                        <div className="mt-8 z-20">
                            <DirectorySearchForm />
                        </div>
                    </div>
                </section>

                {/* Categories */}
                <section className="py-16 px-4 bg-black/30">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-2xl font-bold text-white mb-8">Browse by Service Type</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categories.map((c) => (
                                <Link
                                    key={c.key}
                                    href={`/roles/${c.key.replace(/_/g, '-')}`}
                                    className="group bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-accent/30 hover:bg-accent/[0.03] transition-all"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">{categoryIcon(c.key)}</span>
                                        <span className="text-white font-semibold group-hover:text-accent transition-colors">
                                            {categoryLabel(c.key)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {c.count > 0 ? `${c.count.toLocaleString()} operators` : 'Browse →'}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Countries */}
                <section className="py-16 px-4">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-2xl font-bold text-white mb-2">Browse by Country</h2>
                        <p className="text-gray-500 text-sm mb-8">Operator directory coverage across 120 countries. Tier A markets shown first.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {allCountries.map((c) => {
                                const isTierA = TIER_A.includes(c.key);
                                const isTierB = TIER_B.includes(c.key);
                                const isTierC = TIER_C.includes(c.key);
                                return (
                                <Link
                                    key={c.key}
                                    href={`/directory/${c.key}`}
                                    className={`group rounded-xl px-4 py-3 border transition-all ${
                                        isTierA
                                            ? "bg-accent/[0.06] border-accent/20 hover:border-accent/40 hover:bg-accent/[0.1]"
                                            : c.count > 0
                                            ? "bg-white/[0.03] border-white/[0.08] hover:border-accent/30 hover:bg-accent/[0.03]"
                                            : isTierB
                                            ? "bg-blue-500/[0.03] border-blue-500/[0.1] hover:border-blue-500/30 opacity-80 hover:opacity-100"
                                            : "bg-white/[0.01] border-white/[0.03] hover:border-white/10 opacity-60 hover:opacity-80"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-white text-sm group-hover:text-accent transition-colors">
                                            {countryName(c.key)}
                                        </span>
                                        {isTierA && <span className="text-[8px] font-black text-accent/60 uppercase">Gold</span>}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {getMarketLabel(c.count, c.key)}
                                    </div>
                                </Link>
                            );
                            })}
                        </div>
                    </div>
                </section>

                {/* FAQ Schema */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "FAQPage",
                            mainEntity: [
                                {
                                    "@type": "Question",
                                    name: "What is the Haul Command Directory?",
                                    acceptedAnswer: {
                                        "@type": "Answer",
                                        text: "The Haul Command Directory is the world's largest heavy haul logistics directory, with verified listings for pilot car operators, escort vehicles, freight brokers, and support services across 120 countries.",
                                    },
                                },
                                {
                                    "@type": "Question",
                                    name: "How many countries does the directory cover?",
                                    acceptedAnswer: {
                                        "@type": "Answer",
                                        text: "The directory covers 120 countries globally including the United States, Canada, Australia, United Kingdom, Germany, UAE, Brazil, and 113 other nations with heavy haul logistics infrastructure.",
                                    },
                                },
                            ],
                        }),
                    }}
                />
            </main>
        </>
    );
}
