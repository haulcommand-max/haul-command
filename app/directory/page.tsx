import React from 'react';
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
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const proofStates = [
    {
        label: 'Indexed',
        description: 'A company, service, or infrastructure record is searchable as part of the support graph.',
    },
    {
        label: 'Claimable',
        description: 'The record can be claimed or improved by the operator, owner, or support provider.',
    },
    {
        label: 'Contact Confirmed',
        description: 'A phone, website, or contact path is present without inventing live availability.',
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
    'Truck stops',
    'Fuel stops',
    'Weigh stations',
    'Port and border support',
    'Heavy haul equipment support',
    'Line lift support',
    'Utility coordination',
    'Bucket truck support',
    'Police escort coordination',
    'Crane and rigging support',
    'Bridge and route engineering',
    'Pilot car training',
    'Compliance support',
    'Broker and dispatcher support',
    'Carrier support',
    'Shipper project cargo support',
    'Yard and property owners',
    'Repair shops',
    'Tire service',
    'Tow and recovery',
    'Hotel and motel parking',
    'Customs and cross-border support',
    'Escort equipment suppliers',
    'Installer and upfitter support',
    'Emergency route support',
    'Credentialed access labor',
];

type DirectoryRoleBrowseOption = {
    key: string;
    label: string;
    family: string;
    operators: number;
    hasSupply: boolean;
    source: 'supabase' | 'fallback';
};

function normalizeDirectoryRoleKey(value: unknown): string {
    return String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[_\s]+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function humanizeDirectoryRole(value: unknown): string {
    const raw = String(value ?? '').trim();
    if (!raw) return 'Heavy haul support';
    return raw
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function numberFromDirectoryRoleRow(row: any): number {
    const value =
        row?.operators ??
        row?.operator_count ??
        row?.entity_count ??
        row?.source_backed_records ??
        row?.listing_count ??
        row?.record_count ??
        row?.total_entities ??
        0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function fallbackDirectoryRoleOptions(): DirectoryRoleBrowseOption[] {
    return roleCoverage.map((label) => ({
        key: normalizeDirectoryRoleKey(label),
        label,
        family: 'support_partner',
        operators: 0,
        hasSupply: false,
        source: 'fallback',
    }));
}

function mapDirectoryRoleBrowseRow(row: any): DirectoryRoleBrowseOption | null {
    const key = normalizeDirectoryRoleKey(row?.role_key ?? row?.slug ?? row?.role_slug ?? row?.role);
    const label = String(row?.display_name ?? row?.role_label ?? row?.label ?? row?.name ?? '').trim() || humanizeDirectoryRole(key);

    if (!key || !label) return null;

    const operators = numberFromDirectoryRoleRow(row);
    return {
        key,
        label,
        family: String(row?.role_family ?? row?.family ?? row?.category ?? 'support_partner'),
        operators,
        hasSupply: Boolean(row?.has_supply ?? row?.has_entities ?? operators > 0),
        source: 'supabase',
    };
}

async function loadDirectoryRoleBrowseOptions(supabase: ReturnType<typeof createSupabaseServerClient>): Promise<DirectoryRoleBrowseOption[]> {
    try {
        const { data, error } = await supabase
            .from('v_hc_directory_role_browse')
            .select('*')
            .limit(520);

        if (error) {
            console.warn('[directory] role browse view unavailable, using fallback role chips:', error.message);
            return fallbackDirectoryRoleOptions();
        }

        const seen = new Set<string>();
        const roles = (data ?? [])
            .map(mapDirectoryRoleBrowseRow)
            .filter((role): role is DirectoryRoleBrowseOption => Boolean(role))
            .filter((role) => {
                if (seen.has(role.key)) return false;
                seen.add(role.key);
                return true;
            })
            .sort((a, b) => {
                if (a.hasSupply !== b.hasSupply) return Number(b.hasSupply) - Number(a.hasSupply);
                if (a.operators !== b.operators) return b.operators - a.operators;
                return a.label.localeCompare(b.label);
            });

        return roles.length > 0 ? roles : fallbackDirectoryRoleOptions();
    } catch (error) {
        console.warn('[directory] role browse exception, using fallback role chips:', error);
        return fallbackDirectoryRoleOptions();
    }
}

const countryTiers = [
    { title: 'Tier A Gold', codes: [['US','United States'],['CA','Canada'],['AU','Australia'],['GB','United Kingdom'],['NZ','New Zealand'],['ZA','South Africa'],['DE','Germany'],['NL','Netherlands'],['AE','United Arab Emirates'],['BR','Brazil']] },
    { title: 'Tier B Blue', codes: [['IE','Ireland'],['SE','Sweden'],['NO','Norway'],['DK','Denmark'],['FI','Finland'],['BE','Belgium'],['AT','Austria'],['CH','Switzerland'],['ES','Spain'],['FR','France'],['IT','Italy'],['PT','Portugal'],['SA','Saudi Arabia'],['QA','Qatar'],['MX','Mexico'],['IN','India'],['ID','Indonesia'],['TH','Thailand']] },
    { title: 'Tier C Silver', codes: [['PL','Poland'],['CZ','Czech Republic'],['SK','Slovakia'],['HU','Hungary'],['SI','Slovenia'],['EE','Estonia'],['LV','Latvia'],['LT','Lithuania'],['HR','Croatia'],['RO','Romania'],['BG','Bulgaria'],['GR','Greece'],['TR','Turkey'],['KW','Kuwait'],['OM','Oman'],['BH','Bahrain'],['SG','Singapore'],['MY','Malaysia'],['JP','Japan'],['KR','South Korea'],['CL','Chile'],['AR','Argentina'],['CO','Colombia'],['PE','Peru'],['VN','Vietnam'],['PH','Philippines']] },
    { title: 'Tier D Slate', codes: [['UY','Uruguay'],['PA','Panama'],['CR','Costa Rica'],['IL','Israel'],['NG','Nigeria'],['EG','Egypt'],['KE','Kenya'],['MA','Morocco'],['RS','Serbia'],['UA','Ukraine'],['KZ','Kazakhstan'],['TW','Taiwan'],['PK','Pakistan'],['BD','Bangladesh'],['MN','Mongolia'],['TT','Trinidad and Tobago'],['JO','Jordan'],['GH','Ghana'],['TZ','Tanzania'],['GE','Georgia'],['AZ','Azerbaijan'],['CY','Cyprus'],['IS','Iceland'],['LU','Luxembourg'],['EC','Ecuador']] },
    { title: 'Tier E Copper', codes: [['BO','Bolivia'],['PY','Paraguay'],['GT','Guatemala'],['DO','Dominican Republic'],['HN','Honduras'],['SV','El Salvador'],['NI','Nicaragua'],['JM','Jamaica'],['GY','Guyana'],['SR','Suriname'],['BA','Bosnia and Herzegovina'],['ME','Montenegro'],['MK','North Macedonia'],['AL','Albania'],['MD','Moldova'],['IQ','Iraq'],['NA','Namibia'],['AO','Angola'],['MZ','Mozambique'],['ET','Ethiopia'],['CI','Côte d’Ivoire'],['SN','Senegal'],['BW','Botswana'],['ZM','Zambia'],['UG','Uganda'],['CM','Cameroon'],['KH','Cambodia'],['LK','Sri Lanka'],['UZ','Uzbekistan'],['LA','Laos'],['NP','Nepal'],['DZ','Algeria'],['TN','Tunisia'],['MT','Malta'],['BN','Brunei'],['RW','Rwanda'],['MG','Madagascar'],['PG','Papua New Guinea'],['TM','Turkmenistan'],['KG','Kyrgyzstan'],['MW','Malawi']] },
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
        answer: 'Haul Command is used to find pilot cars, escort vehicles, permit support, route intelligence, infrastructure, and heavy haul support providers for oversize and overweight loads.',
    },
    {
        question: 'Is Haul Command only for pilot car operators?',
        answer: 'No. Haul Command includes pilot car operators, escort vehicle companies, permit support, route survey providers, traffic control, mobile repair, staging locations, parking, suppliers, and other heavy haul support roles.',
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

function buildDirectoryJsonLd(providerCount: number, roleLabels: string[]) {
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
                name: 'Heavy Haul Support Directory',
                description: 'Search Haul Command for pilot cars, escort vehicles, permit support, route survey help, infrastructure, and heavy haul support providers by location, service type, and proof state.',
                isPartOf: { '@id': `${SITE_URL}/#website` },
                about: roleLabels.length > 0 ? roleLabels : roleCoverage,
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
        title: "Heavy Haul Support Directory | Pilot Cars, Permits, Parking & Route Support | Haul Command",
        description: "Search Haul Command's heavy haul support directory for pilot cars, escort vehicles, permit support, route survey help, truck stops, parking, repair, staging, and oversize load support providers across a 120-country model.",
        alternates: {
            canonical: absoluteUrl('/directory'),
        },
        openGraph: {
            title: "Heavy Haul Support Directory | Haul Command",
            description: "Find and compare pilot cars, escort vehicles, permit support, route intelligence, infrastructure, and heavy haul support providers across Haul Command's 120-country coverage model.",
            url: absoluteUrl('/directory'),
            images: [getPageFamilyOgImage('directory')],
        },
        twitter: {
            card: "summary_large_image",
            title: "Heavy Haul Support Directory | Haul Command",
            description: "Find pilot cars, escorts, permits, truck stops, parking, repair, staging, and oversize load support by location, role, route need, and proof state.",
            images: [getPageFamilyOgImage('directory')],
        }
    };
}

export default async function GlobalDirectory({ searchParams }: { searchParams: Promise<{ country?: string, q?: string, category?: string }> }) {
    const resolvedParams = await searchParams;
    const supabase = createSupabaseServerClient();
    const targetCountry = normalizeDirectoryCountry(resolvedParams.country);
    const queryLocation = resolvedParams.q || '';
    const queryCategory = resolvedParams.category || '';
    const roleBrowseOptions = await loadDirectoryRoleBrowseOptions(supabase);
    const roleCoverageLabels = roleBrowseOptions.map((role) => role.label);

    let providers: any[] = [];
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

            const locationOrFilter = buildDirectoryLocationOrFilter(
                plan.locationSearch,
                plan.category?.searchTerms ?? []
            );
            if (locationOrFilter) {
                query = query.or(locationOrFilter);
            }

            for (const order of plan.order) {
                query = query.order(order.column, {
                    ascending: order.ascending,
                    nullsFirst: false,
                });
            }

            const { data, error } = await query.limit(plan.limit);
            if (error) throw error;
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
                dangerouslySetInnerHTML={{ __html: JSON.stringify(buildDirectoryJsonLd(providers.length, roleCoverageLabels.slice(0, 120))) }}
            />
            <div className="w-full bg-[#f8f9fa] border-b border-gray-200 py-12 px-4 shadow-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="text-xs font-bold text-[#C6923A] uppercase tracking-widest mb-2">Heavy Haul Support Graph</div>
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">Find the support that keeps an oversize load moving.</h1>
                    <p className="max-w-4xl text-base md:text-lg leading-7 text-gray-700">
                        Search operators, companies, infrastructure, permit help, brokers, suppliers, route survey teams, parking, repair, staging, and escort support by location, role, route need, and proof state.
                    </p>
                    
                    <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-bold uppercase tracking-wider">
                        {countryTiers[0].codes.map(([code, name]) => (
                            <Link
                                key={code}
                                href={`/directory?country=${code}`}
                                className={`rounded-lg border px-3 py-1.5 transition-all ${targetCountry === code ? 'border-[#C6923A] bg-[#C6923A] text-black' : 'border-gray-200 bg-white text-gray-500 hover:border-[#C6923A] hover:text-gray-900'}`}
                            >
                                {name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <HCContentSection pad="section_balanced_pad">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6"><HCAskStrip context="directory" /></div>

                    <section aria-labelledby="what-is-haul-command" className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
                            <div className="p-5 md:p-7">
                                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#C6923A]">Answer-first support layer</div>
                                <h2 id="what-is-haul-command" className="mt-3 text-2xl md:text-3xl font-black tracking-tight text-gray-950">
                                    What is Haul Command?
                                </h2>
                                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm md:text-base font-semibold leading-7 text-gray-900">
                                    Haul Command is a heavy haul support graph and operating system for finding pilot cars, escort vehicles, permit support, route intelligence, infrastructure, and field support for oversize and overweight loads. It helps brokers, carriers, shippers, dispatchers, and support providers search by role, location, service area, route need, and proof state across a 120-country coverage model.
                                </p>
                                <div className="mt-5 space-y-4 text-sm md:text-base leading-7 text-gray-700">
                                    <p>
                                        Haul Command is built for the real heavy haul workflow: finding the right escort support, understanding route and permit requirements, comparing route-support records, checking service areas, and giving operators or infrastructure partners a profile they can claim and improve.
                                    </p>
                                    <p>
                                        Proof states are intentionally conservative. Indexed, claimable, contact confirmed, document verified, and performance verified mean different things, and the page should not imply live availability unless the underlying data supports it.
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

                    <DirectoryGrid providers={providers} targetCountry={targetCountry ?? 'GLOBAL'} />
                </div>
            </HCContentSection>

            <HCContentSection pad="section_balanced_pad">
                <div className="max-w-7xl mx-auto space-y-8">
                    <section aria-labelledby="directory-role-coverage" className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                            <div>
                                <div className="text-xs font-black uppercase tracking-[0.18em] text-[#C6923A]">Role-rich discovery</div>
                                <h2 id="directory-role-coverage" className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-gray-950">Find support by role, job intent, and proof state</h2>
                                <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
                                    These are role families and support categories, not fake live availability claims. Each click should either return matching records or create a useful demand signal and claim path.
                                </p>
                            </div>
                            <Link href="/claim" className="inline-flex w-fit items-center rounded-lg bg-gray-950 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-gray-800">
                                Build or improve a profile
                            </Link>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {roleBrowseOptions.slice(0, 60).map((role) => (
                                <Link
                                    key={role.key}
                                    href={`/directory?q=${encodeURIComponent(role.label)}`}
                                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm font-bold text-gray-800 transition-colors hover:border-[#C6923A] hover:bg-amber-50"
                                >
                                    <span className="block">{role.label}</span>
                                    <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.08em] text-gray-500">
                                        {role.hasSupply ? `${role.operators.toLocaleString()} records` : 'capture demand'}
                                    </span>
                                </Link>
                            ))}
                        </div>
                        {roleBrowseOptions.length > 60 && (
                            <p className="mt-4 text-xs font-bold text-gray-500">
                                Showing the first 60 role surfaces from the live role registry. Use search to reach the full {roleBrowseOptions.length.toLocaleString()}-role catalog.
                            </p>
                        )}
                    </section>

                    <section aria-labelledby="country-coverage" className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7 shadow-sm">
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-[#C6923A]">Global coverage model</div>
                        <h2 id="country-coverage" className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-gray-950">Browse the 120-country heavy haul support graph</h2>
                        <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-600">
                            Haul Command should show all target countries while labeling market maturity honestly. A country link can still be useful even when coverage is developing because it captures demand, corrections, provider suggestions, sponsor interest, and partner applications.
                        </p>
                        <div className="mt-6 space-y-5">
                            {countryTiers.map((tier) => (
                                <div key={tier.title} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                    <h3 className="text-sm font-black uppercase tracking-wide text-gray-700">{tier.title}</h3>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {tier.codes.map(([code, name]) => (
                                            <Link
                                                key={code}
                                                href={`/directory?country=${code}`}
                                                className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${targetCountry === code ? 'border-[#C6923A] bg-[#C6923A] text-black' : 'border-gray-200 bg-white text-gray-700 hover:border-[#C6923A] hover:bg-amber-50'}`}
                                            >
                                                {name} <span className="text-gray-400">{code}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section aria-labelledby="sponsor-moments" className="rounded-2xl border border-gray-200 bg-white p-5 md:p-7 shadow-sm">
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-[#C6923A]">AdGrid inventory</div>
                        <h2 id="sponsor-moments" className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-gray-950">Sponsor the exact support moment buyers are searching</h2>
                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                            {[
                                ['Market sponsor', 'City, state, province, or country visibility when buyers are comparing local support density.'],
                                ['Role sponsor', 'Native placement beside searches for escort, repair, parking, permit, broker, or supplier support.'],
                                ['Route sponsor', 'Corridor and move-planning visibility before a broker builds the support packet.'],
                                ['Emergency support sponsor', 'Labeled inventory for urgent repair, staging, parking, and field-support moments.'],
                            ].map(([title, body]) => (
                                <div key={title} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                    <h3 className="text-sm font-black text-gray-950">{title}</h3>
                                    <p className="mt-2 text-xs leading-5 text-gray-600">{body}</p>
                                </div>
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
