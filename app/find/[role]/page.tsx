import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

interface Props {
    params: Promise<{ role: string }>;
}

// Must stay in sync with find/[role]/[city]/page.tsx ROLE_MAP
const ROLE_MAP: Record<string, {
    label: string; plural: string; icon: string;
    intent: string; desc: string;
    ctaLabel: string; ctaHref: string; claimLabel: string;
    color: string;
}> = {
    'pilot-car-operator': {
        label: 'Pilot Car Operator', plural: 'Pilot Car Operators', icon: '🚗',
        intent: 'Find pilot car jobs and grow your escort business',
        desc: 'Find verified pilot car operators available in any US city. Browse by location, check rates, and connect directly.',
        ctaLabel: 'Browse Escort Jobs', ctaHref: '/loads',
        claimLabel: 'Claim Your Pilot Car Profile', color: '#D4A844',
    },
    'escort-driver': {
        label: 'Escort Driver', plural: 'Escort Drivers', icon: '🚕',
        intent: 'Find escort driver jobs in your area',
        desc: 'Verified escort drivers available for oversize load coverage. Search by city for immediate availability.',
        ctaLabel: 'Find Escort Driver Jobs', ctaHref: '/loads',
        claimLabel: 'List as Escort Driver', color: '#F59E0B',
    },
    'heavy-haul-broker': {
        label: 'Heavy Haul Broker', plural: 'Heavy Haul Brokers', icon: '📋',
        intent: 'Find a broker for your oversize load',
        desc: 'Connect with heavy haul brokers who can coordinate your oversize load movement from permit to delivery.',
        ctaLabel: 'Post a Load Needing a Broker', ctaHref: '/loads/new',
        claimLabel: 'Register as a Broker', color: '#3B82F6',
    },
    'oversize-carrier': {
        label: 'Oversize Carrier', plural: 'Oversize Carriers', icon: '🚛',
        intent: 'Find escorts for your oversize loads',
        desc: 'Verified oversize carriers available for flatbed, lowboy, and superload moves. Browse by market.',
        ctaLabel: 'Find Escorts for My Load', ctaHref: '/directory',
        claimLabel: 'List Your Carrier Company', color: '#8B5CF6',
    },
    'permit-service': {
        label: 'Permit Service', plural: 'Permit Services', icon: '📄',
        intent: 'Find a permit service in your state',
        desc: 'Permit services that handle oversize load permits across all US states. Find one in your market.',
        ctaLabel: 'List Your Permit Service', ctaHref: '/claim',
        claimLabel: 'Claim Permit Service Listing', color: '#10B981',
    },
    'route-surveyor': {
        label: 'Route Surveyor', plural: 'Route Surveyors', icon: '🗺️',
        intent: 'Find route survey work in your area',
        desc: 'Route surveyors providing pre-move surveys for oversize loads. Find survey professionals by city.',
        ctaLabel: 'Find Route Survey Jobs', ctaHref: '/jobs/route-survey',
        claimLabel: 'List as Route Surveyor', color: '#06B6D4',
    },
};

// City grid — mirrors CITY_MAP in find/[role]/[city]/page.tsx
const CITIES = [
    { slug: 'houston-tx', name: 'Houston', state: 'TX' },
    { slug: 'dallas-tx', name: 'Dallas', state: 'TX' },
    { slug: 'san-antonio-tx', name: 'San Antonio', state: 'TX' },
    { slug: 'los-angeles-ca', name: 'Los Angeles', state: 'CA' },
    { slug: 'phoenix-az', name: 'Phoenix', state: 'AZ' },
    { slug: 'chicago-il', name: 'Chicago', state: 'IL' },
    { slug: 'atlanta-ga', name: 'Atlanta', state: 'GA' },
    { slug: 'denver-co', name: 'Denver', state: 'CO' },
    { slug: 'oklahoma-city-ok', name: 'Oklahoma City', state: 'OK' },
    { slug: 'baton-rouge-la', name: 'Baton Rouge', state: 'LA' },
    { slug: 'minneapolis-mn', name: 'Minneapolis', state: 'MN' },
    { slug: 'kansas-city-mo', name: 'Kansas City', state: 'MO' },
    { slug: 'nashville-tn', name: 'Nashville', state: 'TN' },
    { slug: 'charlotte-nc', name: 'Charlotte', state: 'NC' },
    { slug: 'columbus-oh', name: 'Columbus', state: 'OH' },
    { slug: 'jacksonville-fl', name: 'Jacksonville', state: 'FL' },
    { slug: 'seattle-wa', name: 'Seattle', state: 'WA' },
    { slug: 'portland-or', name: 'Portland', state: 'OR' },
    { slug: 'billings-mt', name: 'Billings', state: 'MT' },
    { slug: 'albuquerque-nm', name: 'Albuquerque', state: 'NM' },
    { slug: 'memphis-tn', name: 'Memphis', state: 'TN' },
    { slug: 'louisville-ky', name: 'Louisville', state: 'KY' },
    { slug: 'indianapolis-in', name: 'Indianapolis', state: 'IN' },
    { slug: 'san-diego-ca', name: 'San Diego', state: 'CA' },
    { slug: 'new-orleans-la', name: 'New Orleans', state: 'LA' },
    { slug: 'el-paso-tx', name: 'El Paso', state: 'TX' },
    { slug: 'richmond-va', name: 'Richmond', state: 'VA' },
    { slug: 'salt-lake-city-ut', name: 'Salt Lake City', state: 'UT' },
    { slug: 'pittsburgh-pa', name: 'Pittsburgh', state: 'PA' },
    { slug: 'tucson-az', name: 'Tucson', state: 'AZ' },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { role } = await params;
    const r = ROLE_MAP[role];
    if (!r) return { title: 'Not Found' };
    const title = `Find ${r.plural} by City | Haul Command`;
    const description = `Browse verified ${r.plural.toLowerCase()} in 30 major US cities. ${r.desc}`;
    return {
        title,
        description,
        alternates: { canonical: `https://www.haulcommand.com/find/${role}` },
        openGraph: { title, description, type: 'website' },
    };
}

