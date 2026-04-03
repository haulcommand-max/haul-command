// app/(public)/market/[state]/page.tsx
// SERVER COMPONENT — ISR with 1h revalidation.
// Fetches market data server-side. No client spinners. No "Loading market intelligence...".
// Client components used ONLY for interactive elements (claim pressure, intent bars).

import { Metadata } from 'next';
import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/enterprise/supabase/admin';
import { ClaimPressureEngine } from '@/components/market/ClaimPressureEngine';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { NoDeadEndBlock, MARKET_NEXT_MOVES } from '@/components/ui/NoDeadEndBlock';

export const revalidate = 3600; // ISR — regenerate hourly

// ── State lookup ─────────────────────────────────────────────────────────────
const STATE_NAMES: Record<string, string> = {
    AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',
    CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',
    HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',
    KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',
    MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',
    MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
    NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',
    OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
    SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',
    VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',DC:'Washington DC',
};

// Adjacent states for "Nearby Markets" block
const ADJACENT: Record<string, string[]> = {
    TX:['LA','NM','OK','AR'],CA:['AZ','OR','NV'],FL:['GA','AL'],
    IL:['WI','IN','KY','MO'],OH:['PA','KY','IN','WV','MI'],
    NY:['PA','NJ','CT','VT','MA'],GA:['FL','AL','TN','SC','NC'],
    NC:['VA','SC','TN'],WA:['OR','ID'],CO:['UT','NM','KS','NE','WY'],
    MN:['WI','ND','SD','IA'],LA:['TX','MS','AR'],
};

// State-to-top-cities map for city links
const STATE_CITIES: Record<string, string[]> = {
    TX:['Houston','Dallas','San Antonio','Austin','Fort Worth'],
    CA:['Los Angeles','San Francisco','San Diego','Fresno','Sacramento'],
    FL:['Miami','Orlando','Tampa','Jacksonville','Fort Lauderdale'],
    NY:['New York City','Buffalo','Albany','Rochester','Syracuse'],
    IL:['Chicago','Peoria','Rockford','Springfield','Joliet'],
    OH:['Columbus','Cleveland','Cincinnati','Toledo','Akron'],
    GA:['Atlanta','Savannah','Augusta','Macon','Columbus'],
    PA:['Philadelphia','Pittsburgh','Allentown','Erie','Reading'],
    NC:['Charlotte','Raleigh','Greensboro','Durham','Winston-Salem'],
    WA:['Seattle','Spokane','Tacoma','Bellevue','Olympia'],
};

type MarketData = {
    active_loads: number;
    verified_operators: number;
    total_operators: number;
    claimed_operators: number;
    market_mode: 'live' | 'seeding' | 'demand_capture' | 'waitlist';
    freshness_label: string;
    rate_band: { min: number | null; max: number | null; median: number | null };
};

// ── Server data fetch ─────────────────────────────────────────────────────────
async function getMarketData(stateCode: string): Promise<MarketData> {
    try {
        const supabase = getSupabaseAdmin();
        const { data } = await supabase
            .from('market_intelligence')
            .select('active_loads,verified_operators,total_operators,claimed_operators,market_mode,freshness_label,rate_band')
            .eq('state_code', stateCode)
            .single();
        if (data) return data as MarketData;
    } catch {}

    // Credible fallback — never shows "Loading..."
    return {
        active_loads: 0,
        verified_operators: 0,
        total_operators: 0,
        claimed_operators: 0,
        market_mode: 'seeding',
        freshness_label: 'Updated hourly',
        rate_band: { min: null, max: null, median: null },
    };
}

// ── generateMetadata ──────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
    const { state } = await params;
    const stateCode = state.toUpperCase();
    const stateName = STATE_NAMES[stateCode] || stateCode;

    return {
        title: `${stateName} Pilot Car & Escort Services — Heavy Haul Directory | Haul Command`,
        description: `Find verified pilot car operators and escort vehicle services in ${stateName}. Browse active loads, operator availability, corridor coverage, and state escort requirements.`,
        alternates: {
            canonical: `https://www.haulcommand.com/market/${state.toLowerCase()}`,
        },
        openGraph: {
            title: `${stateName} Pilot Car & Escort Directory | Haul Command`,
            description: `Pilot car operators, escort services, and oversize load coverage in ${stateName}. Active loads, verified operators, and state escort requirements.`,
        },
    };
}

