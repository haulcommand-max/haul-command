import type { Metadata } from 'next';
import Link from 'next/link';
import CheckoutButton from './CheckoutButton';

export const metadata: Metadata = {
    title: 'Buy Directory Sponsor Ads | Haul Command AdGrid',
    description:
        'Buy labeled Haul Command AdGrid placements for heavy-haul directory, corridor, role, and tool pages. Reach industry buyers without broad consumer traffic.',
    alternates: { canonical: 'https://www.haulcommand.com/advertise/buy' },
    openGraph: {
        title: 'Buy Directory Sponsor Ads | Haul Command AdGrid',
        description:
            'Sponsor heavy-haul directory demand across source-backed operator records, corridor pages, tool pages, and market surfaces.',
        url: 'https://www.haulcommand.com/advertise/buy',
        siteName: 'Haul Command',
        type: 'website',
    },
};

const CAMPAIGN_TYPES = [
    {
        id: 'cpc',
        eyebrow: 'Best first campaign',
        name: 'Directory Sponsor CPC',
        price: 'From $0.75/click',
        period: 'Pay as you go',
        color: '#3b82f6',
        summary:
            'Buy labeled sponsor placement on directory, role, corridor, and tool surfaces where heavy-haul buyers already search.',
        features: [
            'Target by state, corridor, country, role, or support category',
            'Appear beside directory searches, market pages, and high-intent tools',
            'Control budget, pause spend, and track clicks from one dashboard',
            'Useful for equipment, insurance, training, permit, and service vendors',
        ],
        bestFor: 'Testing a market before buying exclusive territory',
        cta: 'Launch CPC Campaign',
        href: '/advertise/book?zone=directory_sponsor&type=cpc',
    },
    {
        id: 'corridor',
        eyebrow: 'Route ownership',
        name: 'Corridor Sponsorship',
        price: '$199/mo',
        period: 'Monthly, annual available',
        color: '#D4A843',
        summary:
            'Own named placement around a specific freight corridor, route-intel surface, or corridor-related directory result.',
        features: [
            'Labeled sponsor slot on a named corridor page',
            'Visibility around searches touching that corridor',
            'Sponsor badge for corridor-relevant directory appearances',
            'Monthly market report with search and click activity',
        ],
        bestFor: 'Operators and vendors with a strong route footprint',
        cta: 'Claim a Corridor',
        href: '/advertise/territory?type=corridor',
    },
    {
        id: 'territory',
        eyebrow: 'Market lock',
        name: 'Territory Sponsor',
        price: '$149-$499/mo',
        period: 'Varies by market tier',
        color: '#22c55e',
        summary:
            'Reserve sponsor visibility for a state, country, or priority market while Haul Command grows local supply and demand.',
        features: [
            'Territory placement across directory and near-me surfaces',
            'Priority sponsor presence for local role and category searches',
            'Monthly territory report with demand, density, and lead signals',
            'First-mover pricing lock where inventory is available',
        ],
        bestFor: 'Companies expanding into Florida, US states, Canada, or Tier A countries',
        cta: 'View Territory Pricing',
        href: '/advertise/territory',
    },
    {
        id: 'enterprise',
        eyebrow: 'Managed growth',
        name: 'Enterprise Market Package',
        price: 'Custom',
        period: 'Annual or market plan',
        color: '#8b5cf6',
        summary:
            'Build a managed sponsor program across countries, role groups, corridors, data products, and launch markets.',
        features: [
            'Multi-state or multi-country sponsor bundles',
            'Custom landing pages and account-based campaign routing',
            'Quarterly business reviews with market intelligence',
            'Optional API and data-product packaging for enterprise teams',
        ],
        bestFor: 'National carriers, insurers, logistics platforms, and global vendors',
        cta: 'Talk to Sales',
        href: '/contact?subject=enterprise-adgrid',
    },
];

const TRUST_STATS = [
    { value: 'Source-backed', label: 'directory records', note: 'Directory records are designed to be claimable and proof-aware.' },
    { value: '120', label: 'country coverage model', note: 'Global structure exists without claiming every market is live.' },
    { value: '51', label: 'corridor surfaces', note: 'Route pages connect directory, tools, and sponsor inventory.' },
    { value: 'Labeled', label: 'paid placement', note: 'Sponsor inventory is clearly marked to protect trust.' },
];

const PLACEMENT_SURFACES = [
    'Directory search results',
    'Country and state market pages',
    'Role and category pages',
    'Corridor intelligence pages',
    'Tool results and support packets',
    'Profile and report-card surfaces',
];

const FAQS = [
    {
        question: 'What is a Haul Command Directory Sponsor?',
        answer:
            'A Directory Sponsor is a clearly labeled paid placement that appears around heavy-haul directory searches, role pages, corridor pages, and tool surfaces. It is built for industry traffic, not broad consumer advertising.',
    },
    {
        question: 'Can I target Florida first?',
        answer:
            'Yes. Florida is the first active monetization market. Campaigns can target Florida, specific US states, corridors, countries, or role categories as inventory becomes available.',
    },
    {
        question: 'Are sponsor placements the same as verified listings?',
        answer:
            'No. Sponsorship buys visibility. Verification, claim status, reviews, and source confidence remain separate trust signals so paid placement does not replace proof.',
    },
    {
        question: 'Can I pause or change a campaign?',
        answer:
            'Self-serve CPC campaigns can be paused or adjusted. Corridor and territory sponsorships depend on market availability and the term selected at checkout or approval.',
    },
];

