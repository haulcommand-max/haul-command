'use client';

/**
 * ADMIN COUNTRY READINESS DASHBOARD
 *
 * Shows all 120 countries with their:
 * - Market mode (live/seed/dormant)
 * - Operator count
 * - CDS band
 * - AdGrid pricing status
 * - Locale config status
 * - Revenue
 * - Transition readiness
 */

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getAllCountryModes, checkModeTransition, type MarketMode } from '@/lib/ads/market-mode';

interface CountryRow {
    code: string;
    name: string;
    tier: string;
    mode: MarketMode;
    operators: number;
    cds_band: string;
    has_pricing: boolean;
    has_locale: boolean;
    revenue_usd: number;
    transition_ready: boolean;
    transition_reason?: string;
    // From v_next_country_candidates (Supabase)
    db_market_state?: string;
    db_total_score?: number;
    db_recommendation?: string;
    db_all_gates_passed?: boolean;
}

const TIER_COLORS: Record<string, string> = {
    gold: '#F1A91B',
    blue: '#3B82F6',
    silver: '#94A3B8',
    slate: '#64748B',
    copper: '#B87333',
};

const MODE_COLORS: Record<string, string> = {
    live: '#22C55E',
    seed: '#3B82F6',
    dormant: '#64748B',
};

const BAND_COLORS: Record<string, string> = {
    dominant: '#22C55E',
    credible: '#3B82F6',
    emerging: '#F59E0B',
    stealth: '#64748B',
};

