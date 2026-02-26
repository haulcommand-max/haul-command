/**
 * /admin/domination — North America Domination Control Tower
 * Layer 7: Real-time visibility into market domination progress.
 *
 * Panels:
 *  1. National Opportunity Map (top scoring markets)
 *  2. Metro Breakthrough Tracker (8 target cities)
 *  3. Rural Liquidity Progress (thin markets)
 *  4. Active Alerts
 *  5. Cron / Autonomous Engine Health
 */

import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Domination Control Tower | Haul Command',
    robots: 'noindex',
};

export const dynamic = 'force-dynamic';

async function fetchDominationData() {
    const svc = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const safe = async (fn: () => Promise<unknown>, fb: unknown) => {
        try { return await fn(); } catch { return fb; }
    };

    const [topOpps, metros, ruralThin, alerts, tierCounts] = await Promise.all([
        // Top 15 domination opportunities
        safe(() => svc.from('domination_opportunity_scores')
            .select('geo_key,county_name,state_province,market_tier,domination_score,active_operators,is_fcc_county,should_seed_page')
            .order('domination_score', { ascending: false })
            .limit(15) as unknown as Promise<unknown>, { data: [], error: null }),

        // Metro breakthrough targets
        safe(() => svc.from('metro_breakthrough_targets')
            .select('*')
            .order('priority_rank') as unknown as Promise<unknown>, { data: [], error: null }),

        // Rural thin markets
        safe(() => svc.from('domination_opportunity_scores')
            .select('geo_key,county_name,state_province,domination_score,active_operators,is_fcc_county')
            .eq('market_tier', 'rural_thin')
            .order('domination_score', { ascending: false })
            .limit(10) as unknown as Promise<unknown>, { data: [], error: null }),

        // Recent alerts
        safe(() => svc.from('domination_alerts')
            .select('alert_type,city,state,message,severity,fired_at')
            .is('resolved_at', null)
            .order('fired_at', { ascending: false })
            .limit(10) as unknown as Promise<unknown>, { data: [], error: null }),

        // Tier breakdown
        safe(async () => {
            const res = await svc.rpc('exec_sql', {
                sql: `SELECT market_tier, COUNT(*) AS count
                      FROM public.market_zone_tiers
                      GROUP BY market_tier ORDER BY count DESC`
            });
            return res;
        }, { data: null, error: null }),
    ]);

    return {
        topOpps: ((topOpps as any)?.data ?? []) as any[],
        metros: ((metros as any)?.data ?? []) as any[],
        ruralThin: ((ruralThin as any)?.data ?? []) as any[],
        alerts: ((alerts as any)?.data ?? []) as any[],
        tiers: ((tierCounts as any)?.data ?? []) as Array<{ market_tier: string; count: number }>,
    };
}

const TIER_COLOR: Record<string, string> = {
    mega_metro: '#f59e0b',
    major_metro: '#a78bfa',
    mid_market: '#60a5fa',
    rural_thin: '#f87171',
    corridor_critical: '#34d399',
};

const SEVERITY_COLOR: Record<string, string> = {
    critical: '#ef4444',
    warning: '#f59e0b',
    info: '#60a5fa',
};

const PHASE_COLOR: Record<string, string> = {
    planning: '#4b5563',
    active: '#F1A91B',
    dominant: '#10b981',
};

