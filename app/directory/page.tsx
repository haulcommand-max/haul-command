import React from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { LiveActivityFeed } from '@/components/feed/LiveActivityFeed';
import { HCAskStrip } from '@/components/hc-ask/HCAskStrip';
import { DirectoryGrid } from '@/components/directory/DirectoryGrid';
import { HaulCommandTopicHero } from '@/components/topic-hero/HaulCommandTopicHero';
import { TOPIC_HERO_PRESETS } from '@/lib/topic-hero/configs';

import { HCContentPageShell, HCContentSection } from "@/components/content-system/shell/HCContentPageShell";
import { getPageFamilyOgImage } from "@/components/ui/PageFamilyBackground";
import { Metadata } from 'next';
import {
    DIRECTORY_TYPESENSE_QUERY_BY,
    getDirectorySurfaceCollection,
    getTypesenseSearch,
} from '@/lib/typesense/client';
import {
    buildDirectoryFallbackFilterPlan,
    buildDirectoryLocationOrFilter,
    normalizeDirectoryCountry,
    type DirectorySurfaceView,
} from '@/lib/directory/server-query';
import {
    MOBILE_APP_PAGE_TEMPLATES,
    ROLE_EXPERIENCE_FAMILIES,
} from '@/lib/role-experience/role-experience-engine';
import { absoluteUrl, SITE_URL } from '@/lib/site-url';
import {
    directoryConversionCopy,
    directorySearchPromiseCopy,
} from '@/lib/directory/conversion-copy';

export const dynamic = 'force-dynamic';

const proofStates = [
    {
        label: 'Listed',
        description: 'The company, service, yard, authority, or support record is visible for discovery.',
    },
    {
        label: 'Claimable',
        description: 'The record can be claimed or improved by the operator, owner, or support provider.',
    },
    {
        label: 'Contact Confirmed',
        description: 'A phone, website, or request path is present without inventing live availability.',
    },
    {
        label: 'Document Verified',
        description: 'Verification evidence exists for the profile, claim, or support record.',
    },
    {
        label: 'Performance Verified',
        description: 'Verified job or performance evidence is attached when the data supports it.',
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

const sponsorInventory = [
    {
        title: 'Market sponsor',
        body: 'City, state, province, or country visibility when buyers are comparing local support density.',
        href: '/advertise?placement=directory-market&intent=market-ownership',
    },
    {
        title: 'Role sponsor',
        body: 'Native placement beside searches for escort, repair, parking, permit, broker, or supplier support.',
        href: '/advertise?placement=directory-role&intent=role-ownership',
    },
    {
        title: 'Route sponsor',
        body: 'Corridor and move-planning visibility before a broker builds the support packet.',
        href: '/advertise?placement=directory-route&intent=route-ownership',
    },
    {
        title: 'Emergency support sponsor',
        body: 'Labeled inventory for urgent repair, staging, parking, and field-support moments.',
        href: '/advertise?placement=directory-emergency&intent=urgent-support',
    },
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
        href: '/escort-requirements',
        cta: 'Check requirements',
    },
];

const primaryIntentCards = [
    {
        eyebrow: 'For operators and support providers',
        title: 'Get found for more jobs',
        body: 'Claim or correct your listing, add service areas and proof, and make it easier for brokers to choose you before they call the next company.',
        href: '/claim?intent=directory-get-more-jobs',
        cta: 'Claim your listing',
        tone: 'green',
    },
    {
        eyebrow: 'For brokers, carriers, and shippers',
        title: 'Find people for this load',
        body: 'Search pilot cars, escorts, permit help, route survey, yards, repair, parking, and field support by role, market, and proof state.',
        href: '#directory-results',
        cta: 'Search support',
        tone: 'gold',
    },
    {
        eyebrow: 'When the market looks thin',
        title: 'Post the support need',
        body: 'If the directory does not show enough source-backed coverage, post the need so Haul Command can capture demand instead of ending at a dead search.',
        href: '/load-board/post?intent=directory-support-need',
        cta: 'Post demand',
        tone: 'blue',
    },
    {
        eyebrow: 'For sponsors and vendors',
        title: 'Show up beside buyer intent',
        body: 'Sponsor a role, market, or corridor without fake rank. Placement stays labeled and follows the real support moment.',
        href: '/advertise?placement=directory-market&intent=buyer-moment',
        cta: 'Sponsor demand',
        tone: 'amber',
    },
];

const directorySearchPromises = directorySearchPromiseCopy;

const directoryRoleFamilyCopy: Record<string, { buyerLine: string; primaryAction: string }> = {
    operator: {
        buyerLine: 'Use this when you need pilot cars, escorts, heavy-haul carriers, high-pole support, or operators that can be compared by market and proof state.',
        primaryAction: 'Search operators',
    },
    broker_dispatcher: {
        buyerLine: 'Use this when a load needs coverage fast and you need to turn a route, deadline, and support list into a provider stack.',
        primaryAction: 'Build support packet',
    },
    support_partner: {
        buyerLine: 'Use this for yards, parking, repair, fuel, suppliers, installers, training, and field services that support the move around the route.',
        primaryAction: 'Find support partners',
    },
    route_intelligence: {
        buyerLine: 'Use this when permit complexity, route survey, bridge clearance, port handoff, border crossing, or weather risk matters before dispatch.',
        primaryAction: 'Check route help',
    },
    adgrid_sponsor: {
        buyerLine: 'Use this when a supplier or service provider wants labeled visibility near a real buyer moment without implying fake rank or fake availability.',
        primaryAction: 'Sponsor a gap',
    },
    admin_command: {
        buyerLine: 'Use this for corrections, claims, source review, and market maturity signals that keep the public directory honest.',
        primaryAction: 'Submit correction',
    },
};

const directoryRoleFamilies = Object.values(ROLE_EXPERIENCE_FAMILIES).map((family) => ({
    ...family,
    publicCopy: directoryRoleFamilyCopy[family.id],
    searchableTemplates: family.defaultTemplates
        .map((templateId) => MOBILE_APP_PAGE_TEMPLATES[templateId])
        .filter((template) => template.publicIndexable)
        .slice(0, 3),
}));

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
            { label: 'Escort requirements', href: '/escort-requirements' },
            { label: 'Heavy haul tools', href: '/tools' },
            { label: 'Load board', href: '/loads' },
            { label: 'Corridor intelligence', href: '/corridors' },
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
        answer: 'Yes. Haul Command supports a 120-country directory framework, but every market is labeled by evidence. Some markets are ready for requests, some have listed providers, and some still need claims, corrections, or local sources.',
    },
    {
        question: 'How does Haul Command help brokers and carriers?',
        answer: 'Haul Command helps brokers and carriers search by location, role, service type, and route need so they can compare heavy haul support options faster.',
    },
];