export default function CountryReadinessDashboard() {
    const [countries, setCountries] = useState<CountryRow[]>([]);
    const [filter, setFilter] = useState<'all' | 'live' | 'seed' | 'dormant'>('all');
    const [sortBy, setSortBy] = useState<'tier' | 'mode' | 'operators' | 'revenue'>('tier');

    useEffect(() => {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        async function load() {
            // Fetch v_next_country_candidates from Supabase
            const { data: dbRows } = await supabase
                .from('v_next_country_candidates')
                .select('country_code,market_state,total_score,recommendation,all_gates_passed')
                .order('total_score', { ascending: false });

            const dbMap = new Map((dbRows ?? []).map((r: {
                country_code: string; market_state: string;
                total_score: number; recommendation: string; all_gates_passed: boolean;
            }) => [r.country_code, r]));

            // Merge with local market mode config
            const modes = getAllCountryModes();
            const rows: CountryRow[] = modes.map(m => {
                const transition = checkModeTransition(m.code, 0, 'stealth', true);
                const db = dbMap.get(m.code);
                return {
                    code: m.code,
                    name: m.name,
                    tier: m.tier,
                    mode: m.mode,
                    operators: 0,
                    cds_band: 'stealth',
                    has_pricing: true,
                    has_locale: true,
                    revenue_usd: 0,
                    transition_ready: transition.should_transition,
                    transition_reason: transition.reason,
                    db_market_state: db?.market_state,
                    db_total_score: db?.total_score,
                    db_recommendation: db?.recommendation,
                    db_all_gates_passed: db?.all_gates_passed,
                };
            });
            setCountries(rows);
        }
        load();
    }, []);

    const filtered = countries.filter(c => filter === 'all' || c.mode === filter);
    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'tier') {
            const order: Record<string, number> = { gold: 0, blue: 1, silver: 2, slate: 3, copper: 4 };
            return (order[a.tier] ?? 4) - (order[b.tier] ?? 4);
        }
        if (sortBy === 'operators') return b.operators - a.operators;
        if (sortBy === 'revenue') return b.revenue_usd - a.revenue_usd;
        return 0;
    });

    const stats = {
        total: countries.length,
        live: countries.filter(c => c.mode === 'live').length,
        seed: countries.filter(c => c.mode === 'seed').length,
        dormant: countries.filter(c => c.mode === 'dormant').length,
        priced: countries.filter(c => c.has_pricing).length,
    };

    return (
        <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>Country Readiness</h1>
                    <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>All 120 countries • Market modes • Transition status</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 24 }}>
                {[
                    { label: 'Total', value: stats.total, color: '#fff' },
                    { label: 'Live', value: stats.live, color: MODE_COLORS.live },
                    { label: 'Seed', value: stats.seed, color: MODE_COLORS.seed },
                    { label: 'Dormant', value: stats.dormant, color: MODE_COLORS.dormant },
                    { label: 'Priced', value: `${stats.priced}/120`, color: '#F1A91B' },
                ].map(s => (
                    <div key={s.label} style={{
                        padding: '16px', borderRadius: 14, textAlign: 'center',
                        background: `${s.color}08`, border: `1px solid ${s.color}15`,
                    }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {(['all', 'live', 'seed', 'dormant'] as const).map(f => (
                    <button aria-label="Interactive Button"
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            border: f === filter ? '1px solid #F1A91B' : '1px solid rgba(255,255,255,0.1)',
                            background: f === filter ? 'rgba(241,169,27,0.1)' : 'transparent',
                            color: f === filter ? '#F1A91B' : '#888', textTransform: 'capitalize',
                        }}
                    >
                        {f} {f !== 'all' ? `(${countries.filter(c => c.mode === f).length})` : ''}
                    </button>
                ))}
            </div>

            {/* Country Table */}
            <div style={{
                borderRadius: 16, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                {['Country', 'Tier', 'Mode', 'DB State', 'DB Score', 'Operators', 'CDS Band', 'Pricing', 'Locale', 'Promote?'].map(h => (
                                    <th key={h} style={{
                                        padding: '10px 14px', textAlign: h === 'Country' ? 'left' : 'center',
                                        fontSize: 9, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((c, i) => (
                                <tr key={c.code} style={{
                                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                                }}>
                                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                                        {c.code} — {c.name}
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                        <span style={{
                                            fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 6,
                                            background: `${TIER_COLORS[c.tier]}15`, color: TIER_COLORS[c.tier],
                                            textTransform: 'uppercase', letterSpacing: '0.08em',
                                        }}>{c.tier}</span>
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                        <span style={{
                                            fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 6,
                                            background: `${MODE_COLORS[c.mode]}15`, color: MODE_COLORS[c.mode],
                                            textTransform: 'uppercase', letterSpacing: '0.08em',
                                        }}>{c.mode}</span>
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                        {c.db_market_state ? (
                                            <span style={{
                                                fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 6,
                                                background: `${MODE_COLORS[c.db_market_state] || '#888'}15`,
                                                color: MODE_COLORS[c.db_market_state] || '#888',
                                                textTransform: 'uppercase', letterSpacing: '0.08em',
                                            }}>{c.db_market_state}</span>
                                        ) : <span style={{ color: '#444' }}>—</span>}
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                                        {c.db_total_score != null ? (
                                            <span style={{ color: c.db_total_score > 0.5 ? '#22C55E' : c.db_total_score > 0.2 ? '#F59E0B' : '#888', fontWeight: 700 }}>
                                                {(c.db_total_score * 100).toFixed(0)}%
                                            </span>
                                        ) : <span style={{ color: '#444' }}>—</span>}
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: c.operators > 0 ? '#22C55E' : '#888' }}>
                                        {c.operators}
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                        <span style={{
                                            fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                            background: `${BAND_COLORS[c.cds_band] || '#888'}15`, color: BAND_COLORS[c.cds_band] || '#888',
                                        }}>{c.cds_band}</span>
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 14 }}>
                                        {c.has_pricing ? '✅' : '❌'}
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 14 }}>
                                        {c.has_locale ? '✅' : '❌'}
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 12 }}>
                                        {c.db_recommendation && c.db_recommendation !== 'hold' ? (
                                            <span style={{ color: '#F1A91B', fontWeight: 700, fontSize: 10 }}>
                                                ⬆ {c.db_recommendation.replace('promote_to_', '').toUpperCase()}
                                            </span>
                                        ) : c.transition_ready ? (
                                            <span style={{ color: '#F59E0B', fontWeight: 700 }}>⬆ Ready</span>
                                        ) : (
                                            <span style={{ color: '#888' }}>—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