export default async function DominationControlTower() {
    const data = await fetchDominationData();

    const pageCount = 27; // FCC county pages generated
    const cronJobs = 22; // current cron job count

    return (
        <div style={{ minHeight: '100vh', background: '#06070d', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '0' }}>

            {/* Top bar */}
            <div style={{ background: 'rgba(241,169,27,0.05)', borderBottom: '1px solid rgba(241,169,27,0.15)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#F1A91B', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>🌎 North America Domination Engine</div>
                    <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#f9fafb' }}>Control Tower</h1>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981' }}>{cronJobs}</div>
                        <div style={{ color: '#4b5563' }}>Cron Jobs</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#F1A91B' }}>{pageCount}</div>
                        <div style={{ color: '#4b5563' }}>FCC Pages</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#a78bfa' }}>{data.metros.length}</div>
                        <div style={{ color: '#4b5563' }}>Target Metros</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#f87171' }}>{data.alerts.length}</div>
                        <div style={{ color: '#4b5563' }}>Active Alerts</div>
                    </div>
                </div>
            </div>

            <div style={{ padding: '1.5rem 2rem', maxWidth: 1400, margin: '0 auto' }}>

                {/* Market Tier Distribution */}
                {data.tiers.length > 0 && (
                    <div style={{ marginBottom: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {data.tiers.map((t: any) => (
                            <div key={t.market_tier} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${TIER_COLOR[t.market_tier] ?? '#374151'}30`, borderRadius: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: TIER_COLOR[t.market_tier] ?? '#374151' }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: TIER_COLOR[t.market_tier] ?? '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.market_tier?.replace(/_/g, ' ')}</span>
                                <span style={{ fontSize: 14, fontWeight: 900, color: '#f9fafb' }}>{t.count}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

                    {/* TOP OPPORTUNITY MAP */}
                    <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.25rem', gridColumn: '1/2' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
                            🎯 National Opportunity Map — Top 15
                        </div>
                        {data.topOpps.length === 0
                            ? <div style={{ color: '#4b5563', fontSize: 12 }}>Domination scores computing…</div>
                            : data.topOpps.map((m: any, i: number) => (
                                <div key={m.geo_key ?? i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{ width: 22, fontSize: 10, fontWeight: 800, color: '#4b5563', textAlign: 'right', flexShrink: 0 }}>#{i + 1}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {m.county_name}, {m.state_province}
                                            {m.is_fcc_county && <span style={{ fontSize: 8, background: 'rgba(124,58,237,0.2)', color: '#a78bfa', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>FCC</span>}
                                            {m.should_seed_page && <span style={{ fontSize: 8, background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>SEED</span>}
                                        </div>
                                        <div style={{ fontSize: 10, color: '#4b5563' }}>{m.market_tier?.replace(/_/g, ' ')} · {m.active_operators} operators</div>
                                    </div>
                                    {/* Score bar */}
                                    <div style={{ width: 80, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, flexShrink: 0 }}>
                                        <div style={{ width: `${Math.min(100, m.domination_score ?? 0)}%`, height: '100%', borderRadius: 3, background: `linear-gradient(90deg, #F1A91B, #d97706)` }} />
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 900, color: '#F1A91B', flexShrink: 0, minWidth: 36, textAlign: 'right' }}>{m.domination_score ?? '—'}</div>
                                </div>
                            ))
                        }
                    </div>

                    {/* METRO BREAKTHROUGH TRACKER */}
                    <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.25rem' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
                            🏙️ Mega City Assault Engine
                        </div>
                        {data.metros.map((m: any) => (
                            <div key={m.metro_slug} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                <div style={{ width: 24, fontSize: 10, fontWeight: 900, color: '#6b7280', textAlign: 'center' }}>#{m.priority_rank}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f9fafb' }}>{m.city_name}</div>
                                    <div style={{ fontSize: 10, color: '#4b5563' }}>{m.state_province} · {m.country_code}</div>
                                </div>
                                <div style={{ padding: '2px 10px', borderRadius: 12, fontSize: 9, fontWeight: 800, background: `${PHASE_COLOR[m.assault_phase ?? 'planning']}20`, color: PHASE_COLOR[m.assault_phase ?? 'planning'], border: `1px solid ${PHASE_COLOR[m.assault_phase ?? 'planning']}40`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    {m.assault_phase ?? 'planning'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                    {/* RURAL LIQUIDITY WEDGE */}
                    <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.25rem' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
                            🏚️ Rural Thin Markets — Liquidity Wedge
                        </div>
                        {data.ruralThin.length === 0
                            ? <div style={{ color: '#4b5563', fontSize: 12 }}>No rural_thin markets detected yet.</div>
                            : data.ruralThin.map((m: any, i: number) => (
                                <div key={m.geo_key ?? i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#e5e7eb' }}>{m.county_name}, {m.state_province}</div>
                                        <div style={{ fontSize: 10, color: '#4b5563' }}>{m.active_operators} operators {m.is_fcc_county ? '· FCC' : ''}</div>
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 900, color: '#f87171' }}>{m.domination_score ?? '—'}</div>
                                </div>
                            ))
                        }
                    </div>

                    {/* ACTIVE ALERTS */}
                    <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.25rem' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
                            🚨 Domination Alerts
                        </div>
                        {data.alerts.length === 0
                            ? <div style={{ padding: '12px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, fontSize: 11, color: '#10b981', textAlign: 'center' }}>✓ No active alerts</div>
                            : data.alerts.map((a: any, i: number) => (
                                <div key={i} style={{ marginBottom: 8, padding: '8px 10px', borderRadius: 8, background: `${SEVERITY_COLOR[a.severity] ?? '#374151'}10`, borderLeft: `2px solid ${SEVERITY_COLOR[a.severity] ?? '#374151'}` }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: SEVERITY_COLOR[a.severity] ?? '#9ca3af' }}>{a.city}, {a.state}</div>
                                    <div style={{ fontSize: 10, color: '#6b7280' }}>{a.message}</div>
                                </div>
                            ))
                        }

                        {/* Six SEO Gravity Flow Model */}
                        <div style={{ marginTop: 16, padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
                            <div style={{ fontSize: 9, fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>SEO Link Gravity Flow</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, flexWrap: 'wrap' }}>
                                {['FCC/Rural', '→', 'Corridor', '→', 'Metro', '→', 'State', '→', 'National'].map((s, i) => (
                                    <span key={i} style={{ color: s === '→' ? '#374151' : '#6b7280', fontWeight: s === '→' ? 400 : 700 }}>{s}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Autonomous Engine Status */}
                <div style={{ marginTop: 20, padding: '1rem 1.5rem', background: 'rgba(16,185,129,0.03)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                        ⚡ Bo Jackson Autonomy — Cron Engine
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                        {[
                            { name: 'autonomous_recruitment_check', cadence: 'Every 30m', status: 'active' },
                            { name: 'amm_market_make', cadence: 'Hourly :05', status: 'active' },
                            { name: 'amm_zone_rebalance', cadence: 'Hourly :35', status: 'active' },
                            { name: 'refresh_heatmap_snapshots', cadence: 'Daily 1am', status: 'active' },
                            { name: 'fcc_coverage_snapshot', cadence: 'Daily 3am', status: 'active' },
                            { name: 'fire_domination_alerts', cadence: 'Hourly :55', status: 'active' },
                            { name: 'ef_liquidity_refresh', cadence: 'Every 15m', status: 'key_needed' },
                            { name: 'ef_match_engine', cadence: 'Every 5m', status: 'key_needed' },
                        ].map(j => (
                            <div key={j.name} style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, background: j.status === 'active' ? 'rgba(16,185,129,0.08)' : 'rgba(241,169,27,0.05)', borderLeft: `2px solid ${j.status === 'active' ? '#10b981' : '#F1A91B'}` }}>
                                <div style={{ fontWeight: 700, color: j.status === 'active' ? '#10b981' : '#F1A91B', marginBottom: 1 }}>{j.name}</div>
                                <div style={{ color: '#4b5563' }}>{j.cadence} · {j.status === 'key_needed' ? 'needs service key' : '✓ live'}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
