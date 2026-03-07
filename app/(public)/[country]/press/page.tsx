import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Metadata } from 'next';
import { Newspaper, BarChart3, AlertTriangle, ExternalLink, ChevronRight, TrendingUp, MapPin, Shield } from 'lucide-react';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com';

interface Props {
    params: Promise<{ country: string }>;
}

/* ──── Country display names ──── */
const COUNTRY_NAMES: Record<string, string> = {
    US: 'United States', CA: 'Canada', AU: 'Australia', GB: 'United Kingdom',
    NZ: 'New Zealand', IE: 'Ireland', ZA: 'South Africa', NL: 'Netherlands',
    DE: 'Germany', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland',
    BE: 'Belgium', AT: 'Austria', CH: 'Switzerland', ES: 'Spain', FR: 'France',
    IT: 'Italy', PT: 'Portugal', PL: 'Poland', CZ: 'Czech Republic', SK: 'Slovakia',
    HU: 'Hungary', SI: 'Slovenia', EE: 'Estonia', LV: 'Latvia', LT: 'Lithuania',
    HR: 'Croatia', RO: 'Romania', BG: 'Bulgaria', GR: 'Greece', TR: 'Turkey',
    AE: 'UAE', SA: 'Saudi Arabia', QA: 'Qatar', KW: 'Kuwait', OM: 'Oman', BH: 'Bahrain',
    SG: 'Singapore', MY: 'Malaysia', JP: 'Japan', KR: 'South Korea',
    CL: 'Chile', MX: 'Mexico', BR: 'Brazil', AR: 'Argentina', CO: 'Colombia',
    PE: 'Peru', UY: 'Uruguay', PA: 'Panama', CR: 'Costa Rica',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { country } = await params;
    const name = COUNTRY_NAMES[country.toUpperCase()] ?? country.toUpperCase();
    const title = `${name} Press Hub — Oversize Transport Market Intelligence | Haul Command`;
    const description = `${name} escort market rates, corridor difficulty scores, seasonal alerts, and compliance intelligence. Cite our data with full attribution.`;

    return {
        title,
        description,
        alternates: { canonical: `${SITE}/${country}/press` },
        openGraph: { title, description, url: `${SITE}/${country}/press`, type: 'website' },
    };
}

