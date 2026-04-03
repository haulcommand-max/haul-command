import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { DataTeaserStrip } from '@/components/data/DataTeaserStrip';
import { SnippetInjector } from '@/components/seo/SnippetInjector';
import { UrgentMarketSponsor } from '@/components/ads/UrgentMarketSponsor';
import { TakeoverSponsorBanner } from '@/components/ads/TakeoverSponsorBanner';

interface Props {
    params: Promise<{ loadType: string }>;
}

// Load types — each is a separate SEO page family
const LOAD_TYPES: Record<string, {
    name: string;
    icon: string;
    description: string;
    weight: string;
    width: string;
    height: string;
    escortCount: string;
    topStates: string[];
    permits: string;
    specialReqs: string[];
    bestCorridors: string[];
    avgRate: string;
    ai_answer: string;
}> = {
    'wind-turbine': {
        name: 'Wind Turbine Transport',
        icon: '💨',
        description: 'Wind turbine blades, nacelles, and tower sections require specialized escort configurations due to extreme length (up to 200ft) and turning radius constraints.',
        weight: '50,000–150,000 lbs',
        width: '14–18 ft',
        height: '14–16 ft',
        escortCount: '2–4 escorts + pilot vehicles',
        topStates: ['TX', 'OK', 'MT', 'WY', 'ND', 'KS', 'IA'],
        permits: '$2,000–$8,000 per move',
        specialReqs: ['Overwidth permits all states crossed', 'Night moves often prohibited', 'Turn-by-turn route survey required', 'High-pole escort for clearance'],
        bestCorridors: ['TX→OK', 'MT→WY', 'ND→SD'],
        avgRate: '$4.50–$7.00/mi',
        ai_answer: 'Wind turbine blade moves require 2-4 pilot vehicles, an overwidth permit in every state crossed, and a complete route survey. Average cost is $4.50-$7/mile. Most states prohibit night moves for this load type.',
    },
    'oil-field-equipment': {
        name: 'Oil Field Equipment',
        icon: '🛢️',
        description: 'Drilling rigs, pump jacks, frac tanks, and heavy pressure vessels. Texas and Louisiana are the highest-volume corridors for oilfield heavy haul.',
        weight: '80,000–500,000 lbs',
        width: '12–16 ft',
        height: '14–20 ft',
        escortCount: '2–6 escorts depending on state',
        topStates: ['TX', 'LA', 'OK', 'WY', 'ND', 'CO'],
        permits: '$1,500–$12,000 per move',
        specialReqs: ['Superload designation for rigs > 200K lbs', 'MHO (major highway overweight) permit in TX', 'DOTD escort in LA', 'Engineer-signed route survey', 'Police escort in some metros'],
        bestCorridors: ['TX→LA', 'TX→OK', 'WY→CO'],
        avgRate: '$4.00–$6.50/mi',
        ai_answer: 'Oil field equipment moves in Texas require an MHO permit for loads over 80,000 lbs. Drilling rig moves need 4-6 escorts and a signed route survey. Costs range $4-$6.50/mile depending on weight.',
    },
    'construction-equipment': {
        name: 'Construction Equipment',
        icon: '🏗️',
        description: 'Cranes, excavators, scrapers, and concrete pumps. Most common oversize load type across all 50 states.',
        weight: '40,000–120,000 lbs',
        width: '12–14 ft',
        height: '13–15 ft',
        escortCount: '1–2 escorts standard',
        topStates: ['TX', 'FL', 'CA', 'OH', 'PA', 'GA'],
        permits: '$500–$3,000 per move',
        specialReqs: ['Standard oversize permit', 'Single escort under 14ft wide', '2 escorts over 14ft or in some states', 'State-specific route restrictions'],
        bestCorridors: ['FL→GA', 'OH→PA', 'TX→OK'],
        avgRate: '$3.20–$5.00/mi',
        ai_answer: 'Construction equipment moves typically need 1-2 pilot cars. A single escort is standard for loads under 14ft wide in most states. Permits cost $500-$3,000 depending on state and load weight.',
    },
    'manufactured-housing': {
        name: 'Manufactured Housing',
        icon: '🏠',
        description: 'Single, double, and triple-wide manufactured homes. High-volume year-round with predictable routes and consistent escort requirements.',
        weight: '20,000–60,000 lbs',
        width: '14–18 ft',
        height: '14–16 ft',
        escortCount: '1–2 escorts, plus traffic control',
        topStates: ['TX', 'FL', 'NC', 'SC', 'GA', 'TN', 'IN'],
        permits: '$300–$1,500 per move',
        specialReqs: ['Overwidth permit required', '1 front escort standard', '2 escorts for double-wide', 'Red and amber lights required', 'Restricted to daylight hours in many states'],
        bestCorridors: ['TX→OK', 'FL→GA', 'NC→SC'],
        avgRate: '$2.80–$4.50/mi',
        ai_answer: 'Manufactured home transport requires 1 pilot car for single-wide and 2 for double-wide. Most states restrict moves to daylight hours. Permits cost $300-$1,500 and overwidth permits are required in all states.',
    },
    'bridge-beam': {
        name: 'Bridge Beams & Precast',
        icon: '🌉',
        description: 'Precast bridge beams, girders, and modular bridge sections. Extremely long, very heavy, require precision route engineering.',
        weight: '100,000–400,000 lbs',
        width: '10–14 ft',
        height: '13–15 ft',
        escortCount: '2–4 escorts + route survey',
        topStates: ['OH', 'PA', 'TX', 'IL', 'IN', 'NY'],
        permits: '$3,000–$15,000 per move',
        specialReqs: ['Superload permit for heavy beams', 'Engineer-certified route survey', 'Bridge crossing analysis', 'Often requires police escort', 'Night moves frequently required (low traffic)'],
        bestCorridors: ['OH→PA', 'IL→IN', 'TX→LA'],
        avgRate: '$5.00–$8.50/mi',
        ai_answer: 'Bridge beam transport requires an engineer-stamped route survey and bridge crossing analysis. Superload permits are needed for beams over 150,000 lbs. Costs run $5-$8.50/mile due to complexity.',
    },
    'modular-building': {
        name: 'Modular Buildings',
        icon: '🏢',
        description: 'Modular commercial buildings, portable classrooms, and field offices. Growing market driven by construction boom.',
        weight: '30,000–90,000 lbs',
        width: '14–16 ft',
        height: '14–16 ft',
        escortCount: '1–2 escorts full length',
        topStates: ['TX', 'CA', 'FL', 'NC', 'OH', 'CO'],
        permits: '$600–$2,500 per move',
        specialReqs: ['Overwidth permit', 'Height pole escort for utilities', 'Daylight-only in most states', 'Advance route inspection'],
        bestCorridors: ['TX→OK', 'CA→AZ', 'FL→GA'],
        avgRate: '$3.50–$5.50/mi',
        ai_answer: 'Modular building moves need 1-2 pilot cars depending on width. A height pole escort is required in most states. Most moves are daylight-only. Permits cost $600-$2,500.',
    },
};