function applyDirectorySurfaceCategoryFilter(query: any, category: NonNullable<ReturnType<typeof buildDirectoryFallbackFilterPlan>['category']>) {
    return query
        .eq('entity_type', category.entityFamily)
        .in('entity_subtype', category.entitySubtypes);
}

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
                description: 'Search Haul Command for pilot cars, escort vehicles, permit support, route survey help, infrastructure, and heavy haul support records by location, service type, and profile status.',
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
        description: "Use Haul Command to get found for more heavy-haul jobs, find pilot cars and field support for a load, or post a support need when a market is thin.",
        alternates: {
            canonical: absoluteUrl('/directory'),
        },
        openGraph: {
            title: "Heavy Haul Support Directory | Haul Command",
            description: "Get listed for more jobs, search heavy-haul support, or post demand when a move needs pilot cars, permits, route help, yards, repair, or field support.",
            url: absoluteUrl('/directory'),
            images: [getPageFamilyOgImage('directory')],
        },
        twitter: {
            card: "summary_large_image",
            title: "Heavy Haul Support Directory | Haul Command",
            description: "Get listed, find support, or post a heavy-haul support need across Haul Command's proof-labeled directory.",
            images: [getPageFamilyOgImage('directory')],
        }
    };
}

export default async function GlobalDirectory({ searchParams }: { searchParams: Promise<{ country?: string, q?: string, category?: string, proof?: string, claim?: string, sort?: string }> }) {
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
    const fallbackPlan = buildDirectoryFallbackFilterPlan({
        country: resolvedParams.country,
        category: queryCategory,
        q: queryLocation,
    });

    // Fetch support records from the searchable heavy-haul graph.
    let providers: any[] = [];
    let directoryDataIssue: string | null = null;

    // 1. Try Typesense if a search query exists
    let usedTypesense = false;
    const searchQuery = [queryLocation, queryCategory].filter(Boolean).join(' ').trim();

    if (searchQuery) {
        try {
            const tsClient = getTypesenseSearch();
            const filters: string[] = [];
            if (fallbackPlan.countryCode) filters.push(`country_code:=${fallbackPlan.countryCode}`);
            const categoryFilter = fallbackPlan.category;
            if (categoryFilter) {
                filters.push(`entity_family:=${categoryFilter.entityFamily}`);
                filters.push(`entity_subtype:=[${categoryFilter.entitySubtypes.join(',')}]`);
            }
            const filterBy = filters.length > 0 ? filters.join(' && ') : undefined;
            const perCollectionLimit = Math.max(8, Math.ceil(fallbackPlan.limit / Math.max(fallbackPlan.surfaceViews.length, 1)));

            const searchResults = await Promise.all(
                fallbackPlan.surfaceViews.map(async (surfaceView) => {
                    const collection = getDirectorySurfaceCollection(surfaceView);

                    try {
                        const searchRes = await tsClient.collections(collection).documents().search({
                            q: searchQuery,
                            query_by: DIRECTORY_TYPESENSE_QUERY_BY,
                            filter_by: filterBy,
                            per_page: perCollectionLimit,
                            // Simple typo tolerance for city names
                            num_typos: 1
                        });

                        return (searchRes.hits ?? []).map(h => Object.assign({}, h.document, {
                            contact_id: (h.document as any).contact_id || (h.document as any).id,
                            company: (h.document as any).company_name,
                            source_view: (h.document as any).source_view || surfaceView,
                        }));
                    } catch (surfaceError) {
                        console.warn(`[directory] Typesense ${collection} search failed`, surfaceError);
                        return [];
                    }
                })
            );

            providers = searchResults
                .flat()
                .sort((a: any, b: any) => {
                    const aScore = Number(a.rank_score ?? a.confidence_score ?? a.directory_quality_score ?? 0);
                    const bScore = Number(b.rank_score ?? b.confidence_score ?? b.directory_quality_score ?? 0);
                    return bScore - aScore;
                })
                .slice(0, fallbackPlan.limit);

            usedTypesense = providers.length > 0;
        } catch (e) {
            console.warn('[directory] Typesense search failed, falling back to Supabase', e);
        }
    }

    // 2. Fallback to Supabase
    if (!usedTypesense) {
        try {
            const plan = fallbackPlan;
            const locationOrFilter = buildDirectoryLocationOrFilter(plan.locationSearch);
            const perSurfaceLimit = Math.max(12, Math.ceil(plan.limit / Math.max(plan.surfaceViews.length, 1)));

            const surfaceResults = await Promise.all(
                plan.surfaceViews.map(async (surfaceView: DirectorySurfaceView) => {
                    let query = supabase.from(surfaceView).select('*');

                    if (plan.countryCode) {
                        query = query.eq('country_code', plan.countryCode);
                    }

                    if (plan.category) {
                        query = applyDirectorySurfaceCategoryFilter(query, plan.category);
                    }

                    if (locationOrFilter) {
                        query = query.or(locationOrFilter);
                    }

                    for (const order of plan.order) {
                        query = query.order(order.column, {
                            ascending: order.ascending,
                            nullsFirst: false,
                        });
                    }

                    const { data, error } = await query.limit(perSurfaceLimit);
                    if (error) {
                        console.warn(`[directory] Supabase ${surfaceView} query failed:`, error.message);
                        directoryDataIssue = `Directory data source failed: ${error.message}`;
                        return [];
                    }

                    return data ?? [];
                })
            );

            providers = surfaceResults
                .flat()
                .sort((a: any, b: any) => {
                    const aScore = Number(a.rank_score ?? a.confidence_score ?? a.directory_quality_score ?? 0);
                    const bScore = Number(b.rank_score ?? b.confidence_score ?? b.directory_quality_score ?? 0);
                    return bScore - aScore;
                })
                .slice(0, plan.limit);
        } catch (e) {
            console.warn('[directory] Supabase query failed:', e);
            directoryDataIssue = 'Directory data source failed before records could load.';
        }
    }

    if (providers.length === 0) {
        try {
            let publishableQuery = supabase.from('v_directory_publishable').select('*');

            if (fallbackPlan.countryCode) {
                publishableQuery = publishableQuery.eq('country_code', fallbackPlan.countryCode);
            }

            if (fallbackPlan.isPureRoleQuery && fallbackPlan.category) {
                publishableQuery = publishableQuery.eq('entity_family', fallbackPlan.category.entityFamily);
            }

            if (fallbackPlan.locationSearch) {
                const escaped = fallbackPlan.locationSearch.replace(/[%_,]/g, (char) => `\\${char}`);
                publishableQuery = publishableQuery.or([
                    `company.ilike.%${escaped}%`,
                    `name.ilike.%${escaped}%`,
                    `city.ilike.%${escaped}%`,
                    `state_inferred.ilike.%${escaped}%`,
                    `state_code.ilike.%${escaped}%`,
                ].join(','));
            }

            const { data, error } = await publishableQuery
                .order('rank_score', { ascending: false, nullsFirst: false })
                .limit(fallbackPlan.limit);

            if (error) {
                console.warn('[directory] publishable fallback failed:', error.message);
                directoryDataIssue = `Directory publishable fallback failed: ${error.message}`;
            } else {
                providers = (data ?? []).map((row: any) => ({
                    ...row,
                    id: row.contact_id ?? row.id ?? row.entity_id,
                    contact_id: row.contact_id ?? row.id ?? row.entity_id,
                    company: row.company ?? row.name,
                    name: row.name ?? row.company,
                    country_code: row.country_code,
                    state: row.state_inferred ?? row.state_code,
                    admin1_code: row.state_code ?? row.state_inferred,
                    source_view: 'v_directory_publishable',
                }));
            }
        } catch (e) {
            console.warn('[directory] publishable fallback exception:', e);
            directoryDataIssue = 'Directory publishable fallback failed before records could load.';
        }
    }

    if (providers.length === 0 && fallbackPlan.isPureRoleQuery && fallbackPlan.category) {
        try {
            const relaxedResults = await Promise.all(
                fallbackPlan.surfaceViews.map(async (surfaceView: DirectorySurfaceView) => {
                    let query = supabase.from(surfaceView).select('*');

                    if (fallbackPlan.countryCode) {
                        query = query.eq('country_code', fallbackPlan.countryCode);
                    }

                    query = query.eq('entity_type', fallbackPlan.category!.entityFamily);

                    const { data, error } = await query
                        .order('rank_score', { ascending: false, nullsFirst: false })
                        .limit(Math.max(12, Math.ceil(fallbackPlan.limit / Math.max(fallbackPlan.surfaceViews.length, 1))));

                    if (error) {
                        console.warn(`[directory] relaxed role fallback ${surfaceView} failed:`, error.message);
                        directoryDataIssue = `Directory role fallback failed: ${error.message}`;
                        return [];
                    }

                    return data ?? [];
                })
            );

            providers = relaxedResults
                .flat()
                .sort((a: any, b: any) => {
                    const aScore = Number(a.rank_score ?? a.confidence_score ?? a.directory_quality_score ?? 0);
                    const bScore = Number(b.rank_score ?? b.confidence_score ?? b.directory_quality_score ?? 0);
                    return bScore - aScore;
                })
                .slice(0, fallbackPlan.limit);
        } catch (e) {
            console.warn('[directory] relaxed role fallback exception:', e);
            directoryDataIssue = 'Directory role fallback failed before records could load.';
        }
    }

    const directoryHeroConfig = {
        ...TOPIC_HERO_PRESETS.directoryHub,
        countryScope: targetCountry ?? undefined,
        statCards: [
            { value: providers.length, label: 'Visible on this view' },
            { value: '7,468+', label: 'Industry records' },
            { value: targetCountry ?? 'GLOBAL', label: 'Country scope' },
            { value: '120', label: 'Country framework' },
        ],
        quickChips: roleCoverage.slice(0, 8).map((role) => ({
            label: role,
            href: `/directory?q=${encodeURIComponent(role)}`,
            intent: 'provider_intent',
        })),
        internalLinks: internalLinkGroups.flatMap((group) =>
            group.links.map((link) => ({
                ...link,
                intent: group.title.toLowerCase().replace(/\s+/g, '_'),
            })),
        ),
        relatedNextSteps: [
            { label: 'Build move support packet', href: '/load-board/post?intent=support-packet', intent: 'load_post_intent' },
            { label: 'Claim your listing', href: '/claim', intent: 'claim_intent' },
            { label: 'Check escort requirements', href: '/escort-requirements', intent: 'regulation_intent' },
            { label: 'Find available providers', href: '/available-now', intent: 'provider_intent' },
            { label: 'Sponsor directory demand', href: '/advertise?placement=directory-market', intent: 'sponsor_intent' },
            { label: 'View training paths', href: '/training', intent: 'training_intent' },
        ],
    };

    return (
        <HCContentPageShell>
            <script
                type="application/ld+json"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: JSON.stringify(buildDirectoryJsonLd(providers.length)) }}
            />
            <HaulCommandTopicHero config={directoryHeroConfig} />

            <HCContentSection pad="section_y_pad">
                <div className="max-w-7xl mx-auto">
                    {/* HC Ask — intelligence strip */}
                    <div className="mb-6"><HCAskStrip context="directory" /></div>

                    <section aria-labelledby="directory-primary-intents" className="mb-8 rounded-2xl border border-[#C6923A]/25 bg-black/45 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-[2px] md:p-6">
                        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                            <div className="max-w-3xl">
                                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#C6923A]">Choose what you came here to do</div>
                                <h2 id="directory-primary-intents" className="mt-2 text-2xl font-black tracking-tight text-white md:text-3xl">
                                    Get more jobs, find support, or post demand
                                </h2>
                                <p className="mt-3 text-sm leading-6 text-[#d8c6a3] md:text-base">
                                    Haul Command is a working directory. Start with the action that matches your role, then use search and proof labels to narrow the market.
                                </p>
                            </div>
                            <Link href="#directory-results" className="inline-flex min-h-11 w-fit items-center rounded-lg bg-[#C6923A] px-4 py-2 text-sm font-black text-[#0B0B0C] transition-colors hover:bg-[#E0B05C]">
                                Jump to search
                            </Link>
                        </div>
                        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {primaryIntentCards.map((intent) => (
                                <Link
                                    key={intent.title}
                                    href={intent.href}
                                    className="group flex min-h-[178px] flex-col justify-between rounded-xl border border-white/10 bg-white/[0.055] p-4 transition-colors hover:border-[#C6923A]/60 hover:bg-[#C6923A]/10"
                                >
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#C6923A]">{intent.eyebrow}</div>
                                        <h3 className="mt-2 text-lg font-black leading-tight text-white">{intent.title}</h3>
                                        <p className="mt-2 text-xs leading-5 text-[#d8c6a3]">{intent.body}</p>
                                    </div>
                                    <div className="mt-4 inline-flex w-fit rounded-lg bg-[#C6923A] px-3 py-2 text-xs font-black text-[#0B0B0C] group-hover:bg-[#E0B05C]">
                                        {intent.cta}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>

                    <div id="directory-results" className="mb-8 scroll-mt-24">
                        <DirectoryGrid
                            providers={providers}
                            targetCountry={targetCountry ?? 'GLOBAL'}
                            initialFilters={{
                                query: fallbackPlan.locationSearch,
                                country: targetCountry ?? '',
                                category: fallbackPlan.inferredCategory ?? queryCategory,
                                proof: resolvedParams.proof === 'verified' || resolvedParams.proof === 'contact_confirmed' ? resolvedParams.proof : 'all',
                                claim: resolvedParams.claim === 'claimed' || resolvedParams.claim === 'unclaimed' ? resolvedParams.claim : 'all',
                                sort: resolvedParams.sort === 'newest' || resolvedParams.sort === 'name' ? resolvedParams.sort : 'score',
                            }}
                            dataIssue={directoryDataIssue}
                        />
                    </div>

                    <section aria-labelledby="what-is-haul-command" className="mb-8 overflow-hidden rounded-2xl border border-[#C6923A]/25 bg-black/45 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-[2px]">
                        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
                            <div className="p-5 md:p-7">
                                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#C6923A]">{directoryConversionCopy.answerEyebrow}</div>
                                <h2 id="what-is-haul-command" className="mt-3 text-2xl md:text-3xl font-black tracking-tight text-white">
                                    {directoryConversionCopy.answerHeadline}
                                </h2>
                                <p className="mt-4 rounded-xl border border-[#C6923A]/35 bg-[#C6923A]/10 p-4 text-sm md:text-base font-semibold leading-7 text-[#fff7e8]">
                                    {directoryConversionCopy.answerSummary}
                                </p>
                                <div className="mt-5 space-y-4 text-sm md:text-base leading-7 text-[#d8c6a3]">
                                    <p>
                                        {directoryConversionCopy.answerBody}
                                    </p>
                                    <p>
                                        {directoryConversionCopy.trustRule}
                                    </p>
                                </div>
                            </div>
                            <div className="border-t border-[#C6923A]/20 bg-black/25 p-5 md:p-7 text-white lg:border-l lg:border-t-0">
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

                    <section aria-labelledby="directory-role-engine" className="mb-8 rounded-2xl border border-[#C6923A]/25 bg-black/45 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-[2px] md:p-7">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-3xl">
                                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#C6923A]">{directoryConversionCopy.roleEyebrow}</div>
                                <h2 id="directory-role-engine" className="mt-2 text-2xl font-black tracking-tight text-white md:text-3xl">
                                    {directoryConversionCopy.roleHeadline}
                                </h2>
                                <p className="mt-3 text-sm leading-6 text-[#d8c6a3] md:text-base">
                                    {directoryConversionCopy.roleBody}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/load-board/post?intent=directory-support-packet" className="inline-flex min-h-11 w-fit items-center rounded-lg bg-[#C6923A] px-4 py-2 text-sm font-black text-[#0B0B0C] transition-colors hover:bg-[#E0B05C]">
                                    Build support packet
                                </Link>
                                <Link href="/claim?intent=directory-correction" className="inline-flex min-h-11 w-fit items-center rounded-lg border border-[#C6923A]/35 bg-[#C6923A]/10 px-4 py-2 text-sm font-black text-[#F8DFB0] transition-colors hover:bg-[#C6923A]/16">
                                    Claim or fix listing
                                </Link>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {directorySearchPromises.map((promise) => (
                                <div key={promise.label} className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
                                    <div className="text-sm font-black text-white">{promise.label}</div>
                                    <p className="mt-2 text-xs leading-5 text-[#d8c6a3]">{promise.body}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {directoryRoleFamilies.map((family) => (
                                <div key={family.id} className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-black text-white">{family.label}</h3>
                                            <p className="mt-1 text-xs font-semibold leading-5 text-[#d8c6a3]">{family.publicCopy.buyerLine}</p>
                                        </div>
                                        <span className="rounded-full border border-[#C6923A]/25 bg-[#C6923A]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#F8DFB0]">
                                            search lane
                                        </span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {family.coreRoleExamples.slice(0, 3).map((role) => (
                                            <Link
                                                key={role}
                                                href={`/directory?q=${encodeURIComponent(role)}`}
                                                className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[11px] font-bold text-[#fff7e8] hover:border-[#C6923A]/50 hover:bg-[#C6923A]/10"
                                            >
                                                {role}
                                            </Link>
                                        ))}
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <Link
                                            href={`/directory?q=${encodeURIComponent(family.coreRoleExamples[0] ?? family.label)}`}
                                            className="rounded-lg bg-[#C6923A] px-3 py-2 text-[11px] font-black text-[#0B0B0C] hover:bg-[#E0B05C]"
                                        >
                                            {family.publicCopy.primaryAction}
                                        </Link>
                                        {family.searchableTemplates.map((template) => (
                                            <Link
                                                key={template.id}
                                                href={template.routePattern}
                                                className="text-[11px] font-black text-[#C6923A] underline-offset-4 hover:text-white hover:underline"
                                            >
                                                {template.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </HCContentSection>

            {/* AdGrid Sponsor Zone & Activity Feed — directory landing */}
            <HCContentSection pad="section_y_pad">
                <div className="max-w-7xl mx-auto space-y-8">
                    <section aria-labelledby="directory-role-coverage" className="rounded-2xl border border-[#C6923A]/20 bg-black/45 p-5 md:p-7 shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur-[2px]">
                        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                            <div>
                                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#C6923A]">Role-rich discovery</div>
                                <h2 id="directory-role-coverage" className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-white">Find support by role, job intent, and proof state</h2>
                            </div>
                            <Link href="/load-board/post?intent=support-packet" className="inline-flex w-fit items-center rounded-lg bg-[#C6923A] px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-[#E0B05C]">
                                Build move support packet
                            </Link>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {roleCoverage.map((role) => (
                                <Link
                                    key={role}
                                    href={`/directory?q=${encodeURIComponent(role)}`}
                                    className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 text-sm font-bold text-[#fff7e8] transition-colors hover:border-[#C6923A] hover:bg-[#C6923A]/10"
                                >
                                    {role}
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section aria-labelledby="directory-sponsor-inventory" className="rounded-2xl border border-[#C6923A]/20 bg-black/45 p-5 md:p-7 shadow-[0_20px_70px_rgba(0,0,0,0.3)] backdrop-blur-[2px]">
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-[#C6923A]">AdGrid inventory</div>
                        <h2 id="directory-sponsor-inventory" className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-white">{directoryConversionCopy.sponsorHeadline}</h2>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#d8c6a3]">{directoryConversionCopy.sponsorBody}</p>
                        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                            {sponsorInventory.map((slot) => (
                                <Link key={slot.title} href={slot.href} className="rounded-lg border border-white/10 bg-white/[0.05] p-4 transition-colors hover:border-[#C6923A] hover:bg-[#C6923A]/10">
                                    <h3 className="text-sm font-black text-white">{slot.title}</h3>
                                    <p className="mt-2 text-xs leading-5 text-[#d8c6a3]">{slot.body}</p>
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section aria-labelledby="who-haul-command-helps" className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {userGroups.map((group, index) => (
                            <div key={group.title} className="rounded-2xl border border-[#C6923A]/20 bg-black/45 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)] backdrop-blur-[2px]">
                                <h2 id={index === 0 ? 'who-haul-command-helps' : undefined} className="text-lg font-black text-white">{group.title}</h2>
                                <p className="mt-3 text-sm leading-6 text-[#d8c6a3]">{group.body}</p>
                                <Link href={group.href} className="mt-4 inline-flex text-sm font-black text-[#C6923A] hover:text-white">
                                    {group.cta}
                                </Link>
                            </div>
                        ))}
                    </section>

                    <section aria-labelledby="directory-links" className="rounded-2xl border border-[#C6923A]/20 bg-black/45 p-5 md:p-7 shadow-[0_20px_70px_rgba(0,0,0,0.25)] backdrop-blur-[2px]">
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-[#C6923A]">Connected heavy haul graph</div>
                        <h2 id="directory-links" className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-white">{directoryConversionCopy.linkGraphHeadline}</h2>
                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                            {internalLinkGroups.map((group) => (
                                <div key={group.title} className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
                                    <h3 className="text-sm font-black uppercase tracking-wide text-white/45">{group.title}</h3>
                                    <div className="mt-3 flex flex-col gap-2">
                                        {group.links.map((link) => (
                                            <Link key={link.href} href={link.href} className="text-sm font-bold text-[#fff7e8] underline-offset-4 hover:text-[#C6923A] hover:underline">
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section aria-labelledby="directory-faq" className="rounded-2xl border border-[#C6923A]/20 bg-black/45 p-5 md:p-7 shadow-[0_20px_70px_rgba(0,0,0,0.25)] backdrop-blur-[2px]">
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-[#C6923A]">Quick answers</div>
                        <h2 id="directory-faq" className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-white">Heavy haul directory FAQ</h2>
                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {faqs.map((faq) => (
                                <div key={faq.question} className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
                                    <h3 className="text-base font-black text-white">{faq.question}</h3>
                                    <p className="mt-2 text-sm leading-6 text-[#d8c6a3]">{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section aria-label="Directory trust rule" className="rounded-2xl border border-dashed border-[#C6923A]/25 bg-black/35 p-5 text-sm leading-6 text-[#d8c6a3] backdrop-blur-[2px]">
                        <strong className="text-white">Trust rule:</strong> {directoryConversionCopy.trustRule}
                    </section>
                </div>
            </HCContentSection>

            <HCContentSection pad="section_y_pad">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                  <div className="lg:col-span-2">
                    <h2 className="text-xl font-bold text-white mb-6 border-b border-[#C6923A]/20 pb-2">Directory Sponsors</h2>
                    <AdGridSlot zone="directory_sponsor" />
                  </div>
                  <div className="lg:col-span-1">
                    <h2 className="text-xl font-bold text-white mb-6 border-b border-[#C6923A]/20 pb-2">Live Network Pulse</h2>
                    <LiveActivityFeed fallbackStats={[
                        { label: 'visible on this view', value: providers.length.toLocaleString() },
                        { label: 'country scope', value: targetCountry ?? 'GLOBAL' },
                        { label: 'country framework', value: '120 countries' },
                    ]} />
                  </div>
                </div>
            </HCContentSection>
        </HCContentPageShell>
    )
}
