import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { DataTeaserStrip } from '@/components/data/DataTeaserStrip';
import { UrgentMarketSponsor } from '@/components/ads/UrgentMarketSponsor';
import { BadgeProgressRail } from '@/components/social/BadgeProgressRail';
import { SnippetInjector } from '@/components/seo/SnippetInjector';

interface Props {
    params: Promise<{ state: string }>;
}

// State data for state-of-market pages
const MARKET_STATES: Record<string, {
    name: string; code: string; tier: 'hot' | 'active' | 'growing' | 'emerging';
    operatorEstimate: string; activeCorridors: number; avgRateRange: string;
    topCorridors: string[]; certRequired: boolean; notes: string;
}> = {
    tx: { name: 'Texas', code: 'TX', tier: 'hot', operatorEstimate: '2,400+', activeCorridors: 34, avgRateRange: '$3.80–$5.90/mi', topCorridors: ['TX→LA', 'TX→OK', 'TX→NM', 'Houston→Dallas'], certRequired: true, notes: 'Largest heavy haul market in the US. Wind turbine, oil field, and refinery markets drive highest demand.' },
    la: { name: 'Louisiana', code: 'LA', tier: 'hot', operatorEstimate: '820+', activeCorridors: 14, avgRateRange: '$3.60–$5.40/mi', topCorridors: ['LA→TX', 'LA→MS', 'Baton Rouge→New Orleans'], certRequired: true, notes: 'Petrochemical and offshore equipment moves. DOTD strictly enforces escort rules.' },
    fl: { name: 'Florida', code: 'FL', tier: 'active', operatorEstimate: '1,100+', activeCorridors: 18, avgRateRange: '$3.40–$5.20/mi', topCorridors: ['FL→GA', 'Tampa→Miami', 'Jacksonville→Atlanta'], certRequired: true, notes: 'Construction, energy, and port equipment moves. FDOT permit required per move.' },
    ca: { name: 'California', code: 'CA', tier: 'active', operatorEstimate: '1,800+', activeCorridors: 22, avgRateRange: '$4.20–$6.80/mi', topCorridors: ['CA→AZ', 'CA→NV', 'LA→SF', 'Port LA outbound'], certRequired: true, notes: 'Highest insurance requirements ($1M). No night superloads. Caltrans certification mandatory.' },
    oh: { name: 'Ohio', code: 'OH', tier: 'active', operatorEstimate: '960+', activeCorridors: 16, avgRateRange: '$3.20–$4.80/mi', topCorridors: ['OH→PA', 'OH→IN', 'OH→MI', 'Columbus→Cleveland'], certRequired: true, notes: 'Industrial and manufacturing heavy haul. ODOT-approved course required.' },
    pa: { name: 'Pennsylvania', code: 'PA', tier: 'active', operatorEstimate: '780+', activeCorridors: 12, avgRateRange: '$3.10–$4.60/mi', topCorridors: ['PA→OH', 'PA→NY', 'PA→MD', 'Pittsburgh→Philadelphia'], certRequired: true, notes: 'No night superload moves. PennDOT escort rules strictly enforced on interstates.' },
    mt: { name: 'Montana', code: 'MT', tier: 'growing', operatorEstimate: '340+', activeCorridors: 8, avgRateRange: '$3.00–$4.50/mi', topCorridors: ['MT→WY', 'MT→ID', 'Billings→Missoula'], certRequired: false, notes: 'Wind turbine corridor. No state cert but TX reciprocity accepted. Night moves allowed.' },
    ok: { name: 'Oklahoma', code: 'OK', tier: 'growing', operatorEstimate: '440+', activeCorridors: 10, avgRateRange: '$3.10–$4.70/mi', topCorridors: ['OK→TX', 'OK→KS', 'OK→AR'], certRequired: true, notes: 'TX reciprocity accepted. Oil field heavy haul dominant driver.' },
    wa: { name: 'Washington', code: 'WA', tier: 'growing', operatorEstimate: '520+', activeCorridors: 9, avgRateRange: '$3.50–$5.00/mi', topCorridors: ['WA→OR', 'WA→ID', 'Seattle port outbound'], certRequired: true, notes: 'WSDOT pilot car certification. Wind turbine and port equipment dominant loads.' },
    ga: { name: 'Georgia', code: 'GA', tier: 'active', operatorEstimate: '680+', activeCorridors: 12, avgRateRange: '$3.20–$4.90/mi', topCorridors: ['GA→FL', 'GA→SC', 'GA→TN', 'Atlanta→Savannah'], certRequired: true, notes: 'GDOT online certification accepted. Port Savannah drives strong demand.' },
};

const TIER_CONFIG = {
    hot: { label: '🔥 Hot Market', color: '#EF4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)' },
    active: { label: '✅ Active Market', color: '#10B981', bg: 'rgba(16,185,129,0.05)', border: 'rgba(16,185,129,0.15)' },
    growing: { label: '📈 Growing Market', color: '#3B82F6', bg: 'rgba(59,130,246,0.05)', border: 'rgba(59,130,246,0.15)' },
    emerging: { label: '🌱 Emerging Market', color: '#22C55E', bg: 'rgba(34,197,94,0.04)', border: 'rgba(34,197,94,0.12)' },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { state } = await params;
    const s = MARKET_STATES[state.toLowerCase()];
    if (!s) return { title: 'Not Found' };
    return {
        title: `${s.name} Heavy Haul Market Report ${new Date().getFullYear()} | Haul Command`,
        description: `${s.name} state-of-market: ${s.operatorEstimate} verified operators, ${s.activeCorridors} active corridors, avg rates ${s.avgRateRange}. Updated ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.`,
        alternates: { canonical: `https://www.haulcommand.com/market/${state.toLowerCase()}` },
    };
}

