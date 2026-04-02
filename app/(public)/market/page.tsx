import Link from 'next/link';
import { MobileGate } from '@/components/mobile/MobileGate';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const US_STATES = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
    'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
    'VA','WA','WV','WI','WY','DC',
];

const STATE_NAMES: Record<string, string> = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
    HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
    KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
    MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
    NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
    OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
    SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
    VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
    DC: 'Washington DC',
};

const MODE_CONFIG = {
    live: { color: '#22C55E', emoji: '🟢', label: 'LIVE' },
    seeding: { color: '#F59E0B', emoji: '🌱', label: 'SEEDING' },
    demand_capture: { color: '#8B5CF6', emoji: '📡', label: 'DEMAND' },
    waitlist: { color: '#6B7280', emoji: '⏳', label: 'WAITLIST' },
};

function determineMode(activeLoads: number, totalOps: number, verifiedOps: number) {
    if (totalOps >= 3 && activeLoads > 0) return 'live';
    if (totalOps >= 1) return 'seeding';
    if (activeLoads > 0 && totalOps === 0) return 'demand_capture';
    return 'waitlist';
}

export default async function MarketIndexPage() {
    const supabase = getSupabaseAdmin();

    const [ { data: loads }, { data: ops } ] = await Promise.all([
        supabase.from('hc_load_alerts').select('origin_state, destination_state, ingested_at').eq('status', 'active'),
        supabase.from('directory_listings').select('home_base_state, verification_status')
    ]);

    const stateModes: Record<string, 'live' | 'seeding' | 'demand_capture' | 'waitlist'> = {};

    for (const code of US_STATES) {
        let activeLoads = 0;
        if (loads) {
            loads.forEach(l => {
                if (l.origin_state?.toUpperCase() === code || l.destination_state?.toUpperCase() === code) activeLoads++;
            });
        }
        
        let totalOps = 0;
        let verifiedOps = 0;
        if (ops) {
            ops.forEach(op => {
                if (op.home_base_state?.toUpperCase() === code) {
                    totalOps++;
                    if (op.verification_status === 'verified') verifiedOps++;
                }
            });
        }

        stateModes[code] = determineMode(activeLoads, totalOps, verifiedOps);
    }

    const sortedStates = [...US_STATES].sort((a, b) => {
        // Priority: live > demand > seeding > waitlist
        const priority = { live: 1, demand_capture: 2, seeding: 3, waitlist: 4 };
        const pA = priority[stateModes[a]];
        const pB = priority[stateModes[b]];
        if (pA !== pB) return pA - pB;
        return a.localeCompare(b);
    });

    const content = (
        <div style={{ minHeight: '100vh', background: '#060b12', color: '#f5f7fb' }}>
            <div style={{ maxWidth: 1080, margin: '0 auto', padding: '48px 16px 88px' }}>
                {/* Hero */}
                <div style={{
                    padding: '28px', borderRadius: 24,
                    border: '1px solid rgba(198,146,58,0.18)',
                    background: 'linear-gradient(145deg, rgba(12,16,22,0.98), rgba(17,20,28,0.92))',
                    marginBottom: 32,
                }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '6px 12px', borderRadius: 999,
                        border: '1px solid rgba(198,146,58,0.18)', background: 'rgba(198,146,58,0.08)',
                        color: '#D4A844', fontSize: 12, fontWeight: 800,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                    }}>
                        Market Intelligence
                    </div>
                    <h1 style={{
                        margin: '16px 0 10px',
                        fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                        lineHeight: 1.02, letterSpacing: '-0.04em', fontWeight: 900,
                    }}>
                        Heavy haul markets, live.
                    </h1>
                    <p style={{ maxWidth: 720, margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: 16, lineHeight: 1.65 }}>
                        Every state has its own escort regulations, operator density, and load activity.
                        Tap a market to see live truth — active loads, verified operators, and your next move.
                    </p>
                </div>

                {/* State grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 1fr))',
                    gap: 10,
                }}>
                    {sortedStates.map(code => {
                        const name = STATE_NAMES[code] || code;
                        const modeStr = stateModes[code] || 'waitlist';
                        const mode = MODE_CONFIG[modeStr];
                        const isHot = modeStr === 'live' || modeStr === 'seeding' || modeStr === 'demand_capture';
                        
                        return (
                            <Link key={code} href={`/market/${code.toLowerCase()}`} style={{
                                display: 'block',
                                padding: '16px 14px', borderRadius: 14,
                                border: `1px solid ${isHot ? mode.color + '40' : 'rgba(255,255,255,0.06)'}`,
                                background: isHot
                                    ? `linear-gradient(160deg, rgba(17,20,28,0.98), ${mode.color}0A)`
                                    : 'rgba(255,255,255,0.02)',
                                textDecoration: 'none',
                                transition: 'border-color 0.2s',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ fontSize: 20, fontWeight: 900, color: isHot ? mode.color : '#fff' }}>{code}</span>
                                    <span style={{ fontSize: 14 }} title={mode.label}>{mode.emoji}</span>
                                </div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                                    {name}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    return <MobileGate mobile={content} desktop={content} />;
}
