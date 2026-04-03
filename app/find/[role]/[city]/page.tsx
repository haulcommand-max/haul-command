import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { DataTeaserStrip } from '@/components/data/DataTeaserStrip';
import { UrgentMarketSponsor } from '@/components/ads/UrgentMarketSponsor';
import { TakeoverSponsorBanner } from '@/components/ads/TakeoverSponsorBanner';
import { SnippetInjector } from '@/components/seo/SnippetInjector';

interface Props {
    params: Promise<{ role: string; city: string }>;
}

// Role definitions — drives copy, CTAs, and SEO
const ROLE_MAP: Record<string, {
    label: string;
    plural: string;
    intent: string;
    icon: string;
    searchVerb: string;
    seoKeywords: string[];
    ctaLabel: string;
    ctaHref: string;
    claimLabel: string;
    dataProduct: string;
}> = {
    'pilot-car-operator': {
        label: 'Pilot Car Operator',
        plural: 'Pilot Car Operators',
        intent: 'find_work',
        icon: '🚗',
        searchVerb: 'Find Work',
        seoKeywords: ['pilot car jobs', 'escort vehicle work', 'pilot car operator near me'],
        ctaLabel: 'Find Escort Jobs Near Me',
        ctaHref: '/jobs/escort',
        claimLabel: 'Claim Your Pilot Car Profile',
        dataProduct: 'rate_intelligence',
    },
    'escort-driver': {
        label: 'Escort Driver',
        plural: 'Escort Drivers',
        intent: 'find_work',
        icon: '🚕',
        searchVerb: 'Find Jobs',
        seoKeywords: ['escort driver jobs', 'oversize load escort work', 'escort driver near me'],
        ctaLabel: 'Find Escort Driver Jobs',
        ctaHref: '/jobs/escort',
        claimLabel: 'List as Escort Driver',
        dataProduct: 'rate_intelligence',
    },
    'heavy-haul-broker': {
        label: 'Heavy Haul Broker',
        plural: 'Heavy Haul Brokers',
        intent: 'find_capacity',
        icon: '📋',
        searchVerb: 'Find Capacity',
        seoKeywords: ['heavy haul broker', 'oversize load broker', 'find escort for load'],
        ctaLabel: 'Post a Load Needing Escort',
        ctaHref: '/loads/new',
        claimLabel: 'Register as a Broker',
        dataProduct: 'corridor_intelligence',
    },
    'oversize-carrier': {
        label: 'Oversize Carrier',
        plural: 'Oversize Carriers',
        intent: 'find_escorts',
        icon: '🚛',
        searchVerb: 'Find Escorts',
        seoKeywords: ['oversize carrier', 'heavy haul carrier near me', 'wide load transport company'],
        ctaLabel: 'Find Escorts for My Load',
        ctaHref: '/directory',
        claimLabel: 'List Your Carrier Company',
        dataProduct: 'corridor_intelligence',
    },
    'permit-service': {
        label: 'Permit Service',
        plural: 'Permit Services',
        intent: 'grow_business',
        icon: '📄',
        searchVerb: 'Grow Business',
        seoKeywords: ['oversize permit service', 'oversize load permit company', 'permit expeditor near me'],
        ctaLabel: 'List Your Permit Service',
        ctaHref: '/claim',
        claimLabel: 'Claim Permit Service Listing',
        dataProduct: 'market_intelligence',
    },
    'route-surveyor': {
        label: 'Route Surveyor',
        plural: 'Route Surveyors',
        intent: 'find_work',
        icon: '🗺️',
        searchVerb: 'Find Survey Work',
        seoKeywords: ['route surveyor heavy haul', 'pilot car route survey', 'oversize route survey near me'],
        ctaLabel: 'Find Route Survey Jobs',
        ctaHref: '/jobs/route-survey',
        claimLabel: 'List as Route Surveyor',
        dataProduct: 'market_intelligence',
    },
};

