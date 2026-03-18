'use client';

/**
 * OutcomeProofBlock — Band C Rank 1
 * 
 * Reusable outcome proof component system.
 * Answers: "Why is Haul Command better?" in under 3 seconds.
 * 
 * Variants:
 *   - compact:     Single-line proof strip
 *   - strip:       Horizontal scrolling metrics
 *   - stacked:     Vertical cards with context
 *   - comparison:  Before/after or vs-incumbent block
 * 
 * Fetches live data from /api/market/heartbeat for real metrics.
 * Falls back to honest readiness states for thin markets.
 */

import { useState, useEffect } from 'react';
import { track } from '@/lib/telemetry';

interface OutcomeMetric {
    key: string;
    label: string;
    value: string | number;
    subtext?: string;
    color: string;
    icon: string;
}

interface OutcomeProofProps {
    variant?: 'compact' | 'strip' | 'stacked' | 'comparison';
    surface: 'home' | 'market' | 'corridor' | 'broker' | 'profile';
    state?: string;
    corridor?: string;
    className?: string;
}

interface HeartbeatData {
    active_loads: number;
    verified_operators: number;
    total_operators: number;
    claimed_operators: number;
    market_mode: string;
    freshness_label: string;
    service_type_mix: Record<string, number>;
}

function buildMetrics(data: HeartbeatData | null, surface: string): OutcomeMetric[] {
    if (!data) {
        return [
            { key: 'status', label: 'Status', value: 'Loading', color: '#6B7280', icon: '⏳', subtext: 'Checking market...' },
        ];
    }

    const metrics: OutcomeMetric[] = [];
    const mode = data.market_mode;

    // Always show verified supply
    if (data.verified_operators > 0) {
        metrics.push({
            key: 'verified_supply', label: 'Verified Supply', value: data.verified_operators,
            subtext: 'operators verified & ready', color: '#22C55E', icon: '✓',
        });
    }

    // Active loads
    if (data.active_loads > 0) {
        metrics.push({
            key: 'active_loads', label: 'Active Loads', value: data.active_loads,
            subtext: 'open loads right now', color: '#3B82F6', icon: '📋',
        });
    }

    // Market density
    if (data.total_operators > 5) {
        metrics.push({
            key: 'market_density', label: 'Market Density', value: data.total_operators,
            subtext: 'operators in network', color: '#8B5CF6', icon: '📡',
        });
    }

    // Claim momentum
    if (data.claimed_operators > 0) {
        metrics.push({
            key: 'claim_momentum', label: 'Claimed', value: data.claimed_operators,
            subtext: 'operators claimed their profile', color: '#F59E0B', icon: '🛡',
        });
    }

    // Service type coverage
    const serviceCount = Object.keys(data.service_type_mix || {}).length;
    if (serviceCount > 0) {
        metrics.push({
            key: 'service_coverage', label: 'Service Types', value: serviceCount,
            subtext: 'specializations covered', color: '#14B8A6', icon: '🔧',
        });
    }

    // Fill speed (estimated from freshness)
    if (mode === 'live' && data.active_loads > 3) {
        metrics.push({
            key: 'fill_speed', label: 'Response Speed', value: 'Fast',
            subtext: `${data.freshness_label} last activity`, color: '#22C55E', icon: '⚡',
        });
    }

    // Thin market fallback
    if (metrics.length < 2) {
        if (mode === 'seeding') {
            metrics.push({
                key: 'early_advantage', label: 'Early Advantage', value: 'Available',
                subtext: 'Be among the first verified here', color: '#F59E0B', icon: '🌱',
            });
        } else if (mode === 'demand_capture') {
            metrics.push({
                key: 'demand_signal', label: 'Demand Detected', value: 'Growing',
                subtext: 'Loads flowing, supply thin — opportunity', color: '#8B5CF6', icon: '📡',
            });
        } else {
            metrics.push({
                key: 'market_readiness', label: 'Market', value: 'Building',
                subtext: 'Coverage expanding — claim early', color: '#6B7280', icon: '🏗',
            });
        }
    }

    // Surface-specific additions
    if (surface === 'broker' && data.verified_operators > 0) {
        metrics.push({
            key: 'rescue_coverage', label: 'Rescue Coverage', value: 'Active',
            subtext: 'Contextual rescue actions available', color: '#EF4444', icon: '🚨',
        });
    }

    return metrics.slice(0, 6); // Max 6 metrics
}