export default async function PressHubPage({ params }: Props) {
    const { country } = await params;
    const supabase = createClient();
    const countryUpper = country.toUpperCase();
    const countryName = COUNTRY_NAMES[countryUpper] ?? countryUpper;

    // Fetch jurisdiction count
    const { count: jurisdictionCount } = await supabase
        .from('authority_jurisdictions')
        .select('id', { count: 'exact', head: true })
        .eq('country_code', countryUpper);

    // Fetch recent backlink hits
    const { data: recentBacklinks } = await supabase
        .from('pr_backlink_hits')
        .select('source_domain, target_url, anchor_text, first_seen_at')
        .eq('country_iso2', countryUpper)
        .eq('is_active', true)
        .order('first_seen_at', { ascending: false })
        .limit(5);

    const breadcrumbs = [
        { name: 'Home', href: '/' },
        { name: countryName, href: `/authority/${country}` },
        { name: 'Press Hub', href: `/${country}/press` },
    ];

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                itemListElement: breadcrumbs.map((b, i) => ({
                    '@type': 'ListItem', position: i + 1, name: b.name, item: `${SITE}${b.href}`,
                })),
            },
            {
                '@type': 'WebPage',
                name: `${countryName} Press Hub`,
                url: `${SITE}/${country}/press`,
                description: `${countryName} oversize transport market intelligence, data reports, and media resources.`,
                publisher: {
                    '@type': 'Organization',
                    name: 'Haul Command',
                    url: SITE,
                },
            },
            {
                '@type': 'Dataset',
                name: `${countryName} Escort Market Intelligence`,
                description: `Market rates, corridor difficulty, availability, and compliance data for ${countryName}.`,
                url: `${SITE}/${country}/press/reports`,
                creator: { '@type': 'Organization', name: 'Haul Command' },
                temporalCoverage: `2025/..`,
                license: `${SITE}/terms`,
            },
        ],
    };

    /* ─── Data Desk Reports (preset, data fills as volume grows) ─── */
    const reports = [
        {
            id: 'escort-rate-index',
            icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
            title: 'Escort Market Rate Index',
            cadence: 'Weekly',
            description: `Average escort rates by corridor and metro tier in ${countryName}.`,
            status: 'estimate',
        },
        {
            id: 'permit-burden',
            icon: <Shield className="w-6 h-6 text-blue-400" />,
            title: 'Permit Burden Score',
            cadence: 'Monthly',
            description: `How hard is it to get a permit in each ${countryName} jurisdiction?`,
            status: 'estimate',
        },
        {
            id: 'corridor-difficulty',
            icon: <MapPin className="w-6 h-6 text-amber-400" />,
            title: 'Corridor Difficulty Score',
            cadence: 'Weekly',
            description: `Complexity ratings for major oversize transport corridors in ${countryName}.`,
            status: 'estimate',
        },
        {
            id: 'availability-heatmap',
            icon: <BarChart3 className="w-6 h-6 text-purple-400" />,
            title: 'Availability Heatmap',
            cadence: 'Daily',
            description: `Where are escorts available — and where is coverage thin?`,
            status: 'estimate',
        },
        {
            id: 'seasonal-alerts',
            icon: <AlertTriangle className="w-6 h-6 text-orange-400" />,
            title: 'Seasonal Routing Alerts',
            cadence: 'Daily',
            description: `Movement bans, holiday restrictions, and weather-related closures.`,
            status: 'active',
        },
    ];

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <main className="min-h-screen bg-slate-900 text-slate-50">
                {/* Hero */}
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border-b border-slate-700/50 py-16 px-4">
                    <div className="max-w-5xl mx-auto">
                        <nav aria-label="Breadcrumb" className="mb-6">
                            <ol className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
                                {breadcrumbs.map((b, i) => (
                                    <li key={b.href} className="flex items-center gap-2">
                                        {i > 0 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                                        {i === breadcrumbs.length - 1
                                            ? <span className="text-slate-300">{b.name}</span>
                                            : <Link href={b.href} className="hover:text-amber-400 transition-colors">{b.name}</Link>
                                        }
                                    </li>
                                ))}
                            </ol>
                        </nav>

                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                                <Newspaper className="w-3.5 h-3.5" /> Press Hub
                            </div>
                            {jurisdictionCount && jurisdictionCount > 0 && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700/50 border border-slate-600 text-slate-300 text-xs font-semibold">
                                    {jurisdictionCount} Jurisdictions Tracked
                                </div>
                            )}
                        </div>

                        <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
                            {countryName} Press Hub
                        </h1>
                        <p className="text-xl text-slate-400 max-w-3xl">
                            Market intelligence, compliance data, and media resources for {countryName}&apos;s oversize transport industry.
                            All data is citable with full attribution.
                        </p>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
                    {/* Data Desk Reports */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-2">Data Desk Reports</h2>
                        <p className="text-slate-400 mb-6">
                            Repeatable market intelligence — updated on schedule, fully citable.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {reports.map(r => (
                                <div key={r.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 hover:border-indigo-500/30 transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        {r.icon}
                                        <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">
                                            {r.cadence}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">{r.title}</h3>
                                    <p className="text-sm text-slate-400 mb-4">{r.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${r.status === 'active'
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                            }`}>
                                            {r.status === 'active' ? 'Live Data' : 'Estimates'}
                                        </span>
                                        <Link
                                            href={`/${country}/press/reports#${r.id}`}
                                            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                        >
                                            View Report →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Citation & Attribution */}
                    <section className="bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-indigo-500/20 rounded-xl p-8">
                        <h2 className="text-2xl font-bold text-white mb-4">Cite Our Data</h2>
                        <p className="text-slate-400 mb-6">
                            All Haul Command market intelligence is free to cite with proper attribution.
                        </p>
                        <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-300 mb-4">
                            Data via{' '}
                            <span className="text-amber-400">Haul Command Market Intelligence</span>
                            {' '}—{' '}
                            <span className="text-indigo-400">{SITE}/{country}/press</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4">
                                <h3 className="text-white font-semibold mb-2">For Journalists</h3>
                                <p className="text-slate-400 text-xs mb-3">
                                    Need a quote, stat, or expert commentary? Request it directly.
                                </p>
                                <Link
                                    href={`/${country}/press/media-kit`}
                                    className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold transition-colors"
                                >
                                    Download Media Kit →
                                </Link>
                            </div>
                            <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4">
                                <h3 className="text-white font-semibold mb-2">Embed Our Data</h3>
                                <p className="text-slate-400 text-xs mb-3">
                                    Rate cards, corridor difficulty widgets, and seasonal alerts — ready to embed.
                                </p>
                                <Link
                                    href="/embed"
                                    className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold transition-colors"
                                >
                                    Browse Widgets →
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Recent Backlinks */}
                    {recentBacklinks && recentBacklinks.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <ExternalLink className="w-5 h-5 text-emerald-400" />
                                Recent Citations
                            </h2>
                            <div className="bg-slate-800/40 border border-slate-700 rounded-xl divide-y divide-slate-700/50">
                                {recentBacklinks.map((bl, i) => (
                                    <div key={i} className="px-6 py-4 flex items-center gap-4">
                                        <span className="text-xs text-slate-600 font-mono shrink-0">
                                            {new Date(bl.first_seen_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm text-white">{bl.source_domain}</span>
                                            {bl.anchor_text && (
                                                <span className="text-xs text-slate-500 ml-2">&quot;{bl.anchor_text}&quot;</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Authority Directory CTA */}
                    <section className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-8 text-center">
                        <h2 className="text-2xl font-bold text-white mb-3">
                            Explore {countryName} Compliance Hub
                        </h2>
                        <p className="text-slate-400 mb-6">
                            {jurisdictionCount ?? 0}+ jurisdictions with verified permit rules, escort thresholds, and authority contacts.
                        </p>
                        <Link
                            href={`/authority/${country}`}
                            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-3 rounded-lg transition-colors"
                        >
                            Browse Authority Directory →
                        </Link>
                    </section>
                </div>
            </main>
        </>
    );
}