// Top 30 US cities — same structure extensible to all 50 states
const CITY_MAP: Record<string, { name: string; state: string; stateCode: string; marketKey: string }> = {
    'houston-tx': { name: 'Houston', state: 'Texas', stateCode: 'TX', marketKey: 'us-tx-houston' },
    'dallas-tx': { name: 'Dallas', state: 'Texas', stateCode: 'TX', marketKey: 'us-tx-dallas' },
    'san-antonio-tx': { name: 'San Antonio', state: 'Texas', stateCode: 'TX', marketKey: 'us-tx-san-antonio' },
    'los-angeles-ca': { name: 'Los Angeles', state: 'California', stateCode: 'CA', marketKey: 'us-ca-los-angeles' },
    'phoenix-az': { name: 'Phoenix', state: 'Arizona', stateCode: 'AZ', marketKey: 'us-az-phoenix' },
    'chicago-il': { name: 'Chicago', state: 'Illinois', stateCode: 'IL', marketKey: 'us-il-chicago' },
    'atlanta-ga': { name: 'Atlanta', state: 'Georgia', stateCode: 'GA', marketKey: 'us-ga-atlanta' },
    'denver-co': { name: 'Denver', state: 'Colorado', stateCode: 'CO', marketKey: 'us-co-denver' },
    'oklahoma-city-ok': { name: 'Oklahoma City', state: 'Oklahoma', stateCode: 'OK', marketKey: 'us-ok-oklahoma-city' },
    'baton-rouge-la': { name: 'Baton Rouge', state: 'Louisiana', stateCode: 'LA', marketKey: 'us-la-baton-rouge' },
    'minneapolis-mn': { name: 'Minneapolis', state: 'Minnesota', stateCode: 'MN', marketKey: 'us-mn-minneapolis' },
    'kansas-city-mo': { name: 'Kansas City', state: 'Missouri', stateCode: 'MO', marketKey: 'us-mo-kansas-city' },
    'nashville-tn': { name: 'Nashville', state: 'Tennessee', stateCode: 'TN', marketKey: 'us-tn-nashville' },
    'charlotte-nc': { name: 'Charlotte', state: 'North Carolina', stateCode: 'NC', marketKey: 'us-nc-charlotte' },
    'columbus-oh': { name: 'Columbus', state: 'Ohio', stateCode: 'OH', marketKey: 'us-oh-columbus' },
    'jacksonville-fl': { name: 'Jacksonville', state: 'Florida', stateCode: 'FL', marketKey: 'us-fl-jacksonville' },
    'seattle-wa': { name: 'Seattle', state: 'Washington', stateCode: 'WA', marketKey: 'us-wa-seattle' },
    'portland-or': { name: 'Portland', state: 'Oregon', stateCode: 'OR', marketKey: 'us-or-portland' },
    'billings-mt': { name: 'Billings', state: 'Montana', stateCode: 'MT', marketKey: 'us-mt-billings' },
    'albuquerque-nm': { name: 'Albuquerque', state: 'New Mexico', stateCode: 'NM', marketKey: 'us-nm-albuquerque' },
    'memphis-tn': { name: 'Memphis', state: 'Tennessee', stateCode: 'TN', marketKey: 'us-tn-memphis' },
    'louisville-ky': { name: 'Louisville', state: 'Kentucky', stateCode: 'KY', marketKey: 'us-ky-louisville' },
    'indianapolis-in': { name: 'Indianapolis', state: 'Indiana', stateCode: 'IN', marketKey: 'us-in-indianapolis' },
    'san-diego-ca': { name: 'San Diego', state: 'California', stateCode: 'CA', marketKey: 'us-ca-san-diego' },
    'new-orleans-la': { name: 'New Orleans', state: 'Louisiana', stateCode: 'LA', marketKey: 'us-la-new-orleans' },
    'el-paso-tx': { name: 'El Paso', state: 'Texas', stateCode: 'TX', marketKey: 'us-tx-el-paso' },
    'richmond-va': { name: 'Richmond', state: 'Virginia', stateCode: 'VA', marketKey: 'us-va-richmond' },
    'salt-lake-city-ut': { name: 'Salt Lake City', state: 'Utah', stateCode: 'UT', marketKey: 'us-ut-salt-lake-city' },
    'pittsburgh-pa': { name: 'Pittsburgh', state: 'Pennsylvania', stateCode: 'PA', marketKey: 'us-pa-pittsburgh' },
    'tucson-az': { name: 'Tucson', state: 'Arizona', stateCode: 'AZ', marketKey: 'us-az-tucson' },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { role, city } = await params;
    const r = ROLE_MAP[role];
    const c = CITY_MAP[city];
    if (!r || !c) return { title: 'Not Found' };

    const title = `${r.plural} in ${c.name}, ${c.stateCode} | Find & Hire Locally | Haul Command`;
    const description = `Find verified ${r.plural.toLowerCase()} in ${c.name}, ${c.state}. Browse profiles, check rates, read reviews, and connect directly. ${r.seoKeywords[0]} — updated ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.`;
    return {
        title,
        description,
        alternates: { canonical: `https://www.haulcommand.com/find/${role}/${city}` },
        openGraph: { title, description, type: 'website' },
    };
}

