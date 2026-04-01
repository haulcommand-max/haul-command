import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import { supabaseServer } from "@/lib/supabase-server";
import { countryName, categoryLabel, categoryIcon, ALL_COUNTRY_CODES, normalizeCategory } from "@/lib/directory-helpers";
import { getCountryBySlug } from "@/lib/seo-countries";

export const revalidate = 900;

const PAGE_SIZE = 30;

const BASE_URL = 'https://haulcommand.com';

// ─── Ecosystem categories beyond just operators ───
const ECOSYSTEM_LINKS = [
    { href: '/roles/pilot-car-operator', icon: '🚗', label: 'Pilot Car / Escort Operators' },
    { href: '/roles/freight-broker', icon: '📋', label: 'Freight Brokers' },
    { href: '/roles/route-survey', icon: '🗺️', label: 'Route Surveyors' },
    { href: '/roles/steerman', icon: '🕹️', label: 'Steermen & Rear Steer' },
    { href: '/roles/high-pole', icon: '📐', label: 'High Pole Escorts' },
    { href: '/roles/heavy-towing', icon: '🏗️', label: 'Heavy Towing & Rotators' },
    { href: '/roles/permit-services', icon: '📄', label: 'Permit Services' },
];

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
    const { country } = await params;
    const name = countryName(country);
    const cc = getCountryBySlug(country);
    const localTerm = cc?.terms?.pilot_car ?? 'Pilot Car';
    const escortTerm = cc?.terms?.escort_vehicle ?? 'Escort Vehicle';

    return {
        title: `${localTerm} & ${escortTerm} Operators in ${name} | Haul Command`,
        description: `Find verified ${localTerm.toLowerCase()} operators, ${escortTerm.toLowerCase()} services, and heavy haul logistics professionals in ${name}. Browse by region, compare services, and claim your listing on the Haul Command 120-country network.`,
        keywords: [
            `${name} pilot car`, `${name} escort vehicle`, `${name} heavy haul directory`,
            `oversize load escorts ${name}`, `${localTerm.toLowerCase()} ${name}`,
        ],
        openGraph: {
            title: `${localTerm} & ${escortTerm} Directory — ${name} | Haul Command`,
            description: `The ${name} directory of pilot car operators, escort vehicles, and heavy haul logistics infrastructure on Haul Command.`,
            url: `${BASE_URL}/directory/${country.toLowerCase()}`,
            siteName: 'Haul Command',
            type: 'website',
        },
        alternates: {
            canonical: `${BASE_URL}/directory/${country.toLowerCase()}`,
        },
    };
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
    const countryConfig = getCountryBySlug(cc);

    const rawPage = Array.isArray(sp.page) ? sp.page[0] : sp.page;
    const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Local terminology
    const localPilotCar = countryConfig?.terms?.pilot_car ?? 'Pilot Car';
    const localEscort = countryConfig?.terms?.escort_vehicle ?? 'Escort Vehicle';
    const localOversize = countryConfig?.terms?.oversize_load ?? 'Oversize Load';
    const tierLabel = countryConfig ? { A: 'Gold', B: 'Blue', C: 'Silver', D: 'Slate', E: 'Copper' }[countryConfig.tier] ?? '' : '';
    const regions = countryConfig?.regions ?? [];

    // Category facets
    let facetQuery = sb.from("hc_global_operators").select("entity_type");
    if (cc !== 'all') facetQuery = facetQuery.eq("country_code", country.toUpperCase());
    const { data: facetRows } = await facetQuery;

    const facets = new Map<string, number>();
    for (const r of facetRows ?? []) {
        const cat = normalizeCategory(r.entity_type);
        if (cat) facets.set(cat, (facets.get(cat) ?? 0) + 1);
    }
    const facetList = Array.from(facets.entries()).sort((a, b) => b[1] - a[1]);

    // Paginated listings
    let listQuery = sb
        .from("hc_global_operators")
        .select("id, slug, name, entity_type, locality:city, admin1_code:admin1_code, updated_at, surface_category_key:entity_type", {
            count: "exact",
        });
    if (cc !== 'all') listQuery = listQuery.eq("country_code", country.toUpperCase());

    const { data: rawRows, count } = await listQuery
        .order("updated_at", { ascending: false })
        .range(from, to);

    const rows = rawRows as any[];
    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // Coverage status
    const coverageStatus = total > 0
        ? 'active'
        : (countryConfig?.tier === 'A' || countryConfig?.tier === 'B') ? 'verifying' : 'expanding';

    const coverageLabels = {
        active: `${total.toLocaleString()} verified listing${total !== 1 ? 's' : ''} across ${facetList.length} service categories`,
        verifying: `${name} is a priority market. Operator listings are being verified and will go live soon.`,
        expanding: `${name} is part of the Haul Command 120-country network. Coverage data is being collected.`,
    };

    // ─── Structured Data ───
    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Directory', item: `${BASE_URL}/directory` },
            { '@type': 'ListItem', position: 2, name: name, item: `${BASE_URL}/directory/${cc}` },
        ],
    };

    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: `What is a ${localPilotCar.toLowerCase()} in ${name}?`,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: `A ${localPilotCar.toLowerCase()} (also called ${localEscort.toLowerCase()}) is a vehicle that travels ahead of or behind an ${localOversize.toLowerCase()} to warn other road users and ensure safe passage. In ${name}, these operators are typically required by law when cargo exceeds standard width, height, length, or weight limits.`,
                },
            },
            {
                '@type': 'Question',
                name: `When do you need a ${localEscort.toLowerCase()} in ${name}?`,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: `${localEscort} services are required in ${name} when a load exceeds the legal dimension or weight limits for standard highway travel. Specific thresholds vary by region—check the Haul Command escort rules tool for ${name}-specific requirements.`,
                },
            },
            {
                '@type': 'Question',
                name: `How do I find a ${localPilotCar.toLowerCase()} operator in ${name}?`,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: `Use the Haul Command directory to search by region, category, or service type within ${name}. You can also claim your business profile to appear in search results and receive inbound broker leads.`,
                },
            },
        ],
    };

    const webPageSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `${localPilotCar} & ${localEscort} Directory — ${name}`,
        description: `Search ${name}'s verified listing of ${localPilotCar.toLowerCase()} operators, ${localEscort.toLowerCase()} services, and heavy haul infrastructure.`,
        url: `${BASE_URL}/directory/${cc}`,
        publisher: {
            '@type': 'Organization',
            name: 'Haul Command',
            logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo-full.png` },
        },
        breadcrumb: breadcrumbSchema,
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            <Navbar />
            <main className="flex-grow">
                {/* ─── Header ─── */}
                <section className="py-16 px-4 border-b border-white/5">
                    <div className="max-w-7xl mx-auto">
                        {/* Breadcrumbs */}
                        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
                            <Link href="/directory" className="hover:text-accent transition-colors">Directory</Link>
                            <span>/</span>
                            <span className="text-white">{name}</span>
                            {tierLabel && (
                                <span className="ml-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                                    {tierLabel} Market
                                </span>
                            )}
                        </nav>

                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
                            {name} {localPilotCar} &amp; {localEscort} Directory
                        </h1>
                        <p className="text-gray-400 text-lg max-w-3xl">
                            {coverageLabels[coverageStatus]}
                        </p>

                        {/* ─── Answer-First Snippet Block ─── */}
                        <div className="mt-8 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 max-w-3xl">
                            <h2 className="text-sm font-bold text-accent uppercase tracking-widest mb-3">
                                What is a {localPilotCar} / {localEscort}?
                            </h2>
                            <p className="text-sm text-gray-400 leading-relaxed mb-4">
                                A <strong className="text-white">{localPilotCar.toLowerCase()}</strong> (also known as{' '}
                                <strong className="text-white">{localEscort.toLowerCase()}</strong>) is a vehicle that escorts{' '}
                                {localOversize.toLowerCase()} shipments on public roads in {name}.
                                These operators warn traffic, communicate with the hauler, and ensure the load clears bridges,
                                utility lines, and narrow corridors safely.
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs">
                                <Link href={`/tools/escort-rules/${cc}`} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:text-accent hover:border-accent/30 transition-all">
                                    📋 {name} Escort Rules
                                </Link>
                                <Link href={`/tools/rate-estimator/${cc}`} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:text-accent hover:border-accent/30 transition-all">
                                    💰 Rate Estimator
                                </Link>
                                <Link href={`/tools/permit-checker/${cc}`} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:text-accent hover:border-accent/30 transition-all">
                                    📄 Permit Checker
                                </Link>
                                {countryConfig && (
                                    <Link href={`/glossary/${cc}/${localPilotCar.toLowerCase().replace(/\s+/g, '-')}`} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:text-accent hover:border-accent/30 transition-all">
                                        📖 {localPilotCar} — Glossary
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto px-4 py-12 lg:flex gap-12">
                    {/* ─── Sidebar ─── */}
                    <aside className="lg:w-72 flex-shrink-0 mb-10 lg:mb-0 space-y-8">
                        {/* Categories */}
                        <div>
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
                                            <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full" title="Discovered entities being verified">
                                                {n}
                                            </span>
                                        </Link>
                                    ))}
                                </nav>
                            ) : (
                                <p className="text-sm text-gray-600">No categories yet. Coverage is expanding.</p>
                            )}
                        </div>

                        {/* Browse by Region */}
                        {regions.length > 0 && (
                            <div>
                                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Browse by Region</h2>
                                <nav className="space-y-1">
                                    {regions.map((region) => (
                                        <Link
                                            key={region}
                                            href={`/directory/${cc}/${region.toLowerCase().replace(/\s+/g, '-')}`}
                                            className="block px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-accent transition-colors"
                                        >
                                            {region}
                                        </Link>
                                    ))}
                                </nav>
                            </div>
                        )}

                        {/* Ecosystem Services */}
                        <div>
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Ecosystem</h2>
                            <nav className="space-y-1">
                                {ECOSYSTEM_LINKS.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-accent transition-colors"
                                    >
                                        <span>{link.icon}</span>
                                        <span>{link.label}</span>
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Links</h2>
                            <nav className="space-y-1 text-sm">
                                <Link href={`/requirements/${cc}`} className="block px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-accent transition-colors">📋 Requirements</Link>
                                <Link href={`/rates/${cc}`} className="block px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-accent transition-colors">💰 Rates</Link>
                                <Link href={`/corridors`} className="block px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-accent transition-colors">🛤️ Corridors</Link>
                                <Link href="/glossary" className="block px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-accent transition-colors">📖 Glossary</Link>
                            </nav>
                        </div>
                    </aside>

                    {/* ─── Main Content ─── */}
                    <section className="flex-grow min-w-0">
                        {/* ─── Three-Lane CTA Block (always visible) ─── */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
                            <Link
                                href="/claim"
                                className="bg-accent/[0.06] border border-accent/20 rounded-xl p-5 hover:border-accent/40 transition-all group text-center"
                            >
                                <div className="text-2xl mb-2">✅</div>
                                <h3 className="text-sm font-bold text-white mb-1 group-hover:text-accent transition-colors">Claim Your Listing</h3>
                                <p className="text-xs text-gray-500">Secure verification, ranking priority, and inbound broker leads.</p>
                            </Link>
                            <Link
                                href="/contact?intent=broker"
                                className="bg-blue-500/[0.04] border border-blue-500/15 rounded-xl p-5 hover:border-blue-500/30 transition-all group text-center"
                            >
                                <div className="text-2xl mb-2">🤝</div>
                                <h3 className="text-sm font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">Need Coverage?</h3>
                                <p className="text-xs text-gray-500">Brokers: get notified when {name} operators go live.</p>
                            </Link>
                            <Link
                                href="/advertise/create"
                                className="bg-purple-500/[0.04] border border-purple-500/15 rounded-xl p-5 hover:border-purple-500/30 transition-all group text-center"
                            >
                                <div className="text-2xl mb-2">📣</div>
                                <h3 className="text-sm font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">Sponsor This Market</h3>
                                <p className="text-xs text-gray-500">Secure exclusive placement on {name}&apos;s directory page.</p>
                            </Link>
                        </div>

                        {/* ─── Coverage Status ─── */}
                        {coverageStatus !== 'active' && (
                            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 mb-8">
                                <div className="flex items-start gap-4">
                                    <div className="text-3xl flex-shrink-0">{coverageStatus === 'verifying' ? '🔍' : '🌍'}</div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-2">
                                            {coverageStatus === 'verifying' ? 'Verification in Progress' : `${name} Coverage Expanding`}
                                        </h3>
                                        <p className="text-sm text-gray-400 mb-4 max-w-lg">
                                            {coverageStatus === 'verifying'
                                                ? `${name} is a priority market in the Haul Command network. Operator profiles are being verified against commercial registries. Claim your listing now to be first when the market goes live.`
                                                : `${name} is part of the Haul Command 120-country network. We are currently mapping logistics infrastructure and verifying operator data. Join the waitlist to be notified when coverage launches.`
                                            }
                                        </p>
                                        <div className="flex flex-wrap gap-3">
                                            <Link
                                                href="/claim"
                                                className="px-5 py-2.5 bg-accent text-black font-bold text-sm rounded-xl hover:bg-yellow-400 transition-colors"
                                            >
                                                Claim Your Listing
                                            </Link>
                                            <Link
                                                href={`/tools/escort-rules/${cc}`}
                                                className="px-5 py-2.5 bg-white/5 border border-white/10 text-sm text-gray-300 rounded-xl hover:text-white hover:border-white/20 transition-all"
                                            >
                                                View {name} Rules
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── Listings ─── */}
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                            {total > 0 ? `Listings` : 'Listings'}
                        </h2>

                        {total > 0 ? (
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
                                                        <span>{categoryIcon(normalizeCategory(p.surface_category_key))}</span>
                                                        <span>{categoryLabel(normalizeCategory(p.surface_category_key))}</span>
                                                        {p.locality && (
                                                            <>
                                                                <span>·</span>
                                                                <span>{[p.locality, p.admin1_code].filter(Boolean).join(", ")}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-gray-600 group-hover:text-accent transition-colors text-xl flex-shrink-0">→</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <nav className="flex items-center justify-center gap-4 mt-10">
                                        {page > 1 && (
                                            <Link href={`/directory/${cc}?page=${page - 1}`} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-accent hover:border-accent/30 transition-all">
                                                ← Previous
                                            </Link>
                                        )}
                                        <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                                        {page < totalPages && (
                                            <Link href={`/directory/${cc}?page=${page + 1}`} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:text-accent hover:border-accent/30 transition-all">
                                                Next →
                                            </Link>
                                        )}
                                    </nav>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-gray-600 mb-6">
                                No verified listings are live for {name} yet. Operator profiles are being sourced and verified.{' '}
                                <Link href="/claim" className="text-accent hover:underline">Claim your listing</Link> to appear first.
                            </p>
                        )}

                        {/* ─── FAQ Section ─── */}
                        <section className="mt-12 border-t border-white/5 pt-10">
                            <h2 className="text-lg font-bold text-white mb-6">Frequently Asked Questions</h2>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-white mb-2">
                                        What is a {localPilotCar.toLowerCase()} in {name}?
                                    </h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        A {localPilotCar.toLowerCase()} (also called {localEscort.toLowerCase()}) is a vehicle that travels ahead of or behind an {localOversize.toLowerCase()} to warn other road users and ensure safe passage. In {name}, these operators are typically required by law when cargo exceeds standard dimension or weight limits.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white mb-2">
                                        When do you need a {localEscort.toLowerCase()} in {name}?
                                    </h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        Escort services are required when a load exceeds the legal dimension or weight limits for standard highway travel in {name}. Specific thresholds vary by region—use the{' '}
                                        <Link href={`/tools/escort-rules/${cc}`} className="text-accent hover:underline">Haul Command escort rules tool</Link>{' '}
                                        for {name}-specific requirements.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white mb-2">
                                        How do I find a {localPilotCar.toLowerCase()} operator in {name}?
                                    </h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        Use the Haul Command directory to search by region, category, or service type within {name}. You can also{' '}
                                        <Link href="/claim" className="text-accent hover:underline">claim your business profile</Link>{' '}
                                        to appear in search results and receive inbound broker leads.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </section>
                </div>
            </main>
        </>
    );
}
