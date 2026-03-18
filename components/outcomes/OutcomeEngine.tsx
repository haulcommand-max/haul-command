'use client';

/**
 * OutcomeEngine — Band D Rank 1
 * 
 * Client-side outcome display modules.
 * Shows real completed wins: fills, matches, rescues, claims.
 * Falls back honestly when outcome data is thin.
 * 
 * Components:
 *   - OutcomeTimeline:  Recent wins timeline
 *   - OutcomeSummary:   Key metrics (fills, claims, contacts)
 *   - BrokerOutcomeHistory: Broker-specific post history + outcomes
 */

import { useState, useEffect } from 'react';
import { track } from '@/lib/telemetry';

interface OutcomeItem {
    type: string;
    timestamp: string;
    market: string | null;
    corridor?: string;
    entity?: string;
    detail: string;
    rate?: number;
    service_type?: string;
    confidence: 'confirmed' | 'inferred' | 'active';
}

interface OutcomeSummary {
    total_outcomes: number;
    fills: number;
    confirmed_fills: number;
    inferred_fills: number;
    claims: number;
    contacts: number;
    recent_activity: boolean;
    has_real_outcomes: boolean;
}

function timeAgo(ts: string): string {
    const seconds = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
    load_filled: { icon: '✓', color: '#22C55E', label: 'Filled' },
    likely_filled: { icon: '○', color: '#14B8A6', label: 'Likely Filled' },
    load_posted: { icon: '📋', color: '#3B82F6', label: 'Posted' },
    claim_completed: { icon: '🛡', color: '#F59E0B', label: 'Claimed' },
    escort_contacted: { icon: '📞', color: '#8B5CF6', label: 'Contacted' },
    offer_accepted: { icon: '🤝', color: '#22C55E', label: 'Accepted' },
    rescue_succeeded: { icon: '🚨', color: '#EF4444', label: 'Rescued' },
    partner_application_submitted: { icon: '🏗', color: '#14B8A6', label: 'Applied' },
};

