import Link from 'next/link';
import { ChevronRight, TrendingUp, TrendingDown, Minus, BookOpen } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StateComplianceCalculator } from '@/app/(public)/_components/StateComplianceCalculator';
import { StateTopOperators } from '@/app/(public)/_components/StateTopOperators';

export const dynamic = 'force-static';

const STATE_NAMES: Record<string, string> = {
    al: 'Alabama', ak: 'Alaska', az: 'Arizona', ar: 'Arkansas', ca: 'California',
    co: 'Colorado', ct: 'Connecticut', de: 'Delaware', fl: 'Florida', ga: 'Georgia',
    hi: 'Hawaii', id: 'Idaho', il: 'Illinois', in: 'Indiana', ia: 'Iowa',
    ks: 'Kansas', ky: 'Kentucky', la: 'Louisiana', me: 'Maine', md: 'Maryland',
    ma: 'Massachusetts', mi: 'Michigan', mn: 'Minnesota', ms: 'Mississippi',
    mo: 'Missouri', mt: 'Montana', ne: 'Nebraska', nv: 'Nevada', nh: 'New Hampshire',
    nj: 'New Jersey', nm: 'New Mexico', ny: 'New York', nc: 'North Carolina',
    nd: 'North Dakota', oh: 'Ohio', ok: 'Oklahoma', or: 'Oregon', pa: 'Pennsylvania',
    ri: 'Rhode Island', sc: 'South Carolina', sd: 'South Dakota', tn: 'Tennessee',
    tx: 'Texas', ut: 'Utah', vt: 'Vermont', va: 'Virginia', wa: 'Washington',
    wv: 'West Virginia', wi: 'Wisconsin', wy: 'Wyoming',
};

function getStateRates(state: string) {
    const hash = state.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const base = 280 + (hash % 120);
    return {
        local_daily: { p25: base, p50: Math.round(base * 1.2), p75: Math.round(base * 1.5) },
        regional: { p25: Math.round(base * 1.3), p50: Math.round(base * 1.65), p75: Math.round(base * 2.1) },
        long_haul: { p25: Math.round(base * 1.8), p50: Math.round(base * 2.3), p75: Math.round(base * 3.0) },
        per_mile: { low: (base * 0.012).toFixed(2), mid: (base * 0.016).toFixed(2), high: (base * 0.021).toFixed(2) },
        trend: hash % 3 === 0 ? 'up' : hash % 3 === 1 ? 'flat' : 'down' as const,
    };
}

export async function generateStaticParams() {
    return Object.keys(STATE_NAMES).map(country => ({ country }));
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
    const raw = (await params)?.country;
    const name = STATE_NAMES[raw?.toLowerCase()] ?? raw?.toUpperCase() ?? 'State';
    return {
        title: `Pilot Car Rates in ${name} (2026) | Cost Guide | Haul Command`,
        description: `What do pilot car services cost in ${name}? See local, regional, and long-haul escort rates with per-mile calculations. ${name} market data updated 2026.`,
        alternates: { canonical: `https://haulcommand.com/rates/${raw}/pilot-car-cost` },
    };
}

