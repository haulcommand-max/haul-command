'use client';

/**
 * Operator Command Center Dashboard
 *
 * The "daily hab" surface — everything an operator needs to see on app open:
 *   - Momentum Score (band + trend)
 *   - Availability Toggle (with realtime broker notification)  
 *   - Opportunity Radar (jobs near you, missed loads)
 *   - Profile Strength Meter
 *   - Hot Corridors
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ProfileStrengthMeter } from './ProfileStrengthMeter';

// ── Types ────────────────────────────────────────────────────────────────────

interface MomentumData {
    total: number;
    band: string;
    band_label: string;
    band_emoji: string;
    visibility_multiplier: number;
    components: {
        profile_completeness: number;
        response_speed: number;
        recent_activity: number;
        availability_uptime: number;
    };
    trend: 'up' | 'flat' | 'down';
    weekly_delta: number;
}

interface OpportunityData {
    jobs_near_you: number;
    hot_corridors: { name: string; demand_level: string; loads_this_week: number }[];
    missed_opportunities: { load_id: string; corridor: string; posted_ago: string; reason: string }[];
}

// ── Component ────────────────────────────────────────────────────────────────

export function OperatorCommandCenter({ userId }: { userId: string }) {
    const supabase = createClient();
    const [momentum, setMomentum] = useState<MomentumData | null>(null);
    const [opportunities, setOpportunities] = useState<OpportunityData | null>(null);
    const [availability, setAvailability] = useState<'available' | 'busy' | 'offline'>('offline');
    const [toggling, setToggling] = useState(false);
    const [boostActive, setBoostActive] = useState(false);
    const [brokersNotified, setBrokersNotified] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [momentumRes, radarRes, statusRes] = await Promise.all([
                    fetch(`/api/operator/momentum?userId=${userId}`).then(r => r.json()),
                    fetch(`/api/operator/radar?userId=${userId}`).then(r => r.json()),
                    supabase.from('driver_profiles').select('availability_status').eq('user_id', userId).single(),
                ]);
                setMomentum(momentumRes);
                setOpportunities(radarRes);
                setAvailability(statusRes.data?.availability_status ?? 'offline');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [userId, supabase]);

    const toggleAvailability = useCallback(async () => {
        const newStatus = availability === 'available' ? 'offline' : 'available';
        setToggling(true);
        try {
            const res = await fetch('/api/operator/toggle-availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                const data = await res.json();
                setAvailability(newStatus);
                if (data.visibility_boost) setBoostActive(true);
                setBrokersNotified(data.matching_brokers_notified ?? 0);
                setTimeout(() => setBrokersNotified(0), 5000);
            }
        } finally {
            setToggling(false);
        }
    }, [availability]);

    if (loading) {
        return (
            <div style={{
                padding: 32, textAlign: 'center',
                fontFamily: "'Inter', system-ui, sans-serif",
            }}>
                <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    border: '3px solid #1e293b', borderTopColor: '#f97316',
                    animation: 'spin 1s linear infinite', margin: '0 auto 16px',
                }} />
                <p style={{ color: '#64748b', fontSize: 13 }}>Loading Command Center...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const trendEmoji = momentum?.trend === 'up' ? '📈' : momentum?.trend === 'down' ? '📉' : '➡️';
    const trendColor = momentum?.trend === 'up' ? '#22c55e' : momentum?.trend === 'down' ? '#ef4444' : '#94a3b8';

    return (
        <div style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            color: '#e2e8f0',
            display: 'flex', flexDirection: 'column', gap: 16,
        }}>
            {/* ── TOP ROW: Momentum + Availability ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Momentum Score */}
                <div style={{
                    background: '#0f172a', border: '1px solid #1e293b',
                    borderRadius: 16, padding: '20px 24px',
                }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        Momentum
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 36, fontWeight: 900, fontFeatureSettings: '"tnum"', color: '#e2e8f0' }}>
                            {momentum?.total ?? 0}
                        </span>
                        <span style={{ fontSize: 20 }}>{momentum?.band_emoji}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                            fontSize: 10, fontWeight: 800, color: '#0f172a',
                            background: momentum?.band === 'rising' ? '#22c55e' : momentum?.band === 'steady' ? '#fbbf24' : momentum?.band === 'cooling' ? '#f97316' : '#64748b',
                            padding: '2px 8px', borderRadius: 4,
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                            {momentum?.band_label}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: trendColor }}>
                            {trendEmoji} {momentum?.weekly_delta !== undefined && momentum.weekly_delta > 0 ? '+' : ''}{momentum?.weekly_delta ?? 0} this week
                        </span>
                    </div>

                    {/* Visibility multiplier */}
                    <div style={{
                        marginTop: 12, padding: '6px 10px',
                        background: 'rgba(99,102,241,0.06)', borderRadius: 8,
                        border: '1px solid rgba(99,102,241,0.15)',
                        fontSize: 10, color: '#818cf8',
                    }}>
                        Search rank: <strong>{momentum?.visibility_multiplier ?? 1}x</strong> multiplier
                    </div>
                </div>

                {/* Availability Toggle */}
                <div style={{
                    background: availability === 'available'
                        ? 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(34,197,94,0.02))'
                        : '#0f172a',
                    border: `1px solid ${availability === 'available' ? 'rgba(34,197,94,0.25)' : '#1e293b'}`,
                    borderRadius: 16, padding: '20px 24px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}>
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                            Status
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <div style={{
                                width: 12, height: 12, borderRadius: '50%',
                                background: availability === 'available' ? '#22c55e' : availability === 'busy' ? '#fbbf24' : '#64748b',
                                boxShadow: availability === 'available' ? '0 0 12px rgba(34,197,94,0.5)' : 'none',
                                animation: availability === 'available' ? 'glow 2s ease-in-out infinite' : 'none',
                            }} />
                            <span style={{
                                fontSize: 18, fontWeight: 900,
                                color: availability === 'available' ? '#22c55e' : '#94a3b8',
                            }}>
                                {availability === 'available' ? 'Online' : availability === 'busy' ? 'Busy' : 'Offline'}
                            </span>
                        </div>
                    </div>

                    <button aria-label="Interactive Button"
                        onClick={toggleAvailability}
                        disabled={toggling}
                        style={{
                            width: '100%', padding: '12px 0',
                            borderRadius: 10, border: 'none',
                            background: availability === 'available'
                                ? 'rgba(239,68,68,0.15)'
                                : 'linear-gradient(135deg, #22c55e, #16a34a)',
                            color: availability === 'available' ? '#f87171' : '#fff',
                            fontWeight: 800, fontSize: 13, cursor: 'pointer',
                            opacity: toggling ? 0.6 : 1,
                            transition: 'all 0.2s',
                        }}
                    >
                        {toggling ? '...' : availability === 'available' ? 'Go Offline' : '🟢 Go Available'}
                    </button>

                    {/* Boost indicator */}
                    {boostActive && (
                        <div style={{
                            marginTop: 8, fontSize: 10, fontWeight: 700, color: '#fbbf24', textAlign: 'center',
                        }}>
                            🚀 2hr visibility boost active!
                        </div>
                    )}

                    {/* Broker notification */}
                    {brokersNotified > 0 && (
                        <div style={{
                            marginTop: 6, fontSize: 10, fontWeight: 700, color: '#22c55e', textAlign: 'center',
                            animation: 'fadeIn 0.3s ease-out',
                        }}>
                            ✓ {brokersNotified} broker{brokersNotified > 1 ? 's' : ''} with matching loads notified
                        </div>
                    )}
                </div>
            </div>

            {/* ── OPPORTUNITY RADAR ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Jobs Near You */}
                <div style={{
                    background: '#0f172a', border: '1px solid #1e293b',
                    borderRadius: 16, padding: '20px 24px',
                }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        🎯 Jobs Near You
                    </div>
                    <div style={{ fontSize: 40, fontWeight: 900, color: (opportunities?.jobs_near_you ?? 0) > 0 ? '#3b82f6' : '#475569', fontFeatureSettings: '"tnum"' }}>
                        {opportunities?.jobs_near_you ?? 0}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                        open loads in your coverage area
                    </div>
                </div>

                {/* Missed Opportunities */}
                <div style={{
                    background: (opportunities?.missed_opportunities?.length ?? 0) > 0
                        ? 'linear-gradient(135deg, rgba(239,68,68,0.04), rgba(239,68,68,0.01))'
                        : '#0f172a',
                    border: `1px solid ${(opportunities?.missed_opportunities?.length ?? 0) > 0 ? 'rgba(239,68,68,0.2)' : '#1e293b'}`,
                    borderRadius: 16, padding: '20px 24px',
                }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        ⚠️ Missed (24h)
                    </div>
                    <div style={{ fontSize: 40, fontWeight: 900, color: (opportunities?.missed_opportunities?.length ?? 0) > 0 ? '#ef4444' : '#475569', fontFeatureSettings: '"tnum"' }}>
                        {opportunities?.missed_opportunities?.length ?? 0}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                        loads filled before you could respond
                    </div>
                </div>
            </div>

            {/* Missed opportunities detail */}
            {(opportunities?.missed_opportunities?.length ?? 0) > 0 && (
                <div style={{
                    background: '#0f172a', border: '1px solid rgba(239,68,68,0.15)',
                    borderRadius: 12, padding: '12px 16px',
                }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                        You Were Near These — Don't Miss Next Time
                    </div>
                    {opportunities?.missed_opportunities?.map((m, i) => (
                        <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '6px 0', borderBottom: i < (opportunities?.missed_opportunities?.length ?? 0) - 1 ? '1px solid #1e293b' : 'none',
                        }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{m.corridor}</span>
                            <span style={{ fontSize: 10, color: '#64748b' }}>{m.posted_ago}</span>
                        </div>
                    ))}
                    <div style={{
                        marginTop: 10, fontSize: 11, fontWeight: 700, color: '#f97316',
                    }}>
                        💡 Toggle to Available and enable alerts to catch these faster
                    </div>
                </div>
            )}

            {/* ── HOT CORRIDORS ── */}
            {(opportunities?.hot_corridors?.length ?? 0) > 0 && (
                <div style={{
                    background: '#0f172a', border: '1px solid #1e293b',
                    borderRadius: 16, padding: '20px 24px',
                }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                        🔥 Hot Corridors Near You
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {opportunities?.hot_corridors?.map((c, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '8px 12px', background: '#0a0f1e',
                                borderRadius: 10, border: '1px solid #1e293b',
                            }}>
                                <div style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: c.demand_level === 'extreme' ? '#ef4444' : c.demand_level === 'high' ? '#f97316' : '#fbbf24',
                                }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{c.name}</div>
                                </div>
                                <span style={{
                                    fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                                    padding: '2px 8px', borderRadius: 4,
                                    background: c.demand_level === 'extreme' ? 'rgba(239,68,68,0.1)' : 'rgba(249,115,22,0.1)',
                                    color: c.demand_level === 'extreme' ? '#ef4444' : '#f97316',
                                }}>
                                    {c.demand_level}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', fontFeatureSettings: '"tnum"' }}>
                                    {c.loads_this_week} loads
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── PROFILE STRENGTH ── */}
            <ProfileStrengthMeter userId={userId} />

            {/* ── MOMENTUM BREAKDOWN ── */}
            {momentum && (
                <div style={{
                    background: '#0f172a', border: '1px solid #1e293b',
                    borderRadius: 16, padding: '20px 24px',
                }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                        Momentum Breakdown
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                        <MiniBar label="Profile" value={momentum.components.profile_completeness} />
                        <MiniBar label="Response" value={momentum.components.response_speed} />
                        <MiniBar label="Activity" value={momentum.components.recent_activity} />
                        <MiniBar label="Uptime" value={momentum.components.availability_uptime} />
                    </div>
                </div>
            )}

            <style>{`
                @keyframes glow { 0%,100% { box-shadow: 0 0 12px rgba(34,197,94,0.5); } 50% { box-shadow: 0 0 20px rgba(34,197,94,0.8); } }
                @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
            `}</style>
        </div>
    );
}

function MiniBar({ label, value }: { label: string; value: number }) {
    const color = value >= 75 ? '#22c55e' : value >= 50 ? '#fbbf24' : value >= 25 ? '#f97316' : '#ef4444';
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
                {label}
            </div>
            <div style={{
                width: '100%', height: 6, background: '#1e293b',
                borderRadius: 3, overflow: 'hidden', marginBottom: 4,
            }}>
                <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 900, color, fontFeatureSettings: '"tnum"' }}>{value}</div>
        </div>
    );
}

export default OperatorCommandCenter;
