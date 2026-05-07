import React from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { LiveActivityFeed } from '@/components/feed/LiveActivityFeed';
import { HCAskStrip } from '@/components/hc-ask/HCAskStrip';
import { DirectoryGrid } from '@/components/directory/DirectoryGrid';

import { HCContentPageShell, HCContentSection } from "@/components/content-system/shell/HCContentPageShell";
import { getPageFamilyOgImage } from "@/components/ui/PageFamilyBackground";
import { Metadata } from 'next';
import { getTypesenseSearch, OPERATORS_COLLECTION } from '@/lib/typesense/client';
import {
    buildDirectoryFallbackFilterPlan,
    buildDirectoryLocationOrFilter,
    normalizeDirectoryCountry,
    resolveDirectoryCategoryFilter,
} from '@/lib/directory/server-query';
import { absoluteUrl, SITE_URL } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

const proofStates = [
    {
        label: 'Live marketplace',
        description: 'Providers, load demand, contact paths, and market signals are available for active discovery.',
    },
    {
        label: 'Claimable directory',
        description: 'Profiles or company records are listed and can be claimed or improved by the provider.',
    },
    {
        label: 'Source-backed market',
        description: 'Market data is seeded from approved public or operational sources and labeled by confidence.',
    },
    {
        label: 'Regulation intelligence live',
        description: 'Requirement, terminology, or permit intelligence is available even when provider density is still building.',
    },
    {
        label: 'Developing market',
        description: 'Coverage is being built and should not be treated as a complete live provider marketplace.',
    },
];

const roleCoverage = [
    'Pilot car operators',
    'Escort vehicle services',
    'High-pole escorts',
    'Route survey providers',
    'Permit support',
    'Traffic control',
    'Steer car support',
    'Mobile mechanics',
    'Staging yards',
    'Oversize-friendly parking',
    'Port and border support',
    'Heavy haul equipment support',
];

const userGroups = [
    {
        title: 'Brokers, carriers, and shippers',
        body: 'Search by role, location, service area, route need, and profile status so support options can be compared before a load stalls.',
        href: '/loads',
        cta: 'Plan load support',
    },
    {
        title: 'Pilot car and support providers',
        body: 'Claim a profile, show service areas and equipment, add trust signals where available, and become easier to find for heavy haul work.',
        href: '/claim',
        cta: 'Claim listing',
    },
    {
        title: 'Permit, route, and field teams',
        body: 'Move from scattered rules and contacts into connected requirements, glossary terms, route tools, and provider discovery.',
        href: '/regulations',
        cta: 'Check requirements',
    },
];

const internalLinkGroups = [
    {
        title: 'Find support',
        links: [
            { label: 'Pilot car directory', href: '/directory?category=pilot-car' },
            { label: 'Escort vehicle directory', href: '/directory?category=escort' },
            { label: 'Route survey support', href: '/directory?category=route-survey' },
            { label: 'Claim your listing', href: '/claim' },
        ],
    },
    {
        title: 'Plan the move',
        links: [
            { label: 'Escort requirements', href: '/regulations' },
            { label: 'Heavy haul tools', href: '/tools' },
            { label: 'Load board', href: '/loads' },
            { label: 'Corridor intelligence', href: '/corridor' },
        ],
    },
    {
        title: 'Learn the system',
        links: [
            { label: 'Pilot car glossary', href: '/glossary/pilot-car' },
            { label: 'High pole glossary', href: '/glossary/high-pole' },
            { label: 'Route survey glossary', href: '/glossary/route-survey' },
            { label: 'Training hub', href: '/training' },
        ],
    },
];

const faqs = [
    {
        question: 'What is Haul Command used for?',
        answer: 'Haul Command is used to find pilot cars, escort vehicles, permit support, route intelligence, and heavy haul support providers for oversize and overweight loads.',
    },
    {
        question: 'Is Haul Command only for pilot car operators?',
        answer: 'No. Haul Command includes pilot car operators, escort vehicle companies, permit support, route survey providers, traffic control, mobile repair, staging locations, and other heavy haul support roles.',
    },
    {
        question: 'Can pilot car operators claim a Haul Command profile?',
        answer: 'Yes. Pilot car operators and support companies can claim a profile, add service details, list service areas, improve visibility, and make it easier for brokers and carriers to find them.',
    },
    {
        question: 'Does Haul Command cover multiple countries?',
        answer: 'Yes. Haul Command is structured around a 120-country coverage model. Each market should show whether it is live, claimable, source-backed, regulation-intelligence live, or still developing.',
    },
    {
        question: 'How does Haul Command help brokers and carriers?',
        answer: 'Haul Command helps brokers and carriers search by location, role, service type, and route need so they can compare heavy haul support options faster.',
    },
];

