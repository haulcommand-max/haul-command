'use client';

/**
 * Territory Claim Dashboard
 * 
 * "Claim Your Territory" gamification UI:
 *   - County scarcity grid with slot counters
 *   - Claim button with confetti on success
 *   - Streak progress indicator
 *   - Defense alert inbox
 *   - Corridor ownership badges
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CountySlot {
    county_fips: string;
    county_name: string;
    state_code: string;
    max_slots: number;
    claimed_slots: number;
    remaining: number;
    scarcity: 'HIGH_DEMAND' | 'FILLING_UP' | 'AVAILABLE';
    my_claim: boolean;
}

interface StreakInfo {
    days: number;
    tier: string;
    badge: string;
    credits: number;
    nextTier: string | null;
    daysToNext: number;
}

interface DefenseAlert {
    id: string;
    title: string;
    body: string;
    created_at: string;
    read: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function TerritoryDashboard({ stateCode }: { stateCode: string }) {
    const supabase = createClient();
    const [counties, setCounties] = useState<CountySlot[]>([]);
    const [alerts, setAlerts] = useState<DefenseAlert[]>([]);
    const [streak, setStreak] = useState<StreakInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState<string | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [selectedCounty, setSelectedCounty] = useState<string | null>(null);

    // Load data
    useEffect(() => {
        async function load() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Fetch county slots
                const { data: territoryData } = await supabase
                    .from('county_territories')
                    .select('*')
                    .eq('state_code', stateCode)
                    .order('county_name');

                // Fetch user's claims
                const { data: myClaims } = await supabase
                    .from('territory_claims')
                    .select('county_fips')
                    .eq('user_id', user.id)
                    .eq('status', 'active');

                const myClaimSet = new Set((myClaims ?? []).map((c: any) => c.county_fips));

                setCounties((territoryData ?? []).map((c: any) => {
                    const max = c.max_slots ?? 3;
                    const claimed = c.claimed_slots ?? 0;
                    const remaining = Math.max(0, max - claimed);
                    return {
                        county_fips: c.county_fips,
                        county_name: c.county_name,
                        state_code: c.state_code,
                        max_slots: max,
                        claimed_slots: claimed,
                        remaining,
                        scarcity: remaining <= 0 ? 'HIGH_DEMAND' : remaining <= 1 ? 'FILLING_UP' : 'AVAILABLE',
                        my_claim: myClaimSet.has(c.county_fips),
                    };
                }));

                // Fetch defense alerts
                const { data: alertData } = await supabase
                    .from('notifications')
                    .select('id, title, body, created_at, read')
                    .eq('user_id', user.id)
                    .contains('metadata', { type: 'territory_defense' })
                    .order('created_at', { ascending: false })
                    .limit(10);

                setAlerts((alertData ?? []).map((a: any) => ({
                    id: a.id, title: a.title, body: a.body,
                    created_at: a.created_at, read: a.read ?? false,
                })));

                // Calculate streak
                const { data: streakData } = await supabase
                    .from('territory_claims')
                    .select('streak_start, streak_days')
                    .eq('user_id', user.id)
                    .eq('status', 'active')
                    .order('streak_days', { ascending: false })
                    .limit(1)
                    .single();

                if (streakData) {
                    const days = streakData.streak_days ?? Math.floor(
                        (Date.now() - new Date(streakData.streak_start).getTime()) / 86400000
                    );
                    const tiers = [
                        { days: 30, tier: 'DIAMOND', badge: '💎', credits: 500 },
                        { days: 14, tier: 'GOLD', badge: '🥇', credits: 200 },
                        { days: 7, tier: 'SILVER', badge: '🥈', credits: 50 },
                        { days: 3, tier: 'BRONZE', badge: '🥉', credits: 10 },
                    ];
                    const current = tiers.find(t => days >= t.days) ?? { tier: 'NONE', badge: '⬜', credits: 0, days: 0 };
                    const nextTier = tiers.find(t => t.days > days);

                    setStreak({
                        days,
                        tier: current.tier,
                        badge: current.badge,
                        credits: current.credits,
                        nextTier: nextTier?.tier ?? null,
                        daysToNext: nextTier ? nextTier.days - days : 0,
                    });
                }
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [stateCode, supabase]);

    // Claim territory
    const handleClaim = useCallback(async (countyFips: string) => {
        setClaiming(countyFips);
        try {
            const res = await fetch('/api/territory/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ county_fips: countyFips }),
            });

            if (res.ok) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
                // Update local state
                setCounties(prev => prev.map(c =>
                    c.county_fips === countyFips
                        ? {
                            ...c, claimed_slots: c.claimed_slots + 1, remaining: c.remaining - 1, my_claim: true,
                            scarcity: c.remaining - 1 <= 0 ? 'HIGH_DEMAND' : c.remaining - 1 <= 1 ? 'FILLING_UP' : 'AVAILABLE'
                        }
                        : c
                ));
            }
        } finally {
            setClaiming(null);
        }
    }, []);

    if (loading) {
        return (
            <div style={{ padding: 32, textAlign: 'center' }}>
                <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    border: '3px solid #1e293b', borderTopColor: '#f97316',
                    animation: 'spin 1s linear infinite', margin: '0 auto 16px',
                }} />
                <p style={{ color: '#64748b', fontSize: 13 }}>Loading territories...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const myClaims = counties.filter(c => c.my_claim).length;
    const totalAvailable = counties.reduce((sum, c) => sum + c.remaining, 0);

    return (
        <div style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            color: '#e2e8f0',
        }}>
            {/* Confetti overlay */}
            {showConfetti && <ConfettiOverlay />}

            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
                borderRadius: 20, padding: '28px 32px', marginBottom: 20,
                border: '1px solid #312e81',
            }}>
                <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>
                    🏴 Claim Your Territory
                </h2>
                <p style={{ fontSize: 13, color: '#94a3b8' }}>
                    {stateCode} — {counties.length} counties · {totalAvailable} slots available · {myClaims} claimed by you
                </p>

                {/* Streak bar */}
                {streak && streak.days > 0 && (
                    <div style={{
                        marginTop: 16, padding: '12px 16px',
                        background: 'rgba(245,158,11,0.08)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                        <span style={{ fontSize: 28 }}>{streak.badge}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24' }}>
                                {streak.tier} Streak — {streak.days} days
                            </div>
                            <div style={{ fontSize: 11, color: '#92846a' }}>
                                {streak.credits} boost credits earned
                                {streak.nextTier && ` · ${streak.daysToNext} days to ${streak.nextTier}`}
                            </div>
                        </div>
                        <div style={{
                            width: 60, height: 6, background: '#1e293b', borderRadius: 3,
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                width: `${Math.min(100, (streak.days / (streak.daysToNext + streak.days)) * 100)}%`,
                                height: '100%', background: '#fbbf24', borderRadius: 3,
                            }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Defense alerts */}
            {alerts.length > 0 && (
                <div style={{
                    background: '#0f172a', border: '1px solid #1e293b',
                    borderRadius: 16, padding: '16px 20px', marginBottom: 20,
                }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                        🚨 Defense Alerts
                    </div>
                    {alerts.slice(0, 3).map((a) => (
                        <div key={a.id} style={{
                            padding: '8px 0', borderBottom: '1px solid #1e293b',
                            display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                            {!a.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{a.title}</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{a.body}</div>
                            </div>
                            <span style={{ fontSize: 10, color: '#475569', whiteSpace: 'nowrap' }}>
                                {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* County Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 12,
            }}>
                {counties.map((county) => (
                    <div
                        key={county.county_fips}
                        onClick={() => setSelectedCounty(county.county_fips === selectedCounty ? null : county.county_fips)}
                        style={{
                            background: county.my_claim
                                ? 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))'
                                : '#0f172a',
                            border: `1px solid ${county.my_claim ? 'rgba(34,197,94,0.3)' : county.scarcity === 'HIGH_DEMAND' ? 'rgba(239,68,68,0.3)' : '#1e293b'}`,
                            borderRadius: 14,
                            padding: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#e2e8f0' }}>
                                {county.county_name}
                            </span>
                            {county.my_claim && (
                                <span style={{
                                    fontSize: 9, fontWeight: 800, color: '#22c55e',
                                    background: 'rgba(34,197,94,0.1)', padding: '2px 6px', borderRadius: 4,
                                    textTransform: 'uppercase', letterSpacing: '0.06em',
                                }}>YOURS</span>
                            )}
                        </div>

                        {/* Slot counter */}
                        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                            {Array.from({ length: county.max_slots }).map((_, i) => (
                                <div key={i} style={{
                                    width: 28, height: 6, borderRadius: 3,
                                    background: i < county.claimed_slots
                                        ? (county.my_claim && i === county.claimed_slots - 1 ? '#22c55e' : '#f97316')
                                        : '#1e293b',
                                    transition: 'background 0.3s',
                                }} />
                            ))}
                        </div>

                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10, fontFeatureSettings: '"tnum"' }}>
                            {county.remaining > 0 ? (
                                <span style={{
                                    color: county.scarcity === 'FILLING_UP' ? '#fbbf24' : '#94a3b8',
                                    fontWeight: 700,
                                }}>
                                    {county.remaining} of {county.max_slots} remaining
                                </span>
                            ) : (
                                <span style={{ color: '#ef4444', fontWeight: 700 }}>FULL — all slots claimed</span>
                            )}
                        </div>

                        {/* Claim button */}
                        {!county.my_claim && county.remaining > 0 && selectedCounty === county.county_fips && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleClaim(county.county_fips); }}
                                disabled={claiming === county.county_fips}
                                style={{
                                    width: '100%', padding: '10px 0', borderRadius: 10, border: 'none',
                                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                                    color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer',
                                    opacity: claiming === county.county_fips ? 0.7 : 1,
                                    transition: 'opacity 0.2s',
                                }}
                            >
                                {claiming === county.county_fips ? 'Claiming...' : '🏴 Claim This Territory'}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Confetti Overlay ───────────────────────────────────────────────────────────

function ConfettiOverlay() {
    const colors = ['#f97316', '#22c55e', '#3b82f6', '#fbbf24', '#a855f7', '#ef4444'];
    const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
        duration: 1.5 + Math.random() * 1.5,
    }));

    return (
        <div style={{
            position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999,
            overflow: 'hidden',
        }}>
            {particles.map(p => (
                <div key={p.id} style={{
                    position: 'absolute',
                    left: `${p.x}%`,
                    top: -10,
                    width: p.size,
                    height: p.size,
                    borderRadius: Math.random() > 0.5 ? '50%' : 2,
                    background: p.color,
                    animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
                }} />
            ))}
            <style>{`
                @keyframes confettiFall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
            `}</style>
        </div>
    );
}

export default TerritoryDashboard;
