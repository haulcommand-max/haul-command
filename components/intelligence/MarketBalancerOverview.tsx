'use client';

// ═══════════════════════════════════════════════════════════════
// MARKET BALANCER ADMIN OVERVIEW PANEL
// Surfaces: admin intelligence dashboard
// ═══════════════════════════════════════════════════════════════
import React, { useState } from 'react';
import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { Activity, AlertTriangle, TrendingUp, Shield, Zap, RefreshCw } from 'lucide-react';
import { ACTION_DESCRIPTIONS, ACTION_GUARDRAILS } from '@/lib/market/balancer';

type RowData = {
    region_type: string; region_key: string; country: string;
    market_state: string; severity: string;
    demand_score: number; supply_gap_score: number; surge_pressure_score: number;
    confidence: number; recommended_actions: string[];
    seo_priority_boosted: boolean; updated_at: string;
    is_surge_zone?: boolean; is_chronic_underfill?: boolean;
    avg_pay_per_mile?: number; avg_fill_time_hours?: number;
    sniper_tier?: string;
};

const STATE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    balanced: { label: 'Balanced', color: '#10b981', bg: 'rgba(16,185,129,0.08)', icon: '✅' },
    supply_shortage: { label: 'Supply Shortage', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', icon: '🔴' },
    demand_drop: { label: 'Demand Drop', color: '#6b7280', bg: 'rgba(107,114,128,0.06)', icon: '📉' },
    broker_price_too_low: { label: 'Price Too Low', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: '💸' },
    driver_friction_high: { label: 'Driver Friction', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', icon: '🔧' },
    corridor_risk_spike: { label: 'Corridor Risk', color: '#f97316', bg: 'rgba(249,115,22,0.08)', icon: '⚠️' },
    saturation: { label: 'Saturated', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', icon: '🟦' },
};

const SEV_COLOR: Record<string, string> = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#4b5563' };

const fetcher = async () => {
    const supabase = createClient();
    const { data } = await supabase.from('v_market_heatmap').select('*').order('supply_gap_score', { ascending: false }).limit(60);
    return data ?? [];
};

export default function MarketBalancerOverview() {
    const { data, error, isLoading, mutate } = useSWR<RowData[]>('market_heatmap', fetcher, { refreshInterval: 60_000 });
    const [stateFilter, setStateFilter] = useState<string>('all');
    const [view, setView] = useState<'overview' | 'actions' | 'guardrails'>('overview');

    const rows = (data ?? []).filter(r => stateFilter === 'all' || r.market_state === stateFilter);

    // Summary counts
    const counts = (data ?? []).reduce((acc, r) => {
        acc[r.market_state] = (acc[r.market_state] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div style={{ fontFamily: "'Inter', system-ui", color: '#e5e7eb' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Activity style={{ width: 16, height: 16, color: '#F1A91B' }} />
                    <span style={{ fontWeight: 800, fontSize: 14, color: '#d1d5db' }}>Autonomous Market Balancer</span>
                    <span style={{ fontSize: 9, color: '#4b5563', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: 6, fontWeight: 700, textTransform: 'uppercase' }}>LIVE</span>
                </div>
                <button onClick={() => mutate()} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '4px 10px', color: '#4b5563', cursor: 'pointer', display: 'flex', gap: 4, alignItems: 'center', fontSize: 10, fontWeight: 700 }}>
                    <RefreshCw style={{ width: 10, height: 10 }} /> Refresh
                </button>
            </div>

            {/* State summary pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                <button onClick={() => setStateFilter('all')} style={{ padding: '3px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, border: 'none', cursor: 'pointer', background: stateFilter === 'all' ? 'rgba(241,169,27,0.15)' : 'rgba(255,255,255,0.04)', color: stateFilter === 'all' ? '#F1A91B' : '#6b7280' }}>All ({data?.length ?? 0})</button>
                {Object.entries(STATE_CONFIG).map(([state, cfg]) => counts[state] ? (
                    <button key={state} onClick={() => setStateFilter(state)} style={{ padding: '3px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, border: `1px solid ${cfg.color}25`, cursor: 'pointer', background: stateFilter === state ? cfg.bg : 'rgba(255,255,255,0.02)', color: cfg.color }}>
                        {cfg.icon} {cfg.label} ({counts[state]})
                    </button>
                ) : null)}
            </div>

            {/* View tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 3, width: 'fit-content' }}>
                {(['overview', 'actions', 'guardrails'] as const).map(v => (
                    <button key={v} onClick={() => setView(v)} style={{ padding: '5px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, background: view === v ? 'rgba(241,169,27,0.12)' : 'transparent', color: view === v ? '#F1A91B' : '#6b7280', textTransform: 'capitalize' }}>{v}</button>
                ))}
            </div>

            {isLoading && <div style={{ color: '#4b5563', fontSize: 12, padding: 20, textAlign: 'center' }}>Loading market intelligence...</div>}
            {error && <div style={{ color: '#ef4444', fontSize: 11, padding: 12 }}>Failed to load heatmap data.</div>}

            {/* ── Overview Table ── */}
            {!isLoading && view === 'overview' && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                {['Region', 'Type', 'State', 'Severity', 'Demand', 'Supply Gap', 'Surge', 'Confidence', 'Actions', 'Updated'].map(h => (
                                    <th key={h} style={{ padding: '5px 8px', textAlign: 'left', fontSize: 8, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(r => {
                                const cfg = STATE_CONFIG[r.market_state] ?? STATE_CONFIG.balanced;
                                const actions = Array.isArray(r.recommended_actions) ? r.recommended_actions : [];
                                return (
                                    <tr key={`${r.region_type}-${r.region_key}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.025)' }}>
                                        <td style={{ padding: '6px 8px', fontWeight: 700, color: '#d1d5db', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.region_key}</td>
                                        <td style={{ padding: '6px 8px', color: '#6b7280', textTransform: 'capitalize' }}>{r.region_type}</td>
                                        <td style={{ padding: '6px 8px' }}><span style={{ fontSize: 9, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{cfg.icon} {cfg.label}</span></td>
                                        <td style={{ padding: '6px 8px' }}><span style={{ fontSize: 9, fontWeight: 800, color: SEV_COLOR[r.severity] ?? '#4b5563', textTransform: 'uppercase' }}>{r.severity}</span></td>
                                        <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono', color: '#F1A91B' }}>{r.demand_score ?? '—'}</td>
                                        <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono', color: '#ef4444' }}>{r.supply_gap_score ?? '—'}</td>
                                        <td style={{ padding: '6px 8px', fontFamily: 'JetBrains Mono', color: '#f97316' }}>{r.surge_pressure_score ?? '—'}</td>
                                        <td style={{ padding: '6px 8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                                                    <div style={{ height: 4, borderRadius: 2, background: r.confidence > 0.7 ? '#10b981' : r.confidence > 0.4 ? '#f59e0b' : '#ef4444', width: `${(r.confidence || 0) * 100}%` }} />
                                                </div>
                                                <span style={{ fontSize: 8, color: '#4b5563' }}>{((r.confidence || 0) * 100).toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '6px 8px', color: '#6b7280', fontSize: 9 }}>{actions.length} pending</td>
                                        <td style={{ padding: '6px 8px', color: '#374151', fontSize: 8 }}>{r.updated_at ? new Date(r.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Action Queue ── */}
            {!isLoading && view === 'actions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {rows.filter(r => r.market_state !== 'balanced').flatMap(r =>
                        (Array.isArray(r.recommended_actions) ? r.recommended_actions : []).map((action, i) => (
                            <div key={`${r.region_key}-${action}-${i}`} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10 }}>
                                <Zap style={{ width: 12, height: 12, color: '#F1A91B', flexShrink: 0, marginTop: 1 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#d1d5db', marginBottom: 2 }}>{action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
                                    <div style={{ fontSize: 9, color: '#4b5563' }}>{ACTION_DESCRIPTIONS[action] ?? action} — <strong style={{ color: '#6b7280' }}>{r.region_key}</strong> ({r.region_type})</div>
                                </div>
                                <span style={{ fontSize: 8, color: SEV_COLOR[r.severity] ?? '#4b5563', fontWeight: 800, textTransform: 'uppercase', background: `${SEV_COLOR[r.severity] ?? '#4b5563'}14`, padding: '2px 8px', borderRadius: 6, flexShrink: 0 }}>{r.severity}</span>
                            </div>
                        ))
                    )}
                    {rows.filter(r => r.market_state !== 'balanced').length === 0 && (
                        <div style={{ textAlign: 'center', padding: 24, color: '#4b5563', fontSize: 12 }}>✅ All visible regions are balanced.</div>
                    )}
                </div>
            )}

            {/* ── Guardrails Monitor ── */}
            {view === 'guardrails' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 10 }}>
                    {Object.entries(ACTION_GUARDRAILS).map(([key, val]) => (
                        <div key={key} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                <Shield style={{ width: 10, height: 10, color: '#10b981' }} />
                                <span style={{ fontSize: 9, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: 0.5 }}>{key.replace(/_/g, ' ')}</span>
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: '#d1d5db', fontFamily: 'JetBrains Mono' }}>{typeof val === 'boolean' ? (val ? '✓ ON' : '✗ OFF') : String(val)}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
