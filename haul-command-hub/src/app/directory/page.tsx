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
} from "@/lib/directory-helpers";
import DirectorySearchForm from "@/components/hc/DirectorySearchForm";


export const metadata: Metadata = {
    title: "Global Heavy Haul Directory — Ports, Truck Stops, Industrial Zones",
    description:
        "Browse the world's largest heavy haul logistics directory — pilot cars, brokers, ports, truck stops, and more across the US, Canada, and growing.",
};

type Agg = { key: string; count: number };

export default async function DirectoryPage() {
    const sb = supabaseServer();

    // Pull all visible rows from unified directory
    const { data: rows } = await sb
        .from("directory_listings")
        .select("country_code, entity_type")
        .eq("is_visible", true)
        .limit(50000);

    // Aggregate
    const countryCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();

    for (const r of rows ?? []) {
        const cc = (r.country_code ?? "").toLowerCase();
        const cat = r.entity_type ?? "";
        if (cc) countryCounts.set(cc, (countryCounts.get(cc) ?? 0) + 1);
        if (cat) categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
    }

    const totalListings = rows?.length ?? 0;
    const totalCountries = countryCounts.size;
    const totalCategories = categoryCounts.size;

    // Sort countries: those with data first (by count desc), then empty ones alphabetically
    const countriesWithData: Agg[] = Array.from(countryCounts.entries())
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count);

    const countriesWithoutData = ALL_COUNTRY_CODES
        .filter((c) => !countryCounts.has(c))
        .sort((a, b) => (COUNTRY_NAMES[a] ?? a).localeCompare(COUNTRY_NAMES[b] ?? b))
        .map((key) => ({ key, count: 0 }));

    const allCountries = [...countriesWithData, ...countriesWithoutData];

    const categories: Agg[] = Array.from(categoryCounts.entries())
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count);

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
                            The world&apos;s largest heavy haul logistics directory. Browse pilot cars, brokers, ports, and
                            more across the US, Canada, and growing.
                        </p>

                        {/* Stats */}
                        <div className="flex flex-wrap justify-center gap-8 mb-10">
                            {[
                                { label: "Listings", value: totalListings.toLocaleString() },
                                { label: "Countries", value: String(totalCountries) },
                                { label: "Categories", value: String(totalCategories) },
                            ].map((s) => (
                                <div key={s.label} className="text-center">
                                    <div className="text-3xl md:text-4xl font-black text-accent">{s.value}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">{s.label}</div>
                                </div>
                            ))}
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
                        <h2 className="text-2xl font-bold text-white mb-8">Browse by Category</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Ensure Pilot Car Operators and Brokers appear even if not yet in hc_places */}
                            {!categories.some(c => c.key === 'escort_staging') && (
                                <Link
                                    href="/directory/all/escort_staging"
                                    className="group bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 hover:border-accent/40 hover:bg-accent/[0.05] transition-all"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">🚗</span>
                                        <span className="text-white font-semibold group-hover:text-accent transition-colors">Pilot Car Operators</span>
                                    </div>
                                    <div className="text-sm text-amber-400/70">Browse all →</div>
                                </Link>
                            )}
                            {!categories.some(c => c.key === 'freight_broker') && (
                                <Link
                                    href="/broker"
                                    className="group bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 hover:border-accent/40 hover:bg-accent/[0.05] transition-all"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">📋</span>
                                        <span className="text-white font-semibold group-hover:text-accent transition-colors">Freight Brokers</span>
                                    </div>
                                    <div className="text-sm text-amber-400/70">Browse all →</div>
                                </Link>
                            )}
                            {categories.map((c) => (
                                <Link
                                    key={c.key}
                                    href={`/directory/all/${encodeURIComponent(c.key)}`}
                                    className="group bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-accent/30 hover:bg-accent/[0.03] transition-all"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">{categoryIcon(c.key)}</span>
                                        <span className="text-white font-semibold group-hover:text-accent transition-colors">
                                            {categoryLabel(c.key)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {c.count.toLocaleString()} listing{c.count !== 1 ? "s" : ""}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Countries */}
                <section className="py-16 px-4">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-2xl font-bold text-white mb-8">Browse by Country</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {allCountries.map((c) => (
                                <Link
                                    key={c.key}
                                    href={`/directory/${c.key}`}
                                    className={`group rounded-xl px-4 py-3 border transition-all ${c.count > 0
                                        ? "bg-white/[0.03] border-white/[0.08] hover:border-accent/30 hover:bg-accent/[0.03]"
                                        : "bg-white/[0.01] border-white/[0.03] hover:border-white/10 opacity-60 hover:opacity-80"
                                        }`}
                                >
                                    <div className="font-semibold text-white text-sm group-hover:text-accent transition-colors">
                                        {countryName(c.key)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {c.count > 0 ? `${c.count.toLocaleString()} listings` : "Coming soon"}
                                    </div>
                                </Link>
                            ))}
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
                                        text: "The Haul Command Directory is the world's largest heavy haul logistics directory, with verified listings for ports, truck stops, weigh stations, industrial zones, and more across 120 countries.",
                                    },
                                },
                                {
                                    "@type": "Question",
                                    name: "How many countries does the directory cover?",
                                    acceptedAnswer: {
                                        "@type": "Answer",
                                        text: "The directory covers 120 countries globally including the United States, Canada, Australia, United Kingdom, and 48 other nations with heavy haul logistics infrastructure.",
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