const RELATED_LOAD_TYPES = Object.entries(LOAD_TYPES).map(([slug, lt]) => ({ slug, name: lt.name, icon: lt.icon }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { loadType } = await params;
    const lt = LOAD_TYPES[loadType];
    if (!lt) return { title: 'Not Found' };
    return {
        title: `Best Escorts for ${lt.name} | Requirements, Rates & Top States | Haul Command`,
        description: `${lt.name} escort requirements: ${lt.escortCount}, avg rate ${lt.avgRate}, permits ${lt.permits}. Top states: ${lt.topStates.slice(0, 4).join(', ')}. Updated ${new Date().getFullYear()}.`,
        alternates: { canonical: `https://www.haulcommand.com/best-for/${loadType}` },
    };
}

export default async function BestForLoadTypePage({ params }: Props) {
    const { loadType } = await params;
    const lt = LOAD_TYPES[loadType];
    if (!lt) return notFound();

    const related = RELATED_LOAD_TYPES.filter(r => r.slug !== loadType).slice(0, 5);

    return (
        <div style={{ minHeight: '100vh', background: '#08080C', color: '#F0F0F0', fontFamily: "'Inter', system-ui" }}>

            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Article',
                name: `Best Escorts for ${lt.name}`,
                description: lt.ai_answer,
                url: `https://www.haulcommand.com/best-for/${loadType}`,
                dateModified: new Date().toISOString(),
                publisher: { '@type': 'Organization', name: 'Haul Command' },
                mainEntity: {
                    '@type': 'FAQPage',
                    mainEntity: [{
                        '@type': 'Question',
                        name: `How many escorts do I need for ${lt.name.toLowerCase()}?`,
                        acceptedAnswer: { '@type': 'Answer', text: lt.ai_answer },
                    }],
                },
            })}} />

            <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1rem 5rem' }}>

                {/* Breadcrumb */}
                <nav style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, fontSize: 12, color: '#6B7280', flexWrap: 'wrap' }}>
                    <Link href="/tools" style={{ color: '#F1A91B', textDecoration: 'none' }}>Tools</Link>
                    <span>/</span>
                    <span>Best For</span>
                    <span>/</span>
                    <span style={{ color: '#F0F0F0' }}>{lt.name}</span>
                </nav>

                {/* Hero */}
                <div style={{ marginBottom: 28 }}>
                    <span style={{ fontSize: 40 }}>{lt.icon}</span>
                    <h1 style={{ margin: '10px 0 0', fontSize: 'clamp(22px, 4vw, 38px)', fontWeight: 900, letterSpacing: '-0.02em' }}>
                        Best Escorts for {lt.name}
                    </h1>
                    <p style={{ marginTop: 8, color: '#6B7280', fontSize: 14, lineHeight: 1.6, maxWidth: 600 }}>
                        {lt.description}
                    </p>
                </div>

                {/* Quick-answer AI block */}
                <div style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#22C55E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Quick Answer</div>
                    <p style={{ margin: 0, fontSize: 13, color: '#D1D5DB', lineHeight: 1.7 }}>{lt.ai_answer}</p>
                </div>

                {/* Load Specs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
                    {[
                        { label: 'Typical Weight', value: lt.weight },
                        { label: 'Typical Width', value: lt.width },
                        { label: 'Typical Height', value: lt.height },
                        { label: 'Escort Count', value: lt.escortCount },
                        { label: 'Avg Rate', value: lt.avgRate },
                        { label: 'Permit Cost Range', value: lt.permits },
                    ].map(m => (
                        <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px' }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{m.label}</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#F0F0F0' }}>{m.value}</div>
                        </div>
                    ))}
                </div>

                {/* Special Requirements */}
                <div style={{ background: 'rgba(241,169,27,0.04)', border: '1px solid rgba(241,169,27,0.12)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.06em' }}>Special Requirements</div>
                    {lt.specialReqs.map(r => (
                        <div key={r} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6, fontSize: 12, color: '#D1D5DB', lineHeight: 1.5 }}>
                            <span style={{ color: '#F59E0B', flexShrink: 0 }}>•</span> {r}
                        </div>
                    ))}
                </div>

                {/* Top States */}
                <div style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Highest Activity States</h2>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {lt.topStates.map(s => (
                            <Link key={s} href={`/market/${s.toLowerCase()}`}
                                style={{ padding: '6px 14px', background: 'rgba(241,169,27,0.08)', border: '1px solid rgba(241,169,27,0.2)', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#F1A91B', textDecoration: 'none' }}>
                                {s}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Best Corridors */}
                <div style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Best Corridors for {lt.name}</h2>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {lt.bestCorridors.map(c => {
                            const [orig, dest] = c.toLowerCase().replace('→', '-').split('-');
                            return (
                                <Link key={c} href={`/corridors/${orig}/vs/${dest}`}
                                    style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#D1D5DB', textDecoration: 'none' }}>
                                    {c} →
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* AI FAQ Block */}
                <div style={{ marginBottom: 24 }}>
                    <SnippetInjector blocks={['faq']} term={`${lt.name} escort requirements`} geo="US" country="US" />
                </div>

                {/* Sponsor Slot */}
                <div style={{ marginBottom: 20 }}>
                    <AdGridSlot zone="tool_sponsor" />
                </div>

                {/* Urgent Market Sponsor */}
                <div style={{ marginBottom: 20 }}>
                    <UrgentMarketSponsor marketKey="us" geo="United States" />
                </div>

                {/* Takeover Sponsor */}
                <div style={{ marginBottom: 24 }}>
                    <TakeoverSponsorBanner level="state" territory={`${lt.name} Moves`} pricePerMonth={299} />
                </div>

                {/* Find Escorts CTA */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                    <Link href="/directory" style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', borderRadius: 10, color: '#000', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                        Find Escorts for This Load →
                    </Link>
                    <Link href="/tools/escort-calculator" style={{ padding: '10px 22px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#F0F0F0', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                        Calculate Escort Count
                    </Link>
                </div>

                {/* Other Load Types */}
                <div style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Other Load Types</h2>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {related.map(r => (
                            <Link key={r.slug} href={`/best-for/${r.slug}`}
                                style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, fontSize: 11, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>
                                {r.icon} {r.name}
                            </Link>
                        ))}
                    </div>
                </div>

                <DataTeaserStrip />
            </div>
        </div>
    );
}

export async function generateStaticParams() {
    return Object.keys(LOAD_TYPES).map(loadType => ({ loadType }));
}