function buildDirectoryJsonLd(providerCount: number) {
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Organization',
                '@id': `${SITE_URL}/#organization`,
                name: 'Haul Command',
                alternateName: ['HaulCommand', 'Haul Command Directory'],
                url: SITE_URL,
                logo: absoluteUrl('/icons/icon-512x512.png'),
            },
            {
                '@type': 'WebSite',
                '@id': `${SITE_URL}/#website`,
                url: SITE_URL,
                name: 'Haul Command',
                publisher: { '@id': `${SITE_URL}/#organization` },
                potentialAction: {
                    '@type': 'SearchAction',
                    target: `${absoluteUrl('/directory')}?q={search_term_string}`,
                    'query-input': 'required name=search_term_string',
                },
            },
            {
                '@type': 'CollectionPage',
                '@id': `${absoluteUrl('/directory')}#collection`,
                url: absoluteUrl('/directory'),
                name: 'Pilot Car & Escort Vehicle Directory for Heavy Haul Support',
                description: 'Search Haul Command for pilot cars, escort vehicles, permit support, route survey help, and heavy haul support providers by location, service type, and profile status.',
                isPartOf: { '@id': `${SITE_URL}/#website` },
                about: roleCoverage,
                numberOfItems: providerCount,
            },
            {
                '@type': 'BreadcrumbList',
                '@id': `${absoluteUrl('/directory')}#breadcrumb`,
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
                    { '@type': 'ListItem', position: 2, name: 'Directory', item: absoluteUrl('/directory') },
                ],
            },
            {
                '@type': 'FAQPage',
                '@id': `${absoluteUrl('/directory')}#faq`,
                mainEntity: faqs.map((faq) => ({
                    '@type': 'Question',
                    name: faq.question,
                    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
                })),
            },
        ],
    };
}

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Pilot Car & Escort Vehicle Directory | Heavy Haul Support Providers | Haul Command",
        description: "Search Haul Command's heavy haul directory to find pilot car operators, escort vehicles, permit support, route survey help, and oversize load support providers by location, service type, and profile status.",
        alternates: {
            canonical: absoluteUrl('/directory'),
        },
        openGraph: {
            title: "Pilot Car & Escort Vehicle Directory for Heavy Haul Support",
            description: "Find and compare pilot cars, escort vehicles, permit support, route intelligence, and heavy haul support providers across Haul Command's 120-country coverage model.",
            url: absoluteUrl('/directory'),
            images: [getPageFamilyOgImage('directory')],
        },
        twitter: {
            card: "summary_large_image",
            title: "Pilot Car & Escort Vehicle Directory for Heavy Haul Support",
            description: "Find pilot cars, escort vehicles, permit support, route survey help, and oversize load support providers by location, service type, and profile status.",
            images: [getPageFamilyOgImage('directory')],
        }
    };
}

