'use client';

// ════════════════════════════════════════════════════════════════
// BROKER DEMAND HEAT MAP DASHBOARD PANEL
// Surfaces: admin intelligence dashboard, recruiter console
// ════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

import { TrendingUp, AlertTriangle, Target, MapPin, Zap } from 'lucide-react';

interface HeatmapRow {
    region_key: string;
    region_type: string;
    country: string;
    demand_score: number;
    supply_gap_score: number;
    zone_type: string;
    is_surge_zone: boolean;
    is_chronic_underfill: boolean;
    is_broker_hotspot: boolean;
    loads_last_30_days: number;
    avg_pay_per_mile: number | null;
    avg_fill_time_hours: number | null;
}

interface CountyRow {
    county_name: string;
    county_slug: string;
    state_province: string;
    country: string;
    supply_gap_score: number;
    tier: string;
    nearest_metro: string | null;
    notes: string | null;
}

const ZONE_CONFIG = {
    prime_expansion: { label: 'Prime Expansion Zone', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', icon: '🔴' },
    competitive: { label: 'Competitive Zone', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: '🟡' },
    emerging: { label: 'Early Opportunity', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.15)', icon: '🔵' },
    monitor: { label: 'Monitor', color: '#4b5563', bg: 'rgba(75,85,99,0.05)', border: 'rgba(75,85,99,0.15)', icon: '⚫' },
};

const SNIPER_CONFIG = {
    sniper: { label: 'Severe Shortage', color: '#dc2626', bar: '#dc2626' },
    expansion: { label: 'Moderate Gap', color: '#f59e0b', bar: '#f59e0b' },
    monitor: { label: 'Background', color: '#4b5563', bar: '#374151' },
    inactive: { label: 'Inactive', color: '#1f2937', bar: '#111827' },
};

export default function BrokerDemandHeatmap() {
    const supabase = createClient();
    const [heatmap, setHeatmap] = useState<HeatmapRow[]>([]);
    const [counties, setCounties] = useState<CountyRow[]>([]);
    const [activeView, setActiveView] = useState<'supply_demand' | 'county_sniper' | 'recruiter'>('supply_demand');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            supabase.from('hc_broker_demand_heatmap').select('*').order('demand_score', { ascending: false }).limit(50),
            supabase.from('hc_county_sniper').select('*').order('supply_gap_score', { ascending: false }).limit(50),
        ]).then(([hRes, cRes]) => {
            setHeatmap(hRes.data ?? []);
            setCounties(cRes.data ?? []);
            setLoading(false);
        });
    }, []);

    const tabs = [
        { id: 'supply_demand', label: 'Supply vs Demand', icon: TrendingUp },
        { id: 'county_sniper', label: 'County Sniper', icon: Target },
        { id: 'recruiter', label: 'Recruiter Feed', icon: MapPin },
    ] as const;

    // Supply vs demand overlay summary
    const zones = heatmap.reduce((acc, r) => {
        acc[r.zone_type] = (acc[r.zone_type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topCounties = counties.filter(c => c.tier === 'sniper').slice(0, 10);
    const recruiterQueue = counties
        .sort((a, b) => (b.supply_gap_score - b.supply_gap_score) || 0)
        .slice(0, 15);

    return (
        <div style={{ fontFamily: "'Inter', system-ui", color: '#e5e7eb' }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveView(t.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                            background: activeView === t.id ? 'rgba(241,169,27,0.15)' : 'transparent',
                            color: activeView === t.id ? '#F1A91B' : '#6b7280',
                            transition: 'all 0.15s',
                        }}>
                        <t.icon style={{ width: 12, height: 12 }} /> {t.label}
                    </button>
                ))}
            </div>

            {loading && <div style={{ color: '#4b5563', fontSize: 12, padding: 20, textAlign: 'center' }}>Loading intelligence feed...</div>}

            {/* ── Supply vs Demand Overlay ── */}
            {!loading && activeView === 'supply_demand' && (
                <div>
                    {/* Zone summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
                        {(Object.entries(ZONE_CONFIG) as [keyof typeof ZONE_CONFIG, typeof ZONE_CONFIG['prime_expansion']][]).map(([zone, cfg]) => (
                            <div key={zone} style={{ borderRadius: 12, border: `1px solid ${cfg.border}`, background: cfg.bg, padding: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: 16, marginBottom: 4 }}>{cfg.icon}</div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: cfg.color, fontFamily: 'JetBrains Mono' }}>{zones[zone] || 0}</div>
                                <div style={{ fontSize: 9, color: cfg.color, textTransform: 'uppercase', fontWeight: 700, marginTop: 2 }}>{cfg.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* All regions table */}
                    {heatmap.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#4b5563', fontSize: 12 }}>
                            No heatmap data yet. Score data is populated as the platform processes loads.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        {['Region', 'Type', 'Demand', 'Supply Gap', 'Zone', 'PPM', 'Fill Time', 'Flags'].map(h => (
                                            <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700, color: '#4b5563', fontSize: 9, textTransform: 'uppercase' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {heatmap.map(r => {
                                        const z = ZONE_CONFIG[r.zone_type as keyof typeof ZONE_CONFIG] || ZONE_CONFIG.monitor;
                                        return (
                                            <tr key={r.region_key} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                <td style={{ padding: '7px 8px', fontWeight: 600, color: '#d1d5db' }}>{r.region_key}</td>
                                                <td style={{ padding: '7px 8px', color: '#6b7280', textTransform: 'capitalize' }}>{r.region_type}</td>
                                                <td style={{ padding: '7px 8px', fontFamily: 'JetBrains Mono', color: '#F1A91B', fontWeight: 700 }}>{r.demand_score?.toFixed(0)}</td>
                                                <td style={{ padding: '7px 8px', fontFamily: 'JetBrains Mono', color: '#ef4444' }}>{r.supply_gap_score?.toFixed(0)}</td>
                                                <td style={{ padding: '7px 8px' }}><span style={{ fontSize: 9, fontWeight: 700, color: z.color, background: z.bg, border: `1px solid ${z.border}`, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>{z.icon} {z.label}</span></td>
                                                <td style={{ padding: '7px 8px', color: '#d1d5db' }}>{r.avg_pay_per_mile ? `$${r.avg_pay_per_mile}/mi` : '—'}</td>
                                                <td style={{ padding: '7px 8px', color: r.avg_fill_time_hours && r.avg_fill_time_hours > 6 ? '#ef4444' : '#6b7280' }}>{r.avg_fill_time_hours ? `${r.avg_fill_time_hours}h` : '—'}</td>
                                                <td style={{ padding: '7px 8px', display: 'flex', gap: 4 }}>
                                                    {r.is_surge_zone && <span title="Surge Zone" style={{ fontSize: 12 }}>⚡</span>}
                                                    {r.is_chronic_underfill && <span title="Chronic Underfill" style={{ fontSize: 12 }}>🔴</span>}
                                                    {r.is_broker_hotspot && <span title="Broker Hotspot" style={{ fontSize: 12 }}>🎯</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── County Sniper ── */}
            {!loading && activeView === 'county_sniper' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                        {counties.map(c => {
                            const cfg = SNIPER_CONFIG[c.tier as keyof typeof SNIPER_CONFIG] || SNIPER_CONFIG.inactive;
                            const pct = c.supply_gap_score || 0;
                            return (
                                <div key={c.county_slug} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${cfg.color}20`, borderRadius: 14, padding: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 800, color: '#d1d5db' }}>{c.county_name}</div>
                                            <div style={{ fontSize: 10, color: '#4b5563' }}>{c.state_province} · {c.country}</div>
                                            {c.nearest_metro && <div style={{ fontSize: 9, color: '#374151', marginTop: 2 }}>📍 {c.nearest_metro}</div>}
                                        </div>
                                        <span style={{ fontSize: 9, fontWeight: 800, color: cfg.color, background: `${cfg.color}14`, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase' }}>{cfg.label}</span>
                                    </div>
                                    {/* Score bar */}
                                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 4, height: 4, marginBottom: 6 }}>
                                        <div style={{ height: 4, borderRadius: 4, background: cfg.bar, width: `${pct}%`, transition: 'width 0.6s' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#4b5563' }}>
                                        <span>Gap Score: <strong style={{ color: cfg.color }}>{pct.toFixed(0)}</strong>/100</span>
                                        <a href={`/county/${c.county_slug}/pilot-car`} style={{ color: '#F1A91B', fontWeight: 700, textDecoration: 'none', fontSize: 9 }}>View Page →</a>
                                    </div>
                                    {c.notes && <div style={{ fontSize: 9, color: '#374151', marginTop: 6, fontStyle: 'italic' }}>{c.notes}</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Recruiter Feed ── */}
            {!loading && activeView === 'recruiter' && (
                <div>
                    <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 12 }}>Top targets by supply gap × demand, sorted by expected driver value opportunity.</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {counties.slice(0, 20).map((c, i) => {
                            const cfg = SNIPER_CONFIG[c.tier as keyof typeof SNIPER_CONFIG] || SNIPER_CONFIG.inactive;
                            const channel = c.supply_gap_score >= 80 ? 'Facebook Group' : c.supply_gap_score >= 60 ? 'Push + Organic' : 'Organic SEO';
                            const urgency = c.tier === 'sniper' ? 'CRITICAL' : c.tier === 'expansion' ? 'HIGH' : 'MEDIUM';
                            const urgencyColor = c.tier === 'sniper' ? '#ef4444' : c.tier === 'expansion' ? '#f59e0b' : '#3b82f6';
                            return (
                                <div key={c.county_slug} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10 }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#4b5563', flexShrink: 0 }}>#{i + 1}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#d1d5db' }}>{c.county_name}, {c.state_province}</div>
                                        <div style={{ fontSize: 9, color: '#4b5563' }}>Channel: <span style={{ color: '#6b7280', fontWeight: 600 }}>{channel}</span> · Gap: <strong style={{ color: cfg.color }}>{(c.supply_gap_score || 0).toFixed(0)}</strong></div>
                                    </div>
                                    <span style={{ fontSize: 8, fontWeight: 800, color: urgencyColor, background: `${urgencyColor}14`, padding: '2px 8px', borderRadius: 6, flexShrink: 0 }}>{urgency}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
