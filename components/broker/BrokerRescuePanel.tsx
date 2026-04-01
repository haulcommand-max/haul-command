'use client';

/**
 * BrokerRescuePanel — Band B Rank 1
 * 
 * Contextual rescue action module for broker surfaces.
 * Fetches from /api/broker/rescue and displays:
 *  - Health status badge (healthy / watch / rescue now)
 *  - Urgency reasons
 *  - Ranked rescue actions with impact estimates
 *  - Corridor context strip
 * 
 * Place on: broker home, load detail, corridor command pages.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { track } from '@/lib/telemetry';

interface RescueAction {
    action_id: string;
    label: string;
    description: string;
    priority: 'primary' | 'secondary' | 'tertiary';
    type: string;
    estimated_impact: string;
    href?: string;
}

interface RescueData {
    health_status: 'healthy' | 'at_risk' | 'hard_fill';
    urgency_reasons: string[];
    recommended_actions: RescueAction[];
    corridor_context: {
        lane_load_count: number;
        verified_operator_density: number;
        service_type_mix: string[];
        rate_band: { low: number; mid: number; high: number } | null;
        market_mode: string;
    };
}

const STATUS_CONFIG = {
    healthy: {
        label: 'HEALTHY',
        color: '#22C55E',
        bg: 'rgba(34,197,94,0.08)',
        border: 'rgba(34,197,94,0.2)',
        icon: '✓',
    },
    at_risk: {
        label: 'WATCH',
        color: '#F59E0B',
        bg: 'rgba(245,158,11,0.08)',
        border: 'rgba(245,158,11,0.2)',
        icon: '⚠',
    },
    hard_fill: {
        label: 'RESCUE NOW',
        color: '#EF4444',
        bg: 'rgba(239,68,68,0.08)',
        border: 'rgba(239,68,68,0.2)',
        icon: '🚨',
    },
};

export function BrokerRescuePanel({
    originState,
    destinationState,
    rate,
    ageHours = 0,
    serviceType,
    responseCount = 0,
    variant = 'full',
}: {
    originState?: string;
    destinationState?: string;
    rate?: number;
    ageHours?: number;
    serviceType?: string;
    responseCount?: number;
    variant?: 'full' | 'compact' | 'inline';
}) {
    const [data, setData] = useState<RescueData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams();
        if (originState) params.set('origin_state', originState);
        if (destinationState) params.set('destination_state', destinationState);
        if (rate) params.set('rate', String(rate));
        if (ageHours) params.set('age_hours', String(ageHours));
        if (serviceType) params.set('service_type', serviceType);
        if (responseCount) params.set('responses', String(responseCount));

        fetch(`/api/broker/rescue?${params}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [originState, destinationState, rate, ageHours, serviceType, responseCount]);

    useEffect(() => {
        if (data) {
            track('rescue_panel_seen' as any, {
                entity_type: 'load',
                metadata: {
                    health_status: data.health_status,
                    action_count: data.recommended_actions.length,
                    surface: variant,
                },
            });
        }
    }, [data, variant]);

    if (loading) {
        return (
            <div style={{
                padding: '16px 20px', borderRadius: 16,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', gap: 12, alignItems: 'center',
            }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', animation: 'pulse 1.5s infinite' }} />
                <div style={{ flex: 1, height: 14, borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
            </div>
        );
    }

    if (!data) return null;

    const config = STATUS_CONFIG[data.health_status];
    const primaryActions = data.recommended_actions.filter(a => a.priority === 'primary');
    const secondaryActions = data.recommended_actions.filter(a => a.priority !== 'primary');

    // Don't show panel for healthy loads unless there's context
    if (data.health_status === 'healthy' && variant === 'inline') return null;

    /* ── INLINE variant ── */
    if (variant === 'inline') {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 14px', borderRadius: 10,
                background: config.bg, border: `1px solid ${config.border}`,
            }}>
                <span style={{ fontSize: 14 }}>{config.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: config.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {config.label}
                </span>
                {data.urgency_reasons[0] && (
                    <span style={{ fontSize: 11, color: 'var(--m-text-secondary, #aaa)', flex: 1 }}>
                        — {data.urgency_reasons[0]}
                    </span>
                )}
                {primaryActions[0] && (
                    <Link href={primaryActions[0].href || '#'} onClick={() => {
                        track('rescue_action_clicked' as any, { metadata: { action_id: primaryActions[0].action_id, health: data.health_status } });
                    }} style={{
                        padding: '4px 12px', borderRadius: 8,
                        background: `${config.color}20`, border: `1px solid ${config.color}30`,
                        color: config.color, fontSize: 11, fontWeight: 800,
                        textDecoration: 'none',
                    }}>
                        {primaryActions[0].label}
                    </Link>
                )}
            </div>
        );
    }

    /* ── COMPACT variant ── */
    if (variant === 'compact') {
        return (
            <div style={{
                padding: '16px 18px', borderRadius: 16,
                background: config.bg, border: `1px solid ${config.border}`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 16 }}>{config.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: config.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {config.label}
                    </span>
                    {data.urgency_reasons[0] && (
                        <span style={{ fontSize: 11, color: 'var(--m-text-muted, #888)', flex: 1 }}>
                            {data.urgency_reasons[0]}
                        </span>
                    )}
                </div>
                {primaryActions.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {primaryActions.map(a => (
                            <Link key={a.action_id} href={a.href || '#'} onClick={() => {
                                track('rescue_action_clicked' as any, { metadata: { action_id: a.action_id, health: data.health_status } });
                            }} style={{
                                padding: '8px 16px', borderRadius: 10,
                                background: config.color, color: '#000',
                                fontSize: 12, fontWeight: 800, textDecoration: 'none',
                            }}>
                                {a.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    /* ── FULL variant ── */
    return (
        <div style={{
            borderRadius: 18,
            border: `1px solid ${config.border}`,
            background: `linear-gradient(135deg, ${config.bg}, rgba(0,0,0,0.15))`,
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                padding: '18px 20px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', borderBottom: `1px solid ${config.border}`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: config.bg, border: `1px solid ${config.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18,
                    }}>
                        {config.icon}
                    </div>
                    <div>
                        <div style={{
                            fontSize: 14, fontWeight: 900, color: config.color,
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}>
                            {config.label}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--m-text-muted, #888)', marginTop: 2 }}>
                            {data.urgency_reasons.length > 0
                                ? data.urgency_reasons[0]
                                : 'Load is tracking well'}
                        </div>
                    </div>
                </div>
                {/* Corridor context badges */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span style={{
                        fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: '#fff',
                    }}>
                        {data.corridor_context.lane_load_count} loads
                    </span>
                    <span style={{
                        fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                        background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)',
                        color: '#22C55E',
                    }}>
                        {data.corridor_context.verified_operator_density} verified
                    </span>
                </div>
            </div>

            {/* Urgency reasons (if at_risk or hard_fill) */}
            {data.health_status !== 'healthy' && data.urgency_reasons.length > 0 && (
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--m-text-muted, #888)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                        Why this load needs attention
                    </div>
                    {data.urgency_reasons.map((r, i) => (
                        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 4 }}>
                            <span style={{ color: config.color, fontWeight: 900, fontSize: 12, lineHeight: 1.5 }}>›</span>
                            <span style={{ fontSize: 12, color: 'var(--m-text-secondary, #bbb)', lineHeight: 1.4 }}>{r}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Primary rescue actions */}
            {primaryActions.length > 0 && (
                <div style={{ padding: '14px 20px' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: config.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                        Recommended Next Steps
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {primaryActions.map(action => (
                            <button
                                key={action.action_id}
                                onClick={() => {
                                    track('rescue_action_clicked' as any, {
                                        metadata: { action_id: action.action_id, health: data.health_status, type: action.type },
                                    });
                                }}
                                style={{
                                    padding: '14px 16px', borderRadius: 14, textAlign: 'left',
                                    background: `${config.color}12`, border: `1px solid ${config.color}25`,
                                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{action.label}</div>
                                    <div style={{ fontSize: 11, color: 'var(--m-text-muted, #888)', marginTop: 3 }}>{action.description}</div>
                                </div>
                                <div style={{
                                    fontSize: 9, fontWeight: 800, padding: '4px 10px', borderRadius: 6,
                                    background: `${config.color}15`, color: config.color,
                                    whiteSpace: 'nowrap', marginLeft: 12,
                                }}>
                                    {action.estimated_impact}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Secondary actions (collapsed by default) */}
            {secondaryActions.length > 0 && (
                <div style={{ padding: '0 20px 14px' }}>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        style={{
                            width: '100%', padding: '8px 0',
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 11, fontWeight: 700, color: 'var(--m-text-muted, #888)',
                            textAlign: 'left',
                        }}
                    >
                        {expanded ? '▾' : '▸'} {secondaryActions.length} more action{secondaryActions.length > 1 ? 's' : ''}
                    </button>
                    {expanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                            {secondaryActions.map(action => (
                                <Link
                                    key={action.action_id}
                                    href={action.href || '#'}
                                    onClick={() => {
                                        track('rescue_action_clicked' as any, {
                                            metadata: { action_id: action.action_id, health: data.health_status, type: action.type },
                                        });
                                    }}
                                    style={{
                                        padding: '10px 14px', borderRadius: 12, textDecoration: 'none',
                                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{action.label}</div>
                                        <div style={{ fontSize: 10, color: 'var(--m-text-muted, #888)', marginTop: 2 }}>{action.estimated_impact}</div>
                                    </div>
                                    <span style={{ color: 'var(--m-text-muted)', fontSize: 14 }}>›</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Corridor context strip */}
            {data.corridor_context.rate_band && (
                <div style={{
                    padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex', gap: 16, flexWrap: 'wrap',
                }}>
                    <div style={{ fontSize: 10, color: 'var(--m-text-muted, #888)' }}>
                        Lane rates: <strong style={{ color: '#fff' }}>${data.corridor_context.rate_band.low}–${data.corridor_context.rate_band.high}</strong>
                    </div>
                    {data.corridor_context.service_type_mix.length > 0 && (
                        <div style={{ fontSize: 10, color: 'var(--m-text-muted, #888)' }}>
                            Types: <strong style={{ color: '#fff' }}>{data.corridor_context.service_type_mix.slice(0, 3).join(', ')}</strong>
                        </div>
                    )}
                    <div style={{ fontSize: 10, color: 'var(--m-text-muted, #888)' }}>
                        Mode: <strong style={{ color: config.color }}>{data.corridor_context.market_mode.toUpperCase()}</strong>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BrokerRescuePanel;
