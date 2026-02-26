"use client";

import React from 'react';
import useSWR from 'swr';

type CorridorCard = {
    corridor_slug: string;
    loads_7d: number;
    fills_7d: number;
    fill_rate_pct: number;
    avg_fill_minutes: number;
    avg_rate_est: number;
    supply_online: number;
    supply_total: number;
    corridor_score: number;
    letter_grade: string;
};

type DriverCard = {
    user_id: string;
    display_name: string;
    home_state: string;
    trust_score: number;
    response_time_minutes: number;
    jobs_completed: number;
    acceptance_rate: number;
    verification_density: number;
    rank_tier: string;
    improvement_tips: string[];
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

const GRADE_COLORS: Record<string, string> = {
    A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#ef4444',
};

const TIER_COLORS: Record<string, string> = {
    Elite: '#F1A91B', Pro: '#10b981', Verified: '#3b82f6', Starter: '#6b7280',
};

// ── Corridor Report Card ─────────────────────
export function CorridorReportCard({ corridorSlug }: { corridorSlug: string }) {
    const { data, isLoading } = useSWR<CorridorCard>(
        `/api/report-cards/corridor?slug=${corridorSlug}`,
        fetcher,
        { refreshInterval: 120_000 }
    );

    if (isLoading) return <div style={{ padding: '1rem', color: '#6b7280', fontSize: 12 }}>Loading corridor intel…</div>;
    if (!data) return null;

    const gc = GRADE_COLORS[data.letter_grade] || '#6b7280';

    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '1.25rem', marginBottom: '1rem',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 2 }}>
                        Corridor Report Card
                    </span>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb', marginTop: 2 }}>
                        {corridorSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </div>
                </div>
                <div style={{
                    width: 48, height: 48, borderRadius: 12, background: `${gc}18`,
                    border: `2px solid ${gc}40`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column',
                }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: gc, fontFamily: 'JetBrains Mono, monospace' }}>
                        {data.letter_grade}
                    </span>
                    <span style={{ fontSize: 8, fontWeight: 700, color: gc }}>{data.corridor_score}/100</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                    { label: 'Fill Rate', val: `${data.fill_rate_pct}%` },
                    { label: 'Avg Fill', val: `${data.avg_fill_minutes}m` },
                    { label: 'Avg Rate', val: `$${data.avg_rate_est}` },
                    { label: 'Loads 7d', val: `${data.loads_7d}` },
                    { label: 'Online', val: `${data.supply_online}` },
                    { label: 'Total Escorts', val: `${data.supply_total}` },
                ].map(m => (
                    <div key={m.label} style={{ textAlign: 'center', padding: '8px 0' }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#f9fafb', fontFamily: 'JetBrains Mono, monospace' }}>{m.val}</div>
                        <div style={{ fontSize: 8, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{m.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Driver Report Card ───────────────────────
export function DriverReportCard({ userId }: { userId: string }) {
    const { data, isLoading } = useSWR<DriverCard>(
        `/api/report-cards/driver?id=${userId}`,
        fetcher,
        { refreshInterval: 300_000 }
    );

    if (isLoading) return <div style={{ padding: '1rem', color: '#6b7280', fontSize: 12 }}>Loading profile intel…</div>;
    if (!data) return null;

    const tc = TIER_COLORS[data.rank_tier] || '#6b7280';

    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '1.25rem', marginBottom: '1rem',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb' }}>
                        {data.display_name || 'Operator'}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280' }}>
                        {data.home_state} • {data.jobs_completed} jobs
                    </span>
                </div>
                <div style={{
                    padding: '4px 12px', borderRadius: 20,
                    background: `${tc}18`, border: `1px solid ${tc}40`,
                    fontSize: 10, fontWeight: 800, color: tc, textTransform: 'uppercase', letterSpacing: 1,
                }}>
                    {data.rank_tier}
                </div>
            </div>

            {/* Trust Score Bar */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase' }}>Trust Score</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: tc, fontFamily: 'JetBrains Mono, monospace' }}>{data.trust_score}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${data.trust_score}%`, height: '100%', background: tc, borderRadius: 3, transition: 'width 1s ease' }} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                {[
                    { label: 'Response', val: `${data.response_time_minutes}m` },
                    { label: 'Accept Rate', val: `${data.acceptance_rate}%` },
                    { label: 'Verified', val: `${data.verification_density}%` },
                ].map(m => (
                    <div key={m.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#f9fafb', fontFamily: 'JetBrains Mono, monospace' }}>{m.val}</div>
                        <div style={{ fontSize: 8, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginTop: 2 }}>{m.label}</div>
                    </div>
                ))}
            </div>

            {/* Improvement Tips */}
            {data.improvement_tips?.length > 0 && (
                <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                        💡 Improvement Tips
                    </div>
                    {data.improvement_tips.map((tip, i) => (
                        <div key={i} style={{ fontSize: 11, color: '#d1d5db', lineHeight: 1.4, marginBottom: 3 }}>
                            • {tip}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Broker Report Card ───────────────────────
type BrokerCard = {
    broker_id: string;
    display_name: string;
    trust_score: number;
    jobs_posted: number;
    avg_payment_days: number | null;
    fill_rate_pct: number;
    rank_tier: string;
    community_score_avg: number;
    improvement_tips: string[];
};

const BROKER_TIER_COLORS: Record<string, string> = {
    Preferred: '#10b981', Standard: '#3b82f6', New: '#6b7280', Warning: '#ef4444'
};

export function BrokerReportCard({ brokerId, condensed = false }: { brokerId: string, condensed?: boolean }) {
    const { data } = useSWR<BrokerCard>(
        brokerId ? `/api/report-cards/broker?id=${brokerId}` : null,
        fetcher,
        { refreshInterval: 300_000 }
    );

    if (!data) return null;

    const tc = BROKER_TIER_COLORS[data.rank_tier] || '#6b7280';

    if (condensed) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
                <span style={{ color: tc }} className="text-[10px] font-bold uppercase tracking-wider">{data.rank_tier} Broker</span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-300 font-mono">Trust: {data.trust_score}</span>
            </div>
        );
    }

    return (
        <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 16, padding: '1.25rem', marginBottom: '1rem',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 2 }}>Broker Trust Spec</span>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb', marginTop: 2 }}>
                        {data.display_name || 'Network Broker'}
                    </div>
                </div>
                <div style={{
                    padding: '6px 14px', borderRadius: 8,
                    background: `${tc}15`, border: `1px solid ${tc}30`,
                    fontSize: 11, fontWeight: 800, color: tc, textTransform: 'uppercase', letterSpacing: 1,
                }}>
                    {data.rank_tier}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 12 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#f9fafb', fontFamily: 'JetBrains Mono, monospace' }}>{data.trust_score}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginTop: 4 }}>Trust Score</div>
                </div>
                <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 12 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#f9fafb', fontFamily: 'JetBrains Mono, monospace' }}>{data.avg_payment_days ? `${data.avg_payment_days}d` : '--'}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginTop: 4 }}>Avg Payment</div>
                </div>
                <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 12 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#f9fafb', fontFamily: 'JetBrains Mono, monospace' }}>{data.fill_rate_pct}%</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginTop: 4 }}>Fill Rate</div>
                </div>
            </div>

            <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.5, background: '#000', padding: 12, borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)' }}>
                Based on {data.jobs_posted} historic jobs and routing data. {data.community_score_avg ? `Community vibe is ${data.community_score_avg}/5.` : ''}
            </div>
        </div>
    );
}