/* ── Outcome Timeline ── */
export function OutcomeTimeline({
    state, corridor, limit = 8, title = 'Recent Wins',
}: {
    state?: string; corridor?: string; limit?: number; title?: string;
}) {
    const [outcomes, setOutcomes] = useState<OutcomeItem[]>([]);
    const [summary, setSummary] = useState<OutcomeSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams();
        if (state) params.set('state', state);
        if (corridor) params.set('corridor', corridor);
        params.set('limit', String(limit));

        fetch(`/api/outcomes?${params}`)
            .then(r => r.ok ? r.json() : { outcomes: [], summary: null })
            .then(d => {
                setOutcomes(d.outcomes || []);
                setSummary(d.summary || null);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [state, corridor, limit]);

    useEffect(() => {
        if (!loading) {
            track('outcome_timeline_seen' as any, {
                metadata: { state, corridor, has_outcomes: outcomes.length > 0, has_real: summary?.has_real_outcomes },
            });
        }
    }, [loading, outcomes.length, summary, state, corridor]);

    if (loading) {
        return (
            <div style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: '40%', height: 14, borderRadius: 6, background: 'rgba(255,255,255,0.04)', marginBottom: 16 }} />
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.03)' }} />
                        <div style={{ flex: 1, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.03)' }} />
                    </div>
                ))}
            </div>
        );
    }

    // Honest fallback for thin outcomes
    if (outcomes.length === 0) {
        return (
            <div style={{
                padding: 20, borderRadius: 16, textAlign: 'center',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                    {title}
                </div>
                <div style={{ fontSize: 13, color: '#888', lineHeight: 1.4 }}>
                    Outcomes build as the market grows. Activity is happening — wins will follow.
                </div>
            </div>
        );
    }

    return (
        <div style={{
            borderRadius: 16, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
        }}>
            <div style={{
                padding: '14px 18px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{title}</div>
                {summary && summary.has_real_outcomes && (
                    <span style={{
                        fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                        background: 'rgba(34,197,94,0.08)', color: '#22C55E',
                    }}>
                        PROVEN
                    </span>
                )}
            </div>

            <div style={{ padding: '8px 0' }}>
                {outcomes.slice(0, limit).map((o, i) => {
                    const config = typeConfig[o.type] || { icon: '●', color: '#888', label: o.type };
                    return (
                        <div key={`${o.type}-${i}`} style={{
                            display: 'flex', gap: 10, alignItems: 'center',
                            padding: '8px 18px',
                        }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                background: `${config.color}08`, border: `1px solid ${config.color}15`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12,
                            }}>
                                {config.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: 12, fontWeight: 700, color: '#ddd',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {o.entity || o.detail}
                                </div>
                                <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>
                                    {config.label} · {timeAgo(o.timestamp)}
                                    {o.confidence === 'inferred' && (
                                        <span style={{ color: '#555', marginLeft: 4 }}>· est.</span>
                                    )}
                                </div>
                            </div>
                            {o.rate && (
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#22C55E' }}>
                                    ${o.rate.toLocaleString()}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ── Outcome Summary ── */
export function OutcomeSummaryBlock({
    state, corridor,
}: {
    state?: string; corridor?: string;
}) {
    const [summary, setSummary] = useState<OutcomeSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams();
        if (state) params.set('state', state);
        if (corridor) params.set('corridor', corridor);

        fetch(`/api/outcomes?${params}`)
            .then(r => r.ok ? r.json() : { summary: null })
            .then(d => { setSummary(d.summary); setLoading(false); })
            .catch(() => setLoading(false));
    }, [state, corridor]);

    if (loading || !summary) return null;

    const metrics = [
        summary.fills > 0 && { value: summary.fills, label: 'Loads Filled', color: '#22C55E', icon: '✓' },
        summary.claims > 0 && { value: summary.claims, label: 'Profiles Claimed', color: '#F59E0B', icon: '🛡' },
        summary.contacts > 0 && { value: summary.contacts, label: 'Contacts Made', color: '#8B5CF6', icon: '📞' },
        !summary.has_real_outcomes && summary.recent_activity && { value: 'Growing', label: 'Market Activity', color: '#3B82F6', icon: '📡' },
    ].filter(Boolean) as { value: string | number; label: string; color: string; icon: string }[];

    if (metrics.length === 0) return null;

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(metrics.length, 3)}, 1fr)`,
            gap: 8,
        }}>
            {metrics.map(m => (
                <div key={m.label} style={{
                    padding: '14px 12px', borderRadius: 14, textAlign: 'center',
                    background: `${m.color}06`, border: `1px solid ${m.color}10`,
                }}>
                    <div style={{ fontSize: 14, marginBottom: 2 }}>{m.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                        {m.label}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── Broker Outcome History ── */
export function BrokerOutcomeHistory({
    limit = 5,
}: {
    limit?: number;
}) {
    const [outcomes, setOutcomes] = useState<OutcomeItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/outcomes?limit=${limit}`)
            .then(r => r.ok ? r.json() : { outcomes: [] })
            .then(d => { setOutcomes(d.outcomes || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [limit]);

    if (loading || outcomes.length === 0) return null;

    const loadOutcomes = outcomes.filter(o =>
        ['load_posted', 'load_filled', 'likely_filled'].includes(o.type)
    );

    if (loadOutcomes.length === 0) return null;

    return (
        <div style={{
            borderRadius: 16, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
        }}>
            <div style={{
                padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                fontSize: 13, fontWeight: 900, color: '#fff',
            }}>
                Your Post History
            </div>
            <div style={{ padding: '4px 0' }}>
                {loadOutcomes.map((o, i) => {
                    const config = typeConfig[o.type] || { icon: '●', color: '#888', label: o.type };
                    return (
                        <div key={i} style={{
                            display: 'flex', gap: 10, alignItems: 'center',
                            padding: '10px 18px',
                            borderBottom: i < loadOutcomes.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                        }}>
                            <span style={{
                                fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 6,
                                background: `${config.color}08`, border: `1px solid ${config.color}15`,
                                color: config.color, textTransform: 'uppercase',
                            }}>
                                {config.label}
                            </span>
                            <div style={{ flex: 1, fontSize: 12, color: '#bbb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {o.detail}
                            </div>
                            <span style={{ fontSize: 10, color: '#888' }}>{timeAgo(o.timestamp)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default OutcomeTimeline;