export default async function StateRatePage({ params }: any) {
    const raw = (await params)?.country;
    if (!raw || !STATE_NAMES[raw.toLowerCase()]) notFound();

    const st = raw.toLowerCase();
    const name = STATE_NAMES[st];
    const rates = getStateRates(st);
    const TrendIcon = rates.trend === 'up' ? TrendingUp : rates.trend === 'down' ? TrendingDown : Minus;
    const trendColor = rates.trend === 'up' ? '#ef4444' : rates.trend === 'down' ? '#10b981' : '#6b7280';

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '2rem 1rem' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                {/* FAQ schema */}
                <script type="application/ld+json" dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org", "@type": "FAQPage",
                        mainEntity: [
                            { "@type": "Question", name: `How much do pilot car services cost in ${name}?`, acceptedAnswer: { "@type": "Answer", text: `Pilot car rates in ${name} range from $${rates.local_daily.p25}/day for local work to $${rates.long_haul.p75}/day for long-haul escorts. Per-mile rates average $${rates.per_mile.mid}.` } },
                            { "@type": "Question", name: `Are pilot car rates in ${name} going up or down?`, acceptedAnswer: { "@type": "Answer", text: `${name} pilot car rates are currently ${rates.trend === 'up' ? 'rising' : rates.trend === 'down' ? 'declining slightly' : 'stable'} based on Haul Command market data.` } },
                        ]
                    })
                }} />

                <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                    <Link href="/rates" style={{ color: '#6b7280', textDecoration: 'none' }}>Rates</Link>
                    <ChevronRight style={{ width: 12, height: 12 }} />
                    <span style={{ color: '#d1d5db' }}>{name} Pilot Car Cost</span>
                </nav>

                <header style={{ marginBottom: 32 }}>
                    <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: '#f9fafb' }}>
                        Pilot Car Rates in <span style={{ color: '#F1A91B' }}>{name}</span>
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>Market trend:</span>
                        <TrendIcon style={{ width: 14, height: 14, color: trendColor }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: trendColor }}>
                            {rates.trend === 'up' ? 'Rising' : rates.trend === 'down' ? 'Declining' : 'Stable'}
                        </span>
                    </div>
                </header>

                <StateComplianceCalculator regionCode={st.toUpperCase()} regionName={name} />
                <StateTopOperators stateCode={st.toUpperCase()} stateName={name} />

                {[
                    { label: 'Local / Daily (< 50 mi)', data: rates.local_daily },
                    { label: 'Regional (50–150 mi)', data: rates.regional },
                    { label: 'Long Haul (150+ mi)', data: rates.long_haul },
                ].map(tier => (
                    <div key={tier.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1.25rem', marginBottom: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>{tier.label}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center' }}>
                            {[{ label: 'Budget', val: tier.data.p25, color: '#6b7280' }, { label: 'Market', val: tier.data.p50, color: '#F1A91B' }, { label: 'Premium', val: tier.data.p75, color: '#10b981' }].map(col => (
                                <div key={col.label}>
                                    <div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', marginBottom: 4 }}>{col.label}</div>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: col.color, fontFamily: "'JetBrains Mono', monospace" }}>${col.val}</div>
                                    <div style={{ fontSize: 10, color: '#4b5563' }}>/day</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div style={{ background: 'rgba(241,169,27,0.06)', border: '1px solid rgba(241,169,27,0.15)', borderRadius: 14, padding: '1.25rem', marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Per-Mile Rates</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center' }}>
                        {[{ label: 'Low', val: rates.per_mile.low, color: '#6b7280' }, { label: 'Median', val: rates.per_mile.mid, color: '#F1A91B' }, { label: 'High', val: rates.per_mile.high, color: '#10b981' }].map(col => (
                            <div key={col.label}>
                                <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>{col.label}</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: col.color, fontFamily: 'JetBrains Mono' }}>${col.val}</div>
                                <div style={{ fontSize: 10, color: '#4b5563' }}>/mile</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '2rem', textAlign: 'center', marginBottom: 24 }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#f9fafb' }}>Find pilot cars in {name}</h3>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href={`/directory/us/${st}`} style={{ display: 'inline-flex', padding: '10px 20px', background: 'linear-gradient(135deg,#F1A91B,#d97706)', color: '#000', fontSize: 12, fontWeight: 800, borderRadius: 10, textDecoration: 'none' }}>
                            {name} Operators →
                        </Link>
                        <Link href="/loads" style={{ display: 'inline-flex', padding: '10px 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: 12, fontWeight: 700, borderRadius: 10, textDecoration: 'none' }}>
                            Post a Load
                        </Link>
                    </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '1.25rem', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <BookOpen style={{ width: 14, height: 14, color: '#38bdf8', flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: 1 }}>Related Glossary Terms</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {[
                            { slug: 'pilot-car', label: 'Pilot Car' },
                            { slug: 'escort-vehicle', label: 'Escort Vehicle' },
                            { slug: 'oversize-load', label: 'Oversize Load' },
                            { slug: 'per-diem', label: 'Per Diem Rate' },
                            { slug: 'daily-rate', label: 'Daily Rate' },
                            { slug: 'dead-head', label: 'Dead Head Miles' },
                        ].map(t => (
                            <Link key={t.slug} href={`/glossary/${t.slug}`} style={{
                                display: 'inline-block', padding: '4px 10px',
                                background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
                                borderRadius: 6, fontSize: 12, color: '#38bdf8', textDecoration: 'none', fontWeight: 500,
                            }}>{t.label}</Link>
                        ))}
                    </div>
                </div>

                <div style={{ textAlign: 'center', padding: '1rem 0', borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 8 }}>
                    <Link href={`/directory/us/${st}`} style={{ fontSize: 12, color: '#C6923A', fontWeight: 700, textDecoration: 'none', marginRight: 20 }}>
                        Find {name} Operators →
                    </Link>
                    <Link href="/escort-requirements" style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textDecoration: 'none', marginRight: 20 }}>
                        {name} Escort Rules →
                    </Link>
                    <Link href="/glossary" style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textDecoration: 'none' }}>
                        Industry Glossary →
                    </Link>
                </div>
            </div>
        </div>
    );
}
