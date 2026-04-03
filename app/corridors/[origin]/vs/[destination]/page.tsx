import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { DataTeaserStrip } from '@/components/data/DataTeaserStrip';
import { SnippetInjector } from '@/components/seo/SnippetInjector';
import { UrgentMarketSponsor } from '@/components/ads/UrgentMarketSponsor';
import { TakeoverSponsorBanner } from '@/components/ads/TakeoverSponsorBanner';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

export const revalidate = 3600; // ISR — corridor data is stable

interface Props {
    params: Promise<{ origin: string; destination: string }>;
}

// Corridor catalog — extensible from DB
const CORRIDORS: Record<string, {
    name: string; state1: string; state2: string;
    miles: number; avgRate: string; permits: string;
    escorts: string; riskGrade: 'A' | 'B' | 'C' | 'D';
    notes: string; topHazards: string[];
}> = {
    'tx-la': { name: 'Texas → Louisiana', state1: 'TX', state2: 'LA', miles: 280, avgRate: '$3.80–$5.20/mi', permits: 'Both states', escorts: 'Required both', riskGrade: 'B', notes: 'Petrochemical and oil field loads dominate. I-10 corridor most active.', topHazards: ['Sabine River bridge weight', 'Lake Charles industrial access'] },
    'tx-ok': { name: 'Texas → Oklahoma', state1: 'TX', state2: 'OK', miles: 190, avgRate: '$3.50–$4.90/mi', permits: 'Both states', escorts: 'Required TX', riskGrade: 'B', notes: 'Wind turbine and energy equipment primary loads. TX reciprocity applies in OK.', topHazards: ['Red River crossing', 'OKC metro weight limits'] },
    'ca-az': { name: 'California → Arizona', state1: 'CA', state2: 'AZ', miles: 370, avgRate: '$4.20–$6.20/mi', permits: 'Caltrans + ADOT', escorts: 'Caltrans strict', riskGrade: 'A', notes: 'Highest complexity corridor. CA has most restrictive rules in US.', topHazards: ['I-10 desert heat restrictions', 'CA night move ban', 'Colorado River crossings'] },
    'la-ms': { name: 'Louisiana → Mississippi', state1: 'LA', state2: 'MS', miles: 150, avgRate: '$3.40–$4.80/mi', permits: 'Both states', escorts: 'Required both', riskGrade: 'C', notes: 'Bridge-heavy corridor. DOTD and MDOT permit required per move.', topHazards: ['Lake Pontchartrain', 'Pearl River bridge weight'] },
    'oh-pa': { name: 'Ohio → Pennsylvania', state1: 'OH', state2: 'PA', miles: 220, avgRate: '$3.20–$4.60/mi', permits: 'ODOT + PennDOT', escorts: 'Required both', riskGrade: 'B', notes: 'Manufacturing and steel loads. PennDOT no-night rules apply.', topHazards: ['Ohio River crossings', 'Pittsburgh urban night restrictions'] },
    'fl-ga': { name: 'Florida → Georgia', state1: 'FL', state2: 'GA', miles: 340, avgRate: '$3.40–$5.00/mi', permits: 'FDOT + GDOT', escorts: 'Required both', riskGrade: 'B', notes: 'Construction and port equipment. Savannah port approach bottleneck.', topHazards: ['Jacksonville urban', 'Savannah port approach'] },
    'wa-or': { name: 'Washington → Oregon', state1: 'WA', state2: 'OR', miles: 180, avgRate: '$3.50–$5.10/mi', permits: 'WSDOT + ODOT', escorts: 'Required both', riskGrade: 'B', notes: 'Wind turbine and forest equipment. Columbia River crossings critical.', topHazards: ['Columbia River gorge', 'Portland metro bridges'] },
    'mt-wy': { name: 'Montana → Wyoming', state1: 'MT', state2: 'WY', miles: 340, avgRate: '$3.00–$4.50/mi', permits: 'MDT + WYDOT', escorts: 'Not required', riskGrade: 'C', notes: 'Wind turbine and mining equipment. No state cert required in either state but long miles.', topHazards: ['Mountain passes', 'Yellowstone proximity restrictions'] },
};

const RISK_CONFIG = {
    A: { label: 'High Complexity', color: '#EF4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)' },
    B: { label: 'Moderate', color: '#F59E0B', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)' },
    C: { label: 'Standard', color: '#22C55E', bg: 'rgba(34,197,94,0.05)', border: 'rgba(34,197,94,0.12)' },
    D: { label: 'Simple', color: '#3B82F6', bg: 'rgba(59,130,246,0.05)', border: 'rgba(59,130,246,0.12)' },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { origin, destination } = await params;
    const corridorKey = `${origin}-${destination}`;
    const c = CORRIDORS[corridorKey];
    if (!c) return { title: 'Not Found' };
    return {
        title: `${c.name} Corridor Compare — Permits, Escorts & Rates | Haul Command`,
        description: `Complete comparison guide for the ${c.name} corridor. ${c.miles} miles, avg rate ${c.avgRate}, permit requirements for ${c.state1} and ${c.state2}, escort rules, risk grade ${c.riskGrade}. Updated ${new Date().getFullYear()}.`,
        alternates: { canonical: `https://www.haulcommand.com/corridors/${origin}/vs/${destination}` },
    };
}