// ── Page (Server Component) ───────────────────────────────────────────────────
export default async function StateMarketPage({ params }: { params: Promise<{ state: string }> }) {
    const { state } = await params;
    const stateCode = state.toUpperCase();
    const stateName = STATE_NAMES[stateCode] || stateCode;
    const data = await getMarketData(stateCode);

    const adjacent = ADJACENT[stateCode] || [];
    const cities = STATE_CITIES[stateCode] || [];

    const MODE_COLORS: Record<string, string> = {
        live: '#22C55E', seeding: '#F59E0B', demand_capture: '#8B5CF6', waitlist: '#6B7280',
    };
    const MODE_LABELS: Record<string, string> = {
        live: '🟢 LIVE MARKET', seeding: '🌱 SEEDING', demand_capture: '📡 DEMAND CAPTURE', waitlist: '⏳ COMING SOON',
    };
    const modeColor = MODE_COLORS[data.market_mode] ?? '#6B7280';
    const modeLabel = MODE_LABELS[data.market_mode] ?? '🟢 LIVE';

    return (
        <div style={{ minHeight: '100vh', background: '#060b12', color: '#f5f7fb' }}>
            {/* ── Hero ──────────────────────────────────────────── */}
            <div style={{ padding: '40px 16px 28px', maxWidth: 900, margin: '0 auto' }}>
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" style={{ marginBottom: 16, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                    <Link href="/" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Home</Link>
                    <span style={{ margin: '0 6px' }}>›</span>
                    <Link href="/directory" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Markets</Link>
                    <span style={{ margin: '0 6px' }}>›</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>{stateName}</span>
                </nav>

                {/* Mode badge — data is baked at build time, no spinner */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '5px 14px', borderRadius: 999, marginBottom: 14,
                    background: `${modeColor}12`, border: `1px solid ${modeColor}30`,
                }}>
                    <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', color: modeColor, textTransform: 'uppercase' }}>
                        {modeLabel}
                    </span>
                </div>

                {/* H1 — SEO-strong pattern */}
                <h1 style={{
                    fontSize: 'clamp(1.75rem, 5vw, 3rem)', fontWeight: 900,
                    lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 10px',
                }}>
                    {stateName} Pilot Car &amp; Escort Services
                </h1>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', maxWidth: 600, lineHeight: 1.5, margin: 0 }}>
                    Heavy haul directory for {stateName}. Browse verified pilot car operators, oversize load coverage, and active corridor lanes.
                </p>
            </div>

            {/* ── Stats strip — server-baked, zero spinner ──────── */}
            <div style={{ padding: '0 16px 28px', maxWidth: 900, margin: '0 auto' }}>
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                    gap: 10,
                }}>
                    {[
                        { val: data.active_loads || '—', label: 'Active Loads', color: '#22C55E' },
                        { val: data.verified_operators || '—', label: 'Verified', color: '#D4A844' },
                        { val: data.total_operators || '—', label: 'Total Operators', color: '#3B82F6' },
                        { val: data.claimed_operators || '—', label: 'Claimed', color: '#8B5CF6' },
                    ].map(({ val, label, color }) => (
                        <div key={label} style={{
                            padding: '16px 14px', borderRadius: 14,
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: 26, fontWeight: 900, color }}>{val}</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{label}</div>
                        </div>
                    ))}
                </div>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 8 }}>
                    {data.freshness_label} · Updated hourly
                </p>
            </div>

            {/* ── Proof strip ──────────────────────────────────── */}
            <ProofStrip variant="bar" style={{ margin: '0 0 8px' }} />

            {/* ── Role CTAs ─────────────────────────────────────── */}
            <div style={{ padding: '0 16px 28px', maxWidth: 900, margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Link href={`/find/pilot-car-operator/${state.toLowerCase()}`} style={{
                        padding: '18px 16px', borderRadius: 14, textDecoration: 'none', textAlign: 'center',
                        background: 'rgba(212,168,68,0.1)', border: '1px solid rgba(212,168,68,0.25)',
                    }}>
                        <div style={{ fontSize: 22, marginBottom: 6 }}>🔍</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#D4A844' }}>Find Pilot Car Operators</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>For brokers &amp; carriers</div>
                    </Link>
                    <Link href="/claim" style={{
                        padding: '18px 16px', borderRadius: 14, textDecoration: 'none', textAlign: 'center',
                        background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                    }}>
                        <div style={{ fontSize: 22, marginBottom: 6 }}>✓</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#22C55E' }}>Claim Your Profile</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>For {stateName} operators</div>
                    </Link>
                    <Link href="/loads" style={{
                        padding: '18px 16px', borderRadius: 14, textDecoration: 'none', textAlign: 'center',
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                        <div style={{ fontSize: 22, marginBottom: 6 }}>📋</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Browse Loads</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>Pilot &amp; escort jobs</div>
                    </Link>
                    <Link href={`/escort-requirements/${state.toLowerCase()}`} style={{
                        padding: '18px 16px', borderRadius: 14, textDecoration: 'none', textAlign: 'center',
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                        <div style={{ fontSize: 22, marginBottom: 6 }}>⚖️</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{stateName} Rules</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>State escort requirements</div>
                    </Link>
                </div>
            </div>

            {/* ── City links ────────────────────────────────────── */}
            {cities.length > 0 && (
                <div style={{ padding: '0 16px 28px', maxWidth: 900, margin: '0 auto' }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12 }}>
                        Find Operators by City in {stateName}
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {cities.map(city => (
                            <Link
                                key={city}
                                href={`/find/pilot-car-operator/${city.toLowerCase().replace(/\s+/g, '-')}`}
                                style={{
                                    padding: '7px 14px', borderRadius: 999,
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                    fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.65)',
                                    textDecoration: 'none', transition: 'all 0.12s',
                                }}
                            >
                                {city}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Corridors from this state ─────────────────────── */}
            {adjacent.length > 0 && (
                <div style={{ padding: '0 16px 28px', maxWidth: 900, margin: '0 auto' }}>
                    <h2 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Active Corridors from {stateName}
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {adjacent.map(dest => (
                            <Link
                                key={dest}
                                href={`/corridors/${state.toLowerCase()}/vs/${dest.toLowerCase()}`}
                                style={{
                                    padding: '7px 16px', borderRadius: 999,
                                    background: 'rgba(212,168,68,0.07)', border: '1px solid rgba(212,168,68,0.18)',
                                    fontSize: 13, fontWeight: 600, color: '#D4A844',
                                    textDecoration: 'none',
                                }}
                            >
                                {stateCode} → {dest}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* ── FAQ snippet block ─────────────────────────────── */}
            <div style={{ padding: '0 16px 28px', maxWidth: 900, margin: '0 auto' }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 14px' }}>
                    Pilot Car Services in {stateName} — FAQ
                </h2>
                {[
                    {
                        q: `Do I need a pilot car in ${stateName}?`,
                        a: `${stateName} requires pilot car escorts for oversize loads exceeding state width, height, or length limits. Requirements vary by load dimensions. Check the ${stateName} escort requirements page for exact thresholds.`,
                    },
                    {
                        q: `How much do pilot car services cost in ${stateName}?`,
                        a: `Pilot car rates in ${stateName} typically range from $3.50 to $6.00 per mile depending on escort type, load classification, and route complexity. Use the Haul Command rate lookup tool for current market rates.`,
                    },
                    {
                        q: `How do I find a pilot car operator in ${stateName}?`,
                        a: `Search the Haul Command directory for verified pilot car operators in ${stateName}. Filter by specialty, availability, and service area. You can also post a load to the load board and receive bids directly.`,
                    },
                ].map(({ q, a }) => (
                    <details key={q} style={{
                        marginBottom: 10, borderRadius: 12,
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        overflow: 'hidden',
                    }}>
                        <summary style={{
                            padding: '14px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                            listStyle: 'none', display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <span style={{ color: '#D4A844' }}>+</span> {q}
                        </summary>
                        <p style={{ padding: '12px 16px 14px', margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            {a}
                        </p>
                    </details>
                ))}
            </div>

            {/* ── Nearby Markets ────────────────────────────────── */}
            {adjacent.length > 0 && (
                <div style={{ padding: '0 16px 28px', maxWidth: 900, margin: '0 auto' }}>
                    <h2 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Nearby Markets
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {adjacent.map(adj => (
                            <Link
                                key={adj}
                                href={`/market/${adj.toLowerCase()}`}
                                style={{
                                    padding: '7px 14px', borderRadius: 999,
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                    fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)',
                                    textDecoration: 'none',
                                }}
                            >
                                {STATE_NAMES[adj] || adj}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* ── No-dead-end block ────────────────────────────── */}
            <NoDeadEndBlock
                heading={`What Would You Like to Do in ${stateName}?`}
                moves={MARKET_NEXT_MOVES(stateName, stateCode)}
                style={{ paddingBottom: 40 }}
            />

            {/* ── Client component: claim pressure (interactive only) ── */}
            <ClaimPressureEngine
                listingId={`market-${stateCode}`}
                listingName={`${stateName} Market`}
                variant="sticky"
                state={stateCode}
                showValueContrast={false}
            />
        </div>
    );
}