const jsonLd = [
    {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Buy Directory Sponsor Ads on Haul Command',
        url: 'https://www.haulcommand.com/advertise/buy',
        description:
            'Buy labeled AdGrid sponsor placements on heavy-haul directory, corridor, role, and tool pages.',
        isPartOf: {
            '@type': 'WebSite',
            name: 'Haul Command',
            url: 'https://www.haulcommand.com',
        },
    },
    {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Haul Command AdGrid Directory Sponsorship',
        serviceType: 'B2B directory advertising',
        provider: {
            '@type': 'Organization',
            name: 'Haul Command',
            url: 'https://www.haulcommand.com',
        },
        areaServed: ['United States', 'Canada', 'Australia', 'United Kingdom', 'Global heavy-haul markets'],
        offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'USD',
            lowPrice: '0.75',
            highPrice: '499',
            offerCount: CAMPAIGN_TYPES.length,
            availability: 'https://schema.org/InStock',
        },
    },
    {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQS.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    },
];

type SponsorSearchParams = Record<string, string | string[] | undefined>;

function getParam(params: SponsorSearchParams | undefined, key: string): string {
    const value = params?.[key];
    return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function normalizeSponsorContext(params: SponsorSearchParams | undefined) {
    const zone = getParam(params, 'zone') || getParam(params, 'placement') || 'directory_sponsor';
    const country = getParam(params, 'country').toUpperCase();
    const corridor = getParam(params, 'corridor');
    const role = getParam(params, 'role');
    const category = getParam(params, 'category') || getParam(params, 'topic');
    const source = getParam(params, 'source') || getParam(params, 'slot') || getParam(params, 'goal');

    const recommendedCampaignId =
        zone.includes('corridor') || corridor
            ? 'corridor'
            : zone.includes('country') || zone.includes('territory') || country
                ? 'territory'
                : zone.includes('directory') || role || category
                    ? 'cpc'
                    : 'enterprise';

    const contextLabel = [
        zone ? `zone ${zone}` : null,
        country ? `country ${country}` : null,
        corridor ? `corridor ${corridor}` : null,
        role ? `role ${role}` : null,
        category ? `category ${category}` : null,
    ].filter(Boolean).join(' / ');

    return {
        zone,
        country,
        corridor,
        role,
        category,
        source,
        recommendedCampaignId,
        contextLabel: contextLabel || 'general AdGrid sponsor interest',
    };
}

function appendSponsorContext(href: string, context: ReturnType<typeof normalizeSponsorContext>): string {
    const [path, query = ''] = href.split('?');
    const params = new URLSearchParams(query);
    if (context.zone) params.set('zone', context.zone);
    if (context.country) params.set('country', context.country);
    if (context.corridor) params.set('corridor', context.corridor);
    if (context.role) params.set('role', context.role);
    if (context.category) params.set('category', context.category);
    if (context.source) params.set('source', context.source);
    const suffix = params.toString();
    return suffix ? `${path}?${suffix}` : path;
}

export default async function AdvertiseBuyPage({
    searchParams,
}: {
    searchParams?: Promise<SponsorSearchParams>;
}) {
    const params = await searchParams;
    const sponsorContext = normalizeSponsorContext(params);
    const campaignTypes = [...CAMPAIGN_TYPES].sort((a, b) => {
        if (a.id === sponsorContext.recommendedCampaignId) return -1;
        if (b.id === sponsorContext.recommendedCampaignId) return 1;
        return 0;
    });

    return (
        <div className="min-h-screen bg-transparent text-slate-100">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <section className="border-b border-[#C6923A]/15">
                <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
                    <div>
                        <Link
                            href="/advertise"
                            className="mb-5 inline-flex rounded-md border border-[#C6923A]/25 bg-black/40 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#F2B84B] no-underline"
                        >
                            AdGrid self-serve buying page
                        </Link>
                        <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal text-white sm:text-5xl">
                            Sponsor heavy-haul directory demand before your competitors own the market.
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
                            Buy labeled placements around Haul Command directory searches, corridor pages,
                            role pages, and planning tools. Start with Florida, expand into the United
                            States, then follow actual demand, claimed listings, and paid market signals.
                        </p>
                        <div className="mt-5 rounded-md border border-[#C6923A]/25 bg-[#C6923A]/10 p-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#F2B84B]">
                                Recommended starting point
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">
                                Start with <span className="font-bold text-white">
                                    {CAMPAIGN_TYPES.find((campaign) => campaign.id === sponsorContext.recommendedCampaignId)?.name}
                                </span>.
                                Market signal: <span className="text-[#F2B84B]">{sponsorContext.contextLabel}</span>.
                            </p>
                        </div>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                href="#campaign-options"
                                className="rounded-md bg-[#F5A812] px-5 py-3 text-sm font-black text-black no-underline"
                            >
                                Compare Campaigns
                            </Link>
                            <Link
                                href="/advertise/territory"
                                className="rounded-md border border-[#C6923A]/35 bg-black/45 px-5 py-3 text-sm font-bold text-[#F2B84B] no-underline"
                            >
                                Check Territory Pricing
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-lg border border-[#C6923A]/20 bg-black/55 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#F2B84B]">
                            Proof-safe sponsor surface
                        </p>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            {TRUST_STATS.map((stat) => (
                                <div key={stat.label} className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                                    <div className="text-2xl font-black text-[#F5A812]">{stat.value}</div>
                                    <div className="mt-1 text-sm font-bold text-white">{stat.label}</div>
                                    <p className="mt-2 text-xs leading-5 text-slate-400">{stat.note}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section id="campaign-options" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#F2B84B]">
                            Campaign options
                        </p>
                        <h2 className="mt-2 text-2xl font-black text-white">Pick the buying motion that matches your market.</h2>
                    </div>
                    <p className="max-w-xl text-sm leading-6 text-slate-400">
                        Paid placement is labeled. Claim status, verification, ratings, and source confidence stay separate.
                    </p>
                </div>

                <div className="grid gap-5 lg:grid-cols-4">
                    {campaignTypes.map((campaign) => {
                        const isRecommended = campaign.id === sponsorContext.recommendedCampaignId;
                        return (
                        <article
                            key={campaign.id}
                            className="flex min-h-[410px] flex-col rounded-lg border bg-[#111114]/90 p-5"
                            style={{
                                borderTopColor: campaign.color,
                                borderColor: isRecommended ? `${campaign.color}99` : 'rgba(255,255,255,0.10)',
                                boxShadow: isRecommended ? `0 0 0 1px ${campaign.color}33, 0 20px 70px rgba(0,0,0,0.35)` : undefined,
                            }}
                        >
                            <p className="text-[11px] font-black uppercase tracking-[0.1em]" style={{ color: campaign.color }}>
                                {isRecommended ? 'Recommended for this click' : campaign.eyebrow}
                            </p>
                            <h3 className="mt-3 text-lg font-black text-white">{campaign.name}</h3>
                            <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-400">{campaign.summary}</p>
                            <div className="mt-5">
                                <span className="text-2xl font-black" style={{ color: campaign.color }}>
                                    {campaign.price}
                                </span>
                                <span className="ml-2 text-xs text-slate-500">{campaign.period}</span>
                            </div>
                            <ul className="mt-5 flex flex-1 flex-col gap-2">
                                {campaign.features.map((feature) => (
                                    <li key={feature} className="flex gap-2 text-sm leading-5 text-slate-300">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: campaign.color }} />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                                Best for: {campaign.bestFor}
                            </p>
                            <div className="mt-4">
                                <CheckoutButton
                                    campaignId={campaign.id}
                                    price={campaign.price}
                                    color={campaign.color}
                                    label={campaign.cta}
                                    href={appendSponsorContext(campaign.href, sponsorContext)}
                                    context={sponsorContext}
                                />
                            </div>
                        </article>
                    )})}
                </div>
            </section>

            <section className="border-y border-[#C6923A]/15 bg-black/35">
                <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#F2B84B]">
                            Where ads can appear
                        </p>
                        <h2 className="mt-2 text-2xl font-black text-white">Buy into the surfaces where heavy-haul decisions happen.</h2>
                        <p className="mt-4 text-sm leading-6 text-slate-400">
                            AdGrid is built around operational intent: search, compare, plan, claim, match, and sponsor.
                            The buying page routes to the same directory, role, corridor, and tool universe that powers Haul Command.
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {PLACEMENT_SURFACES.map((surface) => (
                            <div key={surface} className="rounded-md border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-slate-200">
                                {surface}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                <h2 className="text-center text-2xl font-black text-white">Questions advertisers ask first</h2>
                <div className="mt-7 grid gap-4">
                    {FAQS.map((faq) => (
                        <div key={faq.question} className="rounded-lg border border-white/10 bg-[#111114]/85 p-5">
                            <h3 className="text-base font-black text-white">{faq.question}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-400">{faq.answer}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-10 rounded-lg border border-[#C6923A]/25 bg-black/55 p-6 text-center">
                    <h2 className="text-xl font-black text-white">Need a market plan before checkout?</h2>
                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                        Start with Florida or a high-demand corridor. We can map sponsor surfaces to role coverage,
                        claimed listings, buyer demand, and paid match opportunities before you commit.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-3">
                        <Link
                            href="/advertise"
                            className="rounded-md border border-[#C6923A]/35 bg-[#C6923A]/10 px-5 py-3 text-sm font-bold text-[#F2B84B] no-underline"
                        >
                            View All Advertising Options
                        </Link>
                        <Link
                            href="/contact?subject=adgrid-market-plan"
                            className="rounded-md border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white no-underline"
                        >
                            Request a Market Plan
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