export default async function CorridorComparePage({ params }: Props) {
    const { origin, destination } = await params;
    const corridorKey = `${origin}-${destination}`;
    const c = CORRIDORS[corridorKey];
    if (!c) return notFound();

    const risk = RISK_CONFIG[c.riskGrade];
    const relatedCorridors = Object.entries(CORRIDORS)
        .filter(([key]) => key !== corridorKey && (key.startsWith(origin) || key.endsWith(destination)))
        .slice(0, 4);

    return (
        <div style={{ minHeight: '100vh', background: '#08080C', color: '#F0F0F0', fontFamily: "'Inter', system-ui" }}>

            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@graph': [
                    {
                        '@type': 'Article',
                        name: `${c.name} Corridor — Permit & Escort Requirements`,
                        description: `Complete requirements guide for the ${c.name} heavy haul corridor`,
                        url: `https://www.haulcommand.com/corridors/${origin}/vs/${destination}`,
                        dateModified: new Date().toISOString(),
                        publisher: { '@type': 'Organization', name: 'Haul Command', url: 'https://www.haulcommand.com' },
                    },
                    {
                        '@type': 'FAQPage',
                        mainEntity: [
                            { '@type': 'Question', name: `What permits do I need for the ${c.name} corridor?`, acceptedAnswer: { '@type': 'Answer', text: `The ${c.name} corridor requires ${c.permits}. Escort rules: ${c.escorts}. Total distance: ${c.miles} miles.` } },
                            { '@type': 'Question', name: `What is the average pilot car rate for the ${c.name} corridor?`, acceptedAnswer: { '@type': 'Answer', text: `Average pilot car rates on the ${c.name} corridor run ${c.avgRate} depending on load type, season, and convoy size. Risk grade: ${c.riskGrade} (${RISK_CONFIG[c.riskGrade].label}).` } },
                            { '@type': 'Question', name: `What are the main hazards on the ${c.name} route?`, acceptedAnswer: { '@type': 'Answer', text: `Known hazards on the ${c.name} corridor include: ${c.topHazards.join(', ')}. ${c.notes}` } },
                        ],
                    },
                    {
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
                            { '@type': 'ListItem', position: 2, name: 'Corridors', item: 'https://www.haulcommand.com/corridors' },
                            { '@type': 'ListItem', position: 3, name: c.name, item: `https://www.haulcommand.com/corridors/${origin}/vs/${destination}` },
                        ],
                    },
                ],
            })}} />

            <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1rem 5rem' }}>

                {/* Breadcrumb */}
                <nav style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, fontSize: 12, color: '#6B7280', flexWrap: 'wrap' }}>
                    <Link href="/" style={{ color: '#6B7280', textDecoration: 'none' }}>Home</Link>
                    <span>/</span>
                    <Link href="/corridors" style={{ color: '#F1A91B', textDecoration: 'none' }}>Corridors</Link>
                    <span>/</span>
                    <span style={{ color: '#F0F0F0' }}>{c.state1} ↔ {c.state2}</span>
                </nav>

                {/* Sponsor This Corridor — above-fold monetization */}
                <div style={{ marginBottom: 20 }}>
                    <TakeoverSponsorBanner
                        level="state"
                        territory={c.name}
                        pricePerMonth={199}
                    />
                </div>

                {/* ProofStrip */}
                <ProofStrip variant="compact" style={{ marginBottom: 20 }} />

                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <span style={{ display: 'inline-block', padding: '3px 12px', background: risk.bg, border: `1px solid ${risk.border}`, borderRadius: 20, fontSize: 10, fontWeight: 700, color: risk.color, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
                        Risk Grade {c.riskGrade} — {risk.label}
                    </span>
                    <h1 style={{ margin: 0, fontSize: 'clamp(22px, 4vw, 38px)', fontWeight: 900, letterSpacing: '-0.02em' }}>
                        {c.name} Corridor
                    </h1>
                    <p style={{ marginTop: 8, color: '#6B7280', fontSize: 14, lineHeight: 1.6 }}>
                        Complete guide to permits, escort requirements, rates, and hazards for the {c.name} heavy haul corridor.
                    </p>
                </div>

                {/* Key Metrics — side-by-side state comparison */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                    {[
                        { label: 'Corridor Distance', value: `${c.miles} miles`, full: true },
                        { label: 'Avg Rate Range', value: c.avgRate, full: true },
                        { label: `${c.state1} Requirements`, value: c.permits.split('+')[0]?.trim() ?? c.permits, full: false },
                        { label: `${c.state2} Requirements`, value: c.permits.split('+')[1]?.trim() ?? c.permits, full: false },
                        { label: 'Escort Rules', value: c.escorts, full: true },
                        { label: 'Risk Grade', value: `${c.riskGrade} — ${risk.label}`, full: true },
                    ].filter(m => m.full).map(m => (
                        <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', gridColumn: 'auto' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{m.label}</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#F0F0F0' }}>{m.value}</div>
                        </div>
                    ))}
                </div>

                {/* AI Answer Block */}
                <div style={{ marginBottom: 24 }}>
                    <SnippetInjector blocks={['quick_answer', 'faq']} term={`${c.name} heavy haul corridor`} geo={`${c.state1}, ${c.state2}`} country="US" />
                </div>

                {/* State-by-State Comparison */}
                <div style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>State-by-State Requirements</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {[
                            { state: c.state1, reqs: [`Permit: ${c.permits.includes('+') ? c.permits.split('+')[0]?.trim() : c.permits}`, `Escorts: ${c.escorts.split(' ')[0]} ${c.escorts.includes(c.state1) ? 'required' : 'see notes'}`, 'Cert: State-specific'] },
                            { state: c.state2, reqs: [`Permit: ${c.permits.includes('+') ? c.permits.split('+')[1]?.trim() : c.permits}`, `Escorts: ${c.escorts.split(' ')[0]} ${c.escorts.includes(c.state2) ? 'required' : 'check states'}`, 'Cert: State-specific'] },
                        ].map(({ state, reqs }) => (
                            <div key={state} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#F1A91B', marginBottom: 10 }}>{state}</div>
                                {reqs.map(r => (
                                    <div key={r} style={{ fontSize: 12, color: '#D1D5DB', marginBottom: 5, display: 'flex', gap: 6 }}>
                                        <span style={{ color: '#22C55E', flexShrink: 0 }}>✓</span> {r}
                                    </div>
                                ))}
                                <Link href={`/escort-requirements/${state.toLowerCase()}`}
                                    style={{ display: 'inline-block', marginTop: 8, fontSize: 11, fontWeight: 700, color: '#F1A91B', textDecoration: 'none' }}>
                                    Full {state} Rules →
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notes */}
                <div style={{ background: 'rgba(241,169,27,0.04)', border: '1px solid rgba(241,169,27,0.12)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.06em' }}>Corridor Intelligence</div>
                    <p style={{ margin: 0, fontSize: 13, color: '#D1D5DB', lineHeight: 1.7 }}>{c.notes}</p>
                </div>

                {/* Top Hazards */}
                <div style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Known Hazards &amp; Chokepoints</h2>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {c.topHazards.map(h => (
                            <span key={h} style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, fontSize: 12, color: '#FCA5A5' }}>
                                ⚠️ {h}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Corridor Sponsor */}
                <div style={{ marginBottom: 24 }}>
                    <AdGridSlot zone="corridor_sponsor" />
                </div>

                {/* Urgent Market Sponsor */}
                <div style={{ marginBottom: 24 }}>
                    <UrgentMarketSponsor marketKey={`us-${origin}`} geo={`${c.name}`} />
                </div>

                {/* Related Corridors */}
                {relatedCorridors.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Connected Corridors</h2>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {relatedCorridors.map(([key, rc]) => {
                                const [orig, dest] = key.split('-');
                                return (
                                    <Link key={key} href={`/corridors/${orig}/vs/${dest}`}
                                        style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, fontSize: 11, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>
                                        {rc.name} →
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* CTA */}
                <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Need escorts for this corridor?</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <Link href={`/find/pilot-car-operator/${origin}-escort`} style={{ padding: '8px 18px', background: 'rgba(241,169,27,0.1)', border: '1px solid rgba(241,169,27,0.2)', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#F1A91B', textDecoration: 'none' }}>
                            Find Escorts in {c.state1} →
                        </Link>
                        <Link href="/tools/permit-checker" style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#D1D5DB', textDecoration: 'none' }}>
                            Check Permits
                        </Link>
                    </div>
                </div>

                {/* No-Dead-End block */}
                <NoDeadEndBlock
                    heading={`What Would You Like to Do on the ${c.name} Corridor?`}
                    moves={[
                        { href: `/find/pilot-car-operator/${origin}`, icon: '🔍', title: `Find ${c.state1} Operators`, desc: 'Available now, verified', primary: true, color: '#D4A844' },
                        { href: '/claim', icon: '✓', title: 'Claim Corridor Territory', desc: 'Pro listing for this route', primary: true, color: '#22C55E' },
                        { href: `/escort-requirements/${origin}`, icon: '⚖️', title: `${c.state1} Escort Rules`, desc: 'Full requirements guide' },
                        { href: `/escort-requirements/${destination}`, icon: '⚖️', title: `${c.state2} Escort Rules`, desc: 'Full requirements guide' },
                        { href: '/tools/escort-calculator', icon: '🧮', title: 'Escort Calculator', desc: 'How many vehicles?' },
                        { href: '/loads', icon: '📋', title: 'Load Board', desc: 'Loads on this route' },
                    ]}
                />

                <DataTeaserStrip geo={`${c.state1}–${c.state2} Corridor`} />
            </div>
        </div>
    );
}

export async function generateStaticParams() {
    return Object.keys(CORRIDORS).map(key => {
        const [origin, ...rest] = key.split('-');
        return { origin, destination: rest.join('-') };
    });
}