export default async function RoleByCityPage({ params }: Props) {
    const { role, city } = await params;
    const r = ROLE_MAP[role];
    const c = CITY_MAP[city];

    if (!r || !c) return notFound();

    // Related roles for lateral navigation
    const relatedRoles = Object.entries(ROLE_MAP)
        .filter(([slug]) => slug !== role)
        .slice(0, 4);

    // Nearby cities for vertical navigation
    const sameStateCities = Object.entries(CITY_MAP)
        .filter(([slug, data]) => data.stateCode === c.stateCode && slug !== city)
        .slice(0, 5);

    return (
        <div style={{ minHeight: '100vh', background: '#08080C', color: '#F0F0F0', fontFamily: "'Inter', system-ui" }}>

            {/* JSON-LD */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                name: `${r.plural} in ${c.name}, ${c.stateCode}`,
                description: `Verified ${r.plural.toLowerCase()} available in ${c.name}, ${c.state}`,
                url: `https://www.haulcommand.com/find/${role}/${city}`,
            })}} />

            <div style={{ maxWidth: 900, margin: '0 auto', padding: '3rem 1rem 5rem' }}>

                {/* Breadcrumb */}
                <nav style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24, fontSize: 12, color: '#6B7280', flexWrap: 'wrap' }}>
                    <Link href="/directory" style={{ color: '#F1A91B', textDecoration: 'none' }}>Directory</Link>
                    <span>/</span>
                    <Link href={`/find/${role}`} style={{ color: '#F1A91B', textDecoration: 'none' }}>{r.plural}</Link>
                    <span>/</span>
                    <span style={{ color: '#F0F0F0' }}>{c.name}, {c.stateCode}</span>
                </nav>

                {/* Hero */}
                <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 36 }}>{r.icon}</span>
                        <div style={{ display: 'inline-flex', gap: 6, padding: '3px 12px', background: 'rgba(241,169,27,0.08)', border: '1px solid rgba(241,169,27,0.2)', borderRadius: 20 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: 2 }}>{r.intent.replace('_', ' ')}</span>
                        </div>
                    </div>
                    <h1 style={{ margin: 0, fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                        {r.plural} in {c.name}, {c.stateCode}
                    </h1>
                    <p style={{ marginTop: 10, color: '#6B7280', fontSize: 14, lineHeight: 1.7, maxWidth: 600 }}>
                        Find and connect with verified {r.label.toLowerCase()}s operating in {c.name}, {c.state}.
                        Browse profiles, compare rates, read reviews, and contact directly.
                    </p>

                    {/* Primary CTA */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                        <Link href={`/directory?role=${role}&city=${city}`}
                            style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', borderRadius: 10, color: '#000', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                            Browse {c.name} {r.plural} →
                        </Link>
                        <Link href={`/near/${city}`}
                            style={{ padding: '10px 22px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#F0F0F0', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                            All Services Near Me
                        </Link>
                    </div>
                </div>

                {/* AI Answer Block */}
                <div style={{ marginBottom: 28 }}>
                    <SnippetInjector
                        blocks={['quick_answer', 'faq']}
                        term={`${r.label.toLowerCase()} ${c.name}`}
                        geo={`${c.name}, ${c.stateCode}`}
                        country="US"
                    />
                </div>

                {/* Market Sponsor — city-level mode-aware */}
                <div style={{ marginBottom: 24 }}>
                    <UrgentMarketSponsor
                        marketKey={c.marketKey}
                        geo={`${c.name}, ${c.stateCode}`}
                    />
                </div>

                {/* What {role} Do in {city} */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
                    <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>
                        What {r.plural} Do in {c.name}
                    </h2>
                    <p style={{ margin: 0, color: '#9CA3AF', fontSize: 13, lineHeight: 1.7 }}>
                        {r.plural} in {c.name}, {c.state} are responsible for escorting oversize and overweight loads
                        through local roads, highways, and permit corridors. Most moves in {c.stateCode} require
                        {r.label.toLowerCase() === 'pilot car operator' ? ' state certification and insurance' : ' coordination with state DOT permits'}.
                        Demand is highest on the I-10, I-20, and industrial corridors connecting {c.name} to surrounding markets.
                    </p>
                </div>

                {/* Rates Teaser */}
                <div style={{ background: 'rgba(241,169,27,0.04)', border: '1px solid rgba(241,169,27,0.15)', borderRadius: 14, padding: '20px 24px', marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                                {c.name} Market Rates
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 900, color: '#F0F0F0' }}>
                                $3.25 – $5.80 <span style={{ fontSize: 14, color: '#6B7280', fontWeight: 400 }}>/mile</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                                🔒 Full rate intelligence, fill times &amp; operator density — Pro
                            </div>
                        </div>
                        <Link href="/data"
                            style={{ padding: '8px 18px', background: 'rgba(241,169,27,0.12)', border: '1px solid rgba(241,169,27,0.25)', borderRadius: 9, color: '#F1A91B', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                            Unlock Full Data →
                        </Link>
                    </div>
                </div>

                {/* Claim CTA */}
                <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 14, padding: '20px 24px', marginBottom: 28 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F0', marginBottom: 6 }}>
                        Are you a {r.label} in {c.name}?
                    </div>
                    <p style={{ margin: '0 0 14px', fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>
                        Claim your profile to appear in searches, receive leads, and build your verified reputation on Haul Command.
                    </p>
                    <Link href="/claim"
                        style={{ display: 'inline-block', padding: '9px 20px', background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: 9, color: '#000', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                        {r.claimLabel} — Free →
                    </Link>
                </div>

                {/* AdGrid Slot */}
                <div style={{ marginBottom: 24 }}>
                    <AdGridSlot zone="tool_sponsor" />
                </div>

                {/* Related Roles */}
                <div style={{ marginBottom: 28 }}>
                    <h2 style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                        Other Roles in {c.name}
                    </h2>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {relatedRoles.map(([slug, rd]) => (
                            <Link key={slug} href={`/find/${slug}/${city}`}
                                style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, fontSize: 11, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>
                                {rd.icon} {rd.plural}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Same State Cities */}
                {sameStateCities.length > 0 && (
                    <div style={{ marginBottom: 28 }}>
                        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                            {r.plural} in Other {c.state} Cities
                        </h2>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {sameStateCities.map(([slug, cd]) => (
                                <Link key={slug} href={`/find/${role}/${slug}`}
                                    style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, fontSize: 11, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>
                                    {cd.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* State Takeover Sponsor */}
                <div style={{ marginBottom: 24 }}>
                    <TakeoverSponsorBanner level="city" territory={c.name} pricePerMonth={199} />
                </div>

                {/* Data Teaser */}
                <DataTeaserStrip geo={`${c.name}, ${c.stateCode}`} />
            </div>
        </div>
    );
}

export async function generateStaticParams() {
    const params: { role: string; city: string }[] = [];
    for (const role of Object.keys(ROLE_MAP)) {
        for (const city of Object.keys(CITY_MAP)) {
            params.push({ role, city });
        }
    }
    return params; // 6 roles × 30 cities = 180 pages
}
