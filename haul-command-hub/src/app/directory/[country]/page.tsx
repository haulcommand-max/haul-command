import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { supabaseServer } from "@/lib/supabase-server";
import { countryName, categoryLabel, categoryIcon, ALL_COUNTRY_CODES } from "@/lib/directory-helpers";

export const revalidate = 900;

const PAGE_SIZE = 30;

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
    const { country } = await params;
    const name = countryName(country);
    return {
        title:`${name} Heavy Haul Directory & Pilot Cars |`,
        description: `Browse ${name}'s heavy haul logistics infrastructure. Find pilot cars, escort vehicles, ports, and weigh stations for oversize loads.`,
        keywords: [`${name} pilot cars`, `${name} heavy haul directory`, `oversize load escorts in ${name}`, `heavy haul logistics ${name}`],
        openGraph: {
            title:`${name} Heavy Haul Directory |`,
            description: `The complete directory of pilot cars and heavy haul services in ${name}.`,
            url: `https://haulcommand.com/directory/${country.toLowerCase()}`,
            siteName: 'Haul Command',
            type: 'website',
        },
    };
}

export async function generateStaticParams() {
    return ALL_COUNTRY_CODES.map((country) => ({ country }));
}

export default async function DirectoryCountryPage({
    params,
    searchParams,
}: {
    params: Promise<{ country: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { country } = await params;
    const sp = await searchParams;
    const sb = supabaseServer();
    const cc = country.toLowerCase();
    const name = countryName(cc);

    const rawPage = Array.isArray(sp.page) ? sp.page[0] : sp.page;
    const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Category facets
    let facetQuery = sb
        .from("directory_listings")
        .select("entity_type")
        .eq("is_visible", true);
    if (cc !== 'all') facetQuery = facetQuery.eq("country_code", cc);
    const { data: facetRows } = await facetQuery;

    const facets = new Map<string, number>();
    for (const r of facetRows ?? []) {
        const cat = r.entity_type;
        if (cat) facets.set(cat, (facets.get(cat) ?? 0) + 1);
    }
    const facetList = Array.from(facets.entries()).sort((a, b) => b[1] - a[1]);

    // Paginated listings
    let listQuery = sb
        .from("directory_listings")
        .select("id, slug, name, entity_type, city, region_code, updated_at", {
            count: "exact",
        })
        .eq("is_visible", true);
    if (cc !== 'all') listQuery = listQuery.eq("country_code", cc);

    const { data: rows, count } = await listQuery
        .order("updated_at", { ascending: false })
        .range(from, to);

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // Structured JSON-LD Data for Heavy Haul Directory
    const jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `${name} Heavy Haul & Pilot Car Directory`,
        description: `Search ${name}'s verified listing of pilot cars, escort vehicles, truck stops, and heavy haul infrastructure.`,
        url: `https://haulcommand.com/directory/${cc}`,
        publisher: {
            '@type': 'Organization',
            name: 'Haul Command',
            logo: {
                '@type': 'ImageObject',
                url: 'https://haulcommand.com/logo-full.png'
            }
        },
        mainEntity: {
            '@type': 'Service',
            name: `Heavy Haul Logistics in ${name}`,
            serviceOutput: 'Pilot Car, Escort Vehicle, Port, Weigh Station',
            provider: {
                '@type': 'Organization',
                name: 'Haul Command Directory'
            }
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
            />
            <Navbar />
            <main className="flex-grow">
                {/* Header */}
                <section className="py-16 px-4 border-b border-white/5">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <Link href="/directory" className="hover:text-accent transition-colors">Directory</Link>
                            <span>/</span>
                            <span className="text-white">{name}</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
                            {name} Heavy Haul Logistics
                        </h1>
                        <p className="text-gray-400 text-lg">
                            {total > 0
                                ? `${total.toLocaleString()} verified operator${total !== 1 ? "s" : ""} across ${facetList.length} service types`
                                : `${name} is part of the Haul Command 120-country logistics network. Directory seeding in progress.`}
                        </p>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto px-4 py-12 lg:flex gap-12">
                    {/* Sidebar: Categories */}
                    <aside className="lg:w-72 flex-shrink-0 mb-10 lg:mb-0">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Categories</h2>
                        {facetList.length > 0 ? (
                            <nav className="space-y-1">
                                {facetList.map(([cat, n]) => (
                                    <Link
                                        key={cat}
                                        href={`/directory/${cc}/${encodeURIComponent(cat)}`}
                                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className="text-base">{categoryIcon(cat)}</span>
                                            <span className="text-sm text-gray-300 group-hover:text-accent transition-colors">
                                                {categoryLabel(cat)}
                                            </span>
                                        </span>
                                        <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{n}</span>
                                    </Link>
                                ))}
                            </nav>
                        ) : (
                            <p className="text-sm text-gray-600">No categories yet. Coverage is expanding.</p>
                        )}
                    </aside>

                    {/* Main: Listings */}
                    <section className="flex-grow min-w-0">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                            {total > 0 ? "Listings" : "No Listings Yet"}
                        </h2>

                        {total === 0 ? (
                            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-12 text-center">
                                <div className="text-4xl mb-4">🌍</div>
                                <h3 className="text-xl font-bold text-white mb-2">Directory Seeding</h3>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    {name} is part of the Haul Command 120-country logistics network. Operator profiles are being verified and will appear here as the market activates.
                                </p>
                                <Link href="/claim" className="inline-block mt-6 bg-accent text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors">
                                    Claim Your Profile in {name} →
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {(rows ?? []).map((p) => (
                                        <Link
                                            key={p.id}
                                            href={`/place/${p.slug}`}
                                            className="block bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-accent/20 hover:bg-accent/[0.02] transition-all group"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <h3 className="text-white font-semibold group-hover:text-accent transition-colors truncate">
                                                        {p.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                                        <span>{categoryIcon(p.entity_type)}</span>
                                                        <span>{categoryLabel(p.entity_type)}</span>
                                                        {p.city && (
                                                            <>
                                                                <span>·</span>
                                                                <span>{[p.city, p.region_code].filter(Boolean).join(", ")}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-gray-600 group-hover:text-accent transition-colors text-xl flex-shrink-0">
                                                    →
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <nav className="flex items-center justify-center gap-4 mt-10">
                                        {page > 1 && (
                                            <Link
                                                href={`/directory/${cc}?page=${page - 1}`}
                                                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-accent hover:border-accent/30 transition-all"
                                            >
                                                ← Previous
                                            </Link>
                                        )}
                                        <span className="text-sm text-gray-500">
                                            Page {page} of {totalPages}
                                        </span>
                                        {page < totalPages && (
                                            <Link
                                                href={`/directory/${cc}?page=${page + 1}`}
                                                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-accent hover:border-accent/30 transition-all"
                                            >
                                                Next →
                                            </Link>
                                        )}
                                    </nav>
                                )}
                            </>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}