export default async function RoleIndexPage({ params }: Props) {
    const { role } = await params;
    const r = ROLE_MAP[role];
    if (!r) return notFound();

    const schema = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'ItemList',
                name: `${r.plural} by City`,
                description: r.desc,
                url: `https://www.haulcommand.com/find/${role}`,
                numberOfItems: CITIES.length,
                itemListElement: CITIES.map((c, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    name: `${r.plural} in ${c.name}, ${c.state}`,
                    url: `https://www.haulcommand.com/find/${role}/${c.slug}`,
                })),
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
                    { '@type': 'ListItem', position: 2, name: 'Find', item: 'https://www.haulcommand.com/find' },
                    { '@type': 'ListItem', position: 3, name: r.plural, item: `https://www.haulcommand.com/find/${role}` },
                ],
            },
        ],
    };

    return (
        <div style={{ minHeight: '100vh', background: '#06080f', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

            <ProofStrip variant="bar" />

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 20px 5rem' }}>

                {/* Breadcrumb */}
                <nav style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 28, fontSize: 11, color: '#6b7280', flexWrap: 'wrap', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
                    <span>/</span>
                    <Link href="/directory" style={{ color: '#6b7280', textDecoration: 'none' }}>Directory</Link>
                    <span>/</span>
                    <span style={{ color: r.color }}>{r.plural}</span>
                </nav>

                {/* Hero */}
                <div style={{ marginBottom: 36 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                        <span style={{ fontSize: 42 }}>{r.icon}</span>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, color: '#f9fafb' }}>
                                Find {r.plural}
                            </h1>
                            <p style={{ margin: '6px 0 0', color: '#6B7280', fontSize: 14, lineHeight: 1.6, maxWidth: 560 }}>
                                {r.desc}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                        <Link href={r.ctaHref}
                            style={{ padding: '10px 22px', background: `linear-gradient(135deg, ${r.color}, ${r.color}cc)`, borderRadius: 10, color: r.color === '#D4A844' ? '#000' : '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                            {r.ctaLabel} →
                        </Link>
                        <Link href="/claim"
                            style={{ padding: '10px 22px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, color: '#22C55E', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                            {r.claimLabel} — Free →
                        </Link>
                    </div>
                </div>

                {/* City Grid */}
                <div style={{ marginBottom: 36 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                        Browse {r.plural} by City — {CITIES.length} Markets
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                        {CITIES.map(c => (
                            <Link key={c.slug} href={`/find/${role}/${c.slug}`}
                                style={{ display: 'flex', flexDirection: 'column', padding: '13px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none', transition: 'border-color 0.2s' }}>
                                <span style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb', marginBottom: 2 }}>{c.name}</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: r.color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{c.state}</span>
                                <span style={{ fontSize: 10, color: '#6b7280', marginTop: 6, fontWeight: 600 }}>View {r.plural} →</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Claim CTA */}
                <div style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 14, padding: '20px 24px', marginBottom: 28 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb', marginBottom: 6 }}>
                        Are you a {r.label}?
                    </div>
                    <p style={{ margin: '0 0 14px', fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>
                        Claim your profile to appear in these searches. Free forever — no credit card required.
                    </p>
                    <Link href="/claim"
                        style={{ display: 'inline-block', padding: '9px 20px', background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: 9, color: '#000', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                        {r.claimLabel} — Free →
                    </Link>
                </div>

                {/* Internal link mesh */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                    <Link href="/glossary/pilot-car" style={{ padding: '7px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, fontSize: 11, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>📖 What Is a Pilot Car?</Link>
                    <Link href="/tools/escort-calculator" style={{ padding: '7px 12px', background: 'rgba(212,168,68,0.07)', border: '1px solid rgba(212,168,68,0.18)', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#D4A844', textDecoration: 'none' }}>🧮 Escort Calculator</Link>
                    <Link href="/escort-requirements" style={{ padding: '7px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, fontSize: 11, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>⚖️ State Rules</Link>
                    <Link href="/directory" style={{ padding: '7px 12px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#22C55E', textDecoration: 'none' }}>🔍 Full Directory</Link>
                </div>

                {/* No Dead End */}
                <NoDeadEndBlock
                    heading={`Find ${r.plural} Nationwide`}
                    moves={[
                        { href: r.ctaHref, icon: r.icon, title: r.ctaLabel, desc: 'Active immediately', primary: true, color: r.color },
                        { href: '/claim', icon: '✓', title: r.claimLabel, desc: 'Free forever', primary: true, color: '#22C55E' },
                        { href: '/available-now', icon: '🟢', title: 'Available Right Now', desc: 'Live operator availability' },
                        { href: '/tools/escort-calculator', icon: '🧮', title: 'Escort Calculator', desc: 'How many vehicles?' },
                        { href: '/escort-requirements', icon: '⚖️', title: 'State Escort Rules', desc: 'Requirements by state' },
                        { href: '/pricing', icon: '💎', title: 'Pro Placement', desc: 'Priority in search results' },
                    ]}
                />
            </div>
        </div>
    );
}

export async function generateStaticParams() {
    return Object.keys(ROLE_MAP).map(role => ({ role }));
    // 6 pages: pilot-car-operator, escort-driver, heavy-haul-broker, oversize-carrier, permit-service, route-surveyor
}