export default async function GlobalDirectory({ searchParams }: { searchParams: Promise<{ country?: string, q?: string, category?: string }> }) {
    const resolvedParams = await searchParams;
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const targetCountry = normalizeDirectoryCountry(resolvedParams.country);
    const queryLocation = resolvedParams.q || '';
    const queryCategory = resolvedParams.category || '';

    // Fetch operators
    let providers: any[] = [];
    
    // 1. Try Typesense if a search query exists
    let usedTypesense = false;
    const searchQuery = [queryLocation, queryCategory].filter(Boolean).join(' ').trim();
    
    if (searchQuery) {
        try {
            const tsClient = getTypesenseSearch();
            const filters: string[] = [];
            if (targetCountry) filters.push(`country_code:=${targetCountry}`);
            const categoryFilter = resolveDirectoryCategoryFilter(queryCategory);
            if (categoryFilter) {
                filters.push(`entity_family:=${categoryFilter.entityFamily}`);
                filters.push(`entity_subtype:=[${categoryFilter.entitySubtypes.join(',')}]`);
            }
            const filterBy = filters.length > 0 ? filters.join(' && ') : undefined;
            
            const searchRes = await tsClient.collections(OPERATORS_COLLECTION).documents().search({
                q: searchQuery,
                query_by: 'company_name,city,state,role_subtypes,service_categories',
                filter_by: filterBy,
                per_page: 50,
                // Simple typo tolerance for city names
                num_typos: 1
            });
            
            if (searchRes && searchRes.hits) {
                providers = searchRes.hits.map(h => Object.assign({}, h.document, {
                   contact_id: (h.document as any).id,
                   company: (h.document as any).company_name
                }));
                usedTypesense = true;
            }
        } catch (e) {
            console.warn('[directory] Typesense search failed, falling back to Supabase', e);
        }
    }

    // 2. Fallback to Supabase
    if (!usedTypesense) {
        try {
            const plan = buildDirectoryFallbackFilterPlan({
                country: resolvedParams.country,
                category: queryCategory,
                q: queryLocation,
            });
            let query = supabase
                .from('v_directory_publishable')
                .select('*');

            if (plan.countryCode) {
                query = query.eq('country_code', plan.countryCode);
            }

            if (plan.category) {
                query = query
                    .eq('entity_family', plan.category.entityFamily)
                    .in('entity_subtype', plan.category.entitySubtypes);
            }

            const locationOrFilter = buildDirectoryLocationOrFilter(plan.locationSearch);
            if (locationOrFilter) {
                query = query.or(locationOrFilter);
            }

            for (const order of plan.order) {
                query = query.order(order.column, {
                    ascending: order.ascending,
                    nullsFirst: false,
                });
            }

            const { data } = await query.limit(plan.limit);
            providers = data ?? [];
        } catch (e) {
            console.warn('[directory] Supabase query failed:', e);
        }
    }

    return (
        <HCContentPageShell>
            <script
                type="application/ld+json"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: JSON.stringify(buildDirectoryJsonLd(providers.length)) }}
            />
            {/* YP Style Clean Header */}
            <div className="w-full bg-[#f8f9fa] border-b border-gray-200 py-12 px-4 shadow-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="text-xs font-bold text-[#C6923A] uppercase tracking-widest mb-2">Heavy Haul Provider Intelligence</div>
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">Pilot Car & Escort Vehicle Directory for Heavy Haul Support</h1>
                    <p className="max-w-3xl text-base md:text-lg leading-7 text-gray-700">
                        Find pilot car operators, escort vehicles, permit support, route survey help, and oversize load support providers by location, service type, route need, and profile status.
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 lg:gap-6 mt-6 text-sm font-bold uppercase tracking-wider text-gray-400">
                        <Link href="/directory?country=US" className={targetCountry === 'US' ? "text-[#C6923A]" : "hover:text-gray-900 transition-colors"}>United States</Link>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                        <Link href="/directory?country=CA" className={targetCountry === 'CA' ? "text-[#C6923A]" : "hover:text-gray-900 transition-colors"}>Canada</Link>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                        <Link href="/directory?country=AU" className={targetCountry === 'AU' ? "text-[#C6923A]" : "hover:text-gray-900 transition-colors"}>Australia</Link>
                    </div>
                </div>
            </div>

            <HCContentSection pad="section_balanced_pad">
                <div className="max-w-7xl mx-auto">
                    {/* HC Ask — intelligence strip */}
                    <div className="mb-6"><HCAskStrip context="directory" /></div>

                    <section aria-labelledby="what-is-haul-command" className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
                            <div className="p-5 md:p-7">
                                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#C6923A]">Answer-first directory layer</div>
                                <h2 id="what-is-haul-command" className="mt-3 text-2xl md:text-3xl font-black tracking-tight text-gray-950">
                                    What is Haul Command?
                                </h2>
                                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm md:text-base font-semibold leading-7 text-gray-900">
                                    Haul Command is a heavy haul directory and operating system for finding pilot cars, escort vehicles, permit support, route intelligence, and support providers for oversize and overweight loads. It helps brokers, carriers, shippers, dispatchers, and pilot car operators search by role, location, service area, route need, and profile status across a 120-country coverage model.
                                </p>
                                <div className="mt-5 space-y-4 text-sm md:text-base leading-7 text-gray-700">
                                    <p>
                                        Haul Command is built for the real heavy haul workflow: finding the right escort support, understanding route and permit requirements, comparing providers, checking service areas, and giving operators a profile they can claim and improve.
                                    </p>
                                    <p>
                                        Some markets are live, some are source-backed, some are claimable, and some are still developing. Each market should show its current status so users understand what is available now without mistaking seeded or historical intelligence for complete live coverage.
                                    </p>
                                </div>
                            </div>
                            <div className="border-t border-gray-200 bg-gray-950 p-5 md:p-7 text-white lg:border-l lg:border-t-0">
                                <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Proof states</div>
                                <div className="mt-4 space-y-3">
                                    {proofStates.map((state) => (
                                        <div key={state.label} className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
                                            <div className="text-sm font-black text-white">{state.label}</div>
                                            <p className="mt-1 text-xs leading-5 text-gray-300">{state.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Searchable operator grid */}
                    <DirectoryGrid providers={providers} targetCountry={targetCountry ?? 'GLOBAL'} />
                </div>
            </HCContentSection>

            {/* AdGrid Sponsor Zone & Activity Feed — directory landing */}
            <HCContentSection pad="section_balanced_pad">
                <div className="max-w-7xl mx-auto space-y-8">
                    <section aria-labelledby="directory-role-coverage" className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                            <div>
                                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#C6923A]">Role-rich discovery</div>
                                <h2 id="directory-role-coverage" className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-gray-950">Find support by role, job intent, and market status</h2>
                            </div>
                            <Link href="/claim" className="inline-flex w-fit items-center rounded-lg bg-gray-950 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-gray-800">
                                Claim or improve a profile
                            </Link>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {roleCoverage.map((role) => (
                                <Link
                                    key={role}
                                    href={`/directory?q=${encodeURIComponent(role)}`}
                                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm font-bold text-gray-800 transition-colors hover:border-[#C6923A] hover:bg-amber-50"
                                >
                                    {role}
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section aria-labelledby="who-haul-command-helps" className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {userGroups.map((group, index) => (
                            <div key={group.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                                <h2 id={index === 0 ? 'who-haul-command-helps' : undefined} className="text-lg font-black text-gray-950">{group.title}</h2>
                                <p className="mt-3 text-sm leading-6 text-gray-700">{group.body}</p>
                                <Link href={group.href} className="mt-4 inline-flex text-sm font-black text-[#9B6A16] hover:text-gray-950">
                                    {group.cta}
                                </Link>
                            </div>
                        ))}
                    </section>

                    <section aria-labelledby="directory-links" className="rounded-2xl border border-gray-200 bg-[#f8f9fa] p-5 md:p-7">
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-[#C6923A]">Connected heavy haul graph</div>
                        <h2 id="directory-links" className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-gray-950">Keep moving from search to requirements, tools, and claim paths</h2>
                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                            {internalLinkGroups.map((group) => (
                                <div key={group.title} className="rounded-xl border border-gray-200 bg-white p-4">
                                    <h3 className="text-sm font-black uppercase tracking-wide text-gray-500">{group.title}</h3>
                                    <div className="mt-3 flex flex-col gap-2">
                                        {group.links.map((link) => (
                                            <Link key={link.href} href={link.href} className="text-sm font-bold text-gray-900 underline-offset-4 hover:text-[#9B6A16] hover:underline">
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section aria-labelledby="directory-faq" className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7 shadow-sm">
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-[#C6923A]">Quick answers</div>
                        <h2 id="directory-faq" className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-gray-950">Heavy haul directory FAQ</h2>
                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {faqs.map((faq) => (
                                <div key={faq.question} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                    <h3 className="text-base font-black text-gray-950">{faq.question}</h3>
                                    <p className="mt-2 text-sm leading-6 text-gray-700">{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section aria-label="How this directory page is built" className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-sm leading-6 text-gray-700">
                        <strong className="text-gray-950">How this page is built:</strong> this directory combines listed provider profiles, profile status, location and service metadata, route-support categories, requirement links, glossary context, and market-status signals. Verification, trust, freshness, and contact states should appear only when the underlying data supports them.
                    </section>
                </div>
            </HCContentSection>

            <HCContentSection pad="section_balanced_pad">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                  <div className="lg:col-span-2">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">Directory Sponsors</h2>
                    <AdGridSlot zone="directory_sponsor" />
                  </div>
                  <div className="lg:col-span-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">Live Network Pulse</h2>
                    <LiveActivityFeed />
                  </div>
                </div>
            </HCContentSection>
        </HCContentPageShell>
    )
}
