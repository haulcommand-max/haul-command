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

export const revalidate = 3600;

export const metadata: Metadata = {
    title: "Global Heavy Haul Directory — Ports, Truck Stops, Industrial Zones",
    description:
        "Browse the world's largest heavy haul logistics directory. 1,300+ verified listings across 52 countries — ports, truck stops, weigh stations, industrial zones, and more.",
};

type Agg = { key: string; count: number };

export default async function DirectoryPage() {
    const sb = supabaseServer();

    // Pull all published rows (lightweight select)
    const { data: rows } = await sb
        .from("hc_places")
        .select("country_code, surface_category_key")
        .eq("status", "published")
        .eq("is_search_indexable", true)
        .limit(50000);

    // Aggregate
    const countryCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();

    for (const r of rows ?? []) {
        const cc = (r.country_code ?? "").toLowerCase();
        const cat = r.surface_category_key ?? "";
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
                <section className="relative py-20 px-4 overflow-hidden border-b border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
                    <div className="max-w-7xl mx-auto relative z-10 text-center">
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 leading-[0.9]">
                            Global <span className="text-accent">Directory</span>
                        </h1>
                        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
                            The world&apos;s largest heavy haul logistics directory. Browse ports, truck stops, industrial zones, and
                            more across 52 countries.
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

                        {/* Search teaser */}
                        <div className="max-w-xl mx-auto">
                            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-3">
                                <span className="text-gray-500 text-xl">🔍</span>
                                <span className="text-gray-500 text-sm">Search coming soon — browse by country or category below</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Categories */}
                <section className="py-16 px-4 bg-black/30">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-2xl font-bold text-white mb-8">Browse by Category</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                        text: "The Haul Command Directory is the world's largest heavy haul logistics directory, with verified listings for ports, truck stops, weigh stations, industrial zones, and more across 52 countries.",
                                    },
                                },
                                {
                                    "@type": "Question",
                                    name: "How many countries does the directory cover?",
                                    acceptedAnswer: {
                                        "@type": "Answer",
                                        text: "The directory covers 52 countries globally including the United States, Canada, Australia, United Kingdom, and 48 other nations with heavy haul logistics infrastructure.",
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