export function OutcomeProofBlock({
    variant = 'strip',
    surface = 'home',
    state,
    corridor,
    className = '',
}: OutcomeProofProps) {
    const [data, setData] = useState<HeartbeatData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams();
        if (state) params.set('state', state);
        if (corridor) params.set('corridor', corridor);

        fetch(`/api/market/heartbeat?${params}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [state, corridor]);

    useEffect(() => {
        if (!loading) {
            track('outcome_proof_seen' as any, {
                metadata: { surface, variant, market_mode: data?.market_mode || 'unknown', has_data: !!data },
            });
        }
    }, [loading, data, surface, variant]);

    const metrics = buildMetrics(data, surface);

    /* ── COMPACT variant ── */
    if (variant === 'compact') {
        const top = metrics[0];
        if (!top) return null;
        return (
            <div className={className} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                background: `${top.color}08`, border: `1px solid ${top.color}15`,
            }}>
                <span style={{ fontSize: 14 }}>{top.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: top.color }}>{top.value}</span>
                <span style={{ fontSize: 11, color: 'var(--m-text-muted, #888)' }}>{top.subtext}</span>
            </div>
        );
    }

    /* ── STRIP variant ── */
    if (variant === 'strip') {
        return (
            <div className={className} style={{
                display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 0',
                scrollbarWidth: 'none', msOverflowStyle: 'none',
            }}>
                {metrics.map(m => (
                    <div key={m.key} style={{
                        flex: '0 0 auto', padding: '12px 16px', borderRadius: 14,
                        background: `${m.color}06`, border: `1px solid ${m.color}12`,
                        minWidth: 120, textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 14 }}>{m.icon}</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: m.color, marginTop: 4 }}>
                            {m.value}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: m.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                            {m.label}
                        </div>
                        {m.subtext && (
                            <div style={{ fontSize: 9, color: 'var(--m-text-muted, #888)', marginTop: 4 }}>
                                {m.subtext}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    /* ── STACKED variant ── */
    if (variant === 'stacked') {
        return (
            <div className={className} style={{
                display: 'flex', flexDirection: 'column', gap: 8,
            }}>
                <div style={{
                    fontSize: 10, fontWeight: 900, color: 'var(--m-text-muted, #888)',
                    textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4,
                }}>
                    Why This Works
                </div>
                {metrics.map(m => (
                    <div key={m.key} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px', borderRadius: 14,
                        background: `${m.color}05`, border: `1px solid ${m.color}10`,
                    }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: `${m.color}10`, border: `1px solid ${m.color}18`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16, flexShrink: 0,
                        }}>
                            {m.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
                                {m.label}: <span style={{ color: m.color }}>{m.value}</span>
                            </div>
                            {m.subtext && (
                                <div style={{ fontSize: 10, color: 'var(--m-text-muted, #888)', marginTop: 2 }}>
                                    {m.subtext}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    /* ── COMPARISON variant ── */
    return (
        <div className={className} style={{
            borderRadius: 18, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
        }}>
            <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
                <div style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.02)', color: '#888', textAlign: 'center' }}>
                    Without Haul Command
                </div>
                <div style={{ padding: '10px 16px', background: 'rgba(241,169,27,0.06)', color: '#F1A91B', textAlign: 'center' }}>
                    With Haul Command
                </div>
            </div>
            {[
                { without: 'Cold-call directories', with: `${data?.verified_operators || '—'} verified operators`, icon: '✓' },
                { without: 'Unknown market conditions', with: data?.market_mode === 'live' ? 'Live market truth' : 'Real-time mode detection', icon: '📡' },
                { without: 'No rate intelligence', with: 'Lane rate bands & rescue actions', icon: '💰' },
                { without: 'Manual operator vetting', with: 'Trust scores & verification', icon: '🛡' },
            ].map((row, i) => (
                <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                }}>
                    <div style={{
                        padding: '10px 16px', fontSize: 12, color: '#555',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <span style={{ color: '#EF4444', fontSize: 10 }}>✗</span> {row.without}
                    </div>
                    <div style={{
                        padding: '10px 16px', fontSize: 12, color: '#ccc',
                        background: 'rgba(241,169,27,0.02)',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <span style={{ fontSize: 10 }}>{row.icon}</span> {row.with}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default OutcomeProofBlock;