export default async function StateMarketPage({ params }: Props) {
    const { state } = await params;
    const s = MARKET_STATES[state.toLowerCase()];
    if (!s) return notFound();

    const supabase = createClient();
    const { count: liveOperators } = await supabase
        .from('hc_places')
        .select('id', { count: 'exact', head: true })
        .ilike('state', `%${s.name}%`);

    const tier = TIER_CONFIG[s.tier];
    const relatedStates = Object.entries(MARKET_STATES)
        .filter(([code]) => code !== state.toLowerCase())
        .slice(0, 5);

    return (
        <div style={{ minHeight: '100vh', background: '#08080C', color: '#F0F0F0', fontFamily: "'Inter', system-ui" }}>

            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Report',
                name: `${s.name} Heavy Haul Market Report ${new Date().getFullYear()}`,
                description: `State-of-market data for heavy haul escort operations in ${s.name}`,
                url: `https://www.haulcommand.com/market/${state.toLowerCase()}`,
                datePublished: new Date().toISOString(),
                publisher: { '@type': 'Organization', name: 'Haul Command' },
            })}} />

            <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1rem 5rem' }}>

                {/* Breadcrumb */}
                <nav style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, fontSize: 12, color: '#6B7280' }}>
                    <Link href="/" style={{ color: '#F1A91B', textDecoration: 'none' }}>Home</Link>
                    <span>/</span>
                    <span>Market Intelligence</span>
                    <span>/</span>
                    <span style={{ color: '#F0F0F0' }}>{s.name}</span>
                </nav>

                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <span style={{ display: 'inline-block', padding: '3px 12px', background: tier.bg, border: `1px solid ${tier.border}`, borderRadius: 20, fontSize: 10, fontWeight: 700, color: tier.color, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
                        {tier.label}
                    </span>
                    <h1 style={{ margin: 0, fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-0.02em' }}>
                        {s.name} Heavy Haul Market
                    </h1>
                    <p style={{ marginTop: 8, color: '#6B7280', fontSize: 14, lineHeight: 1.6 }}>
                        State-of-market intelligence for escort operations, corridor demand, and operator availability in {s.name}.
                        Updated {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
                    </p>
                </div>

                {/* Key Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 28 }}>
                    {[
                        { label: 'Verified Operators', value: liveOperators && liveOperators > 10 ? `${liveOperators.toLocaleString()}+` : s.operatorEstimate, icon: '👤' },
                        { label: 'Active Corridors', value: `${s.activeCorridors}`, icon: '🛣️' },
                        { label: 'Avg Rate Range', value: s.avgRateRange, icon: '💰' },
                        { label: 'Cert Required', value: s.certRequired ? '✅ Yes' : '❌ No', icon: '📋' },
                    ].map(m => (
                        <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                                {m.icon} {m.label}
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: '#F0F0F0' }}>{m.value}</div>
                        </div>
                    ))}
                </div>

                {/* AI Answer Block */}
                <div style={{ marginBottom: 24 }}>
                    <SnippetInjector blocks={['quick_answer', 'faq']} term={`heavy haul escort ${s.name}`} geo={s.name} country="US" />
                </div>

                {/* Market Notes */}
                <div style={{ background: 'rgba(241,169,27,0.04)', border: '1px solid rgba(241,169,27,0.12)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.06em' }}>Market Intelligence</div>
                    <p style={{ margin: 0, fontSize: 13, color: '#D1D5DB', lineHeight: 1.7 }}>{s.notes}</p>
                </div>

                {/* Top Corridors */}
                <div style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F0', marginBottom: 12 }}>Top Active Corridors</h2>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {s.topCorridors.map(c => (
                            <span key={c} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, color: '#D1D5DB' }}>
                                {c}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Urgent Market Sponsor */}
                <div style={{ marginBottom: 24 }}>
                    <UrgentMarketSponsor marketKey={`us-${state.toLowerCase()}`} geo={`${s.name}`} />
                </div>

                {/* Badge Rail — social proof for visitors */}
                <div style={{ marginBottom: 24 }}>
                    <BadgeProgressRail showPreview variant="compact" />
                </div>

                {/* Regulations Sponsor */}
                <div style={{ marginBottom: 24 }}>
                    <AdGridSlot zone="regulations_sponsor" />
                </div>

                {/* Data Teaser */}
                <div style={{ marginBottom: 28 }}>
                    <DataTeaserStrip geo={s.name} />
                </div>

                {/* Related Markets */}
                <div>
                    <h2 style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                        Other State Markets
                    </h2>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {relatedStates.map(([code, ms]) => (
                            <Link key={code} href={`/market/${code}`}
                                style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, fontSize: 11, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>
                                {ms.name} {ms.tier === 'hot' ? '🔥' : ms.tier === 'active' ? '✅' : '📈'}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export async function generateStaticParams() {
    return Object.keys(MARKET_STATES).map(state => ({ state }));
}
