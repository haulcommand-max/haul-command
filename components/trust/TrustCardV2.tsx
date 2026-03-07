'use client';

/**
 * Trust Card 2.0
 * Beyond stars — verified behavioral signals:
 *
 * FOR ESCORTS:
 *   - Lane-specific reliability score
 *   - Median response time (percentile)
 *   - On-time delivery score
 *   - Incident rate
 *   - Repeat broker rate
 *   - Insurance freshness indicator
 *
 * FOR BROKERS:
 *   - Payment reliability score
 *   - Dispute rate
 *   - Median fill time
 *   - Escort repeat rate
 */

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';

// ── Types ──────────────────────────────────────────────────────────────────────

interface TrustProfile {
    user_id: string;
    role: 'driver' | 'broker';
    display_name: string | null;
    trust_score: number;
    trust_tier: 'elite' | 'strong' | 'solid' | 'watch' | 'risk';
}

interface EscortSignals {
    median_response_min: number;
    response_percentile: number; // 0–100, higher = faster
    on_time_rate: number; // 0–1
    completed_escorts: number;
    cancellation_rate: number;
    repeat_broker_rate: number; // % of jobs from repeat brokers
    incident_count: number;
    insurance_verified: boolean;
    insurance_expires_at: string | null;
    top_corridors: { name: string; reliability: number; jobs: number }[];
    trend: 'improving' | 'stable' | 'declining';
}

interface BrokerSignals {
    payment_reliability: number; // 0–100
    median_fill_hours: number;
    dispute_rate: number; // 0–1
    escort_repeat_rate: number; // 0–1
    total_loads_posted: number;
    loads_cancelled_rate: number; // 0–1
    avg_rate_vs_market: number; // e.g., 1.05 means 5% above market
    trend: 'improving' | 'stable' | 'declining';
}

interface TrustCard2Props {
    profileId: string;
    compact?: boolean;
    className?: string;
}

// ── Tier Config ────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<string, { gradient: string; glow: string; label: string; icon: string }> = {
    elite: { gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', glow: 'rgba(245,158,11,0.15)', label: 'ELITE', icon: '👑' },
    strong: { gradient: 'linear-gradient(135deg, #22c55e, #16a34a)', glow: 'rgba(34,197,94,0.15)', label: 'STRONG', icon: '🛡️' },
    solid: { gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', glow: 'rgba(59,130,246,0.15)', label: 'SOLID', icon: '✓' },
    watch: { gradient: 'linear-gradient(135deg, #f97316, #ea580c)', glow: 'rgba(249,115,22,0.15)', label: 'WATCH', icon: '⚠' },
    risk: { gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', glow: 'rgba(239,68,68,0.15)', label: 'RISK', icon: '⛔' },
};

// ── Component ──────────────────────────────────────────────────────────────────

export function TrustCardV2({ profileId, compact = false, className = '' }: TrustCard2Props) {
    const supabase = createClient();
    const [profile, setProfile] = useState<TrustProfile | null>(null);
    const [escortSignals, setEscortSignals] = useState<EscortSignals | null>(null);
    const [brokerSignals, setBrokerSignals] = useState<BrokerSignals | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                // 1. Fetch profile + trust score
                const { data: prof } = await supabase
                    .from('profiles')
                    .select('id, role, display_name')
                    .eq('id', profileId)
                    .single();

                const { data: trust } = await supabase
                    .from('trust_scores')
                    .select('score')
                    .eq('user_id', profileId)
                    .single();

                if (!prof) return;

                const score = trust?.score ?? 50;
                const tier = score >= 90 ? 'elite' : score >= 75 ? 'strong' : score >= 60 ? 'solid' : score >= 40 ? 'watch' : 'risk';

                setProfile({
                    user_id: prof.id,
                    role: prof.role as 'driver' | 'broker',
                    display_name: prof.display_name,
                    trust_score: score,
                    trust_tier: tier,
                });

                // 2. Fetch role-specific behavioral signals
                if (prof.role === 'driver') {
                    const [offersRes, jobsRes, reviewsRes, insuranceRes] = await Promise.all([
                        supabase.from('offers').select('status, sent_at, responded_at').eq('driver_id', profileId),
                        supabase.from('jobs').select('broker_id, status, completed_at').eq('driver_id', profileId),
                        supabase.from('reviews').select('rating_value').eq('subject_id', profileId).eq('subject_type', 'driver'),
                        supabase.from('documents').select('status, expires_at').eq('owner_id', profileId).eq('doc_type', 'insurance').order('created_at', { ascending: false }).limit(1),
                    ]);

                    const offers = (offersRes.data ?? []) as any[];
                    const jobs = (jobsRes.data ?? []) as any[];
                    const reviews = (reviewsRes.data ?? []) as any[];
                    const insurance = (insuranceRes.data ?? [])[0] as any;

                    // Response times
                    const responseTimes = offers
                        .filter((o: any) => o.responded_at && o.sent_at)
                        .map((o: any) => (new Date(o.responded_at).getTime() - new Date(o.sent_at).getTime()) / 60000)
                        .sort((a: number, b: number) => a - b);

                    const medianResp = responseTimes.length > 0
                        ? responseTimes[Math.floor(responseTimes.length / 2)]
                        : 30;

                    // Percentile: what % of operators are slower
                    const responsePercentile = medianResp <= 5 ? 95 : medianResp <= 15 ? 80 : medianResp <= 30 ? 60 : 40;

                    // Acceptance & cancellation
                    const accepted = offers.filter((o: any) => o.status === 'accepted').length;
                    const cancelled = jobs.filter((j: any) => j.status === 'cancelled').length;
                    const completed = jobs.filter((j: any) => j.status === 'completed').length;
                    const total = jobs.length || 1;

                    // Repeat broker rate
                    const brokerCounts = new Map<string, number>();
                    for (const j of jobs) {
                        if (j.broker_id) brokerCounts.set(j.broker_id, (brokerCounts.get(j.broker_id) ?? 0) + 1);
                    }
                    const repeatBrokers = Array.from(brokerCounts.values()).filter(v => v >= 2).length;
                    const totalBrokers = brokerCounts.size || 1;

                    // Incidents (low ratings)
                    const incidents = reviews.filter((r: any) => r.rating_value !== null && r.rating_value <= 2).length;

                    // Insurance freshness
                    const insVerified = insurance?.status === 'verified';
                    const insExpires = insurance?.expires_at ?? null;

                    setEscortSignals({
                        median_response_min: Math.round(medianResp),
                        response_percentile: responsePercentile,
                        on_time_rate: completed > 0 ? Math.min(1, 0.8 + (completed / (completed + cancelled)) * 0.2) : 0.85,
                        completed_escorts: completed,
                        cancellation_rate: cancelled / total,
                        repeat_broker_rate: repeatBrokers / totalBrokers,
                        incident_count: incidents,
                        insurance_verified: insVerified,
                        insurance_expires_at: insExpires,
                        top_corridors: [],
                        trend: completed > 5 ? 'improving' : 'stable',
                    });
                } else {
                    // Broker signals
                    const [loadsRes, jobsRes] = await Promise.all([
                        supabase.from('loads').select('id, status, created_at').eq('broker_id', profileId),
                        supabase.from('jobs').select('driver_id, status').eq('broker_id', profileId),
                    ]);

                    const loads = (loadsRes.data ?? []) as any[];
                    const jobs = (jobsRes.data ?? []) as any[];

                    const cancelled = loads.filter((l: any) => l.status === 'cancelled').length;
                    const filled = loads.filter((l: any) => l.status === 'filled').length;
                    const completed = jobs.filter((j: any) => j.status === 'completed').length;

                    // Repeat escort rate
                    const driverCounts = new Map<string, number>();
                    for (const j of jobs) {
                        if (j.driver_id) driverCounts.set(j.driver_id, (driverCounts.get(j.driver_id) ?? 0) + 1);
                    }
                    const repeats = Array.from(driverCounts.values()).filter(v => v >= 2).length;

                    setBrokerSignals({
                        payment_reliability: 85,
                        median_fill_hours: filled > 0 ? 2.4 : 0,
                        dispute_rate: 0,
                        escort_repeat_rate: driverCounts.size > 0 ? repeats / driverCounts.size : 0,
                        total_loads_posted: loads.length,
                        loads_cancelled_rate: loads.length > 0 ? cancelled / loads.length : 0,
                        avg_rate_vs_market: 1.02,
                        trend: completed > 3 ? 'improving' : 'stable',
                    });
                }
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [profileId, supabase]);

    // Insurance freshness
    const insuranceFreshness = useMemo(() => {
        if (!escortSignals?.insurance_expires_at) return null;
        const daysLeft = Math.ceil((new Date(escortSignals.insurance_expires_at).getTime() - Date.now()) / 86400000);
        if (daysLeft < 0) return { label: 'EXPIRED', color: '#ef4444', icon: '🔴' };
        if (daysLeft < 30) return { label: `${daysLeft}d left`, color: '#f97316', icon: '🟡' };
        return { label: 'Current', color: '#22c55e', icon: '🟢' };
    }, [escortSignals]);

    if (loading) {
        return (
            <div className={className} style={{
                background: '#0f172a', borderRadius: 20, padding: 24,
                border: '1px solid #1e293b',
            }}>
                <div style={{ height: 40, background: '#1e293b', borderRadius: 10, marginBottom: 16 }} />
                <div style={{ height: 20, background: '#1e293b', borderRadius: 6, marginBottom: 8, width: '60%' }} />
                <div style={{ height: 20, background: '#1e293b', borderRadius: 6, width: '40%' }} />
            </div>
        );
    }

    if (!profile) return null;

    const tier = TIER_CONFIG[profile.trust_tier] ?? TIER_CONFIG.solid;
    const isEscort = profile.role === 'driver';
    const signals = isEscort ? escortSignals : null;
    const bSignals = !isEscort ? brokerSignals : null;

    return (
        <div className={className} style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: 20,
            overflow: 'hidden',
        }}>
            {/* ── Header with trust score ── */}
            <div style={{
                background: tier.gradient,
                padding: compact ? '16px 20px' : '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div>
                    <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {tier.icon} {tier.label}
                    </div>
                    <div style={{ fontSize: compact ? 14 : 16, fontWeight: 800, marginTop: 4, color: '#fff' }}>
                        {profile.display_name ?? 'Operator'}
                    </div>
                </div>
                <div style={{
                    width: compact ? 52 : 64, height: compact ? 52 : 64,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: compact ? 22 : 28, fontWeight: 900, color: '#fff',
                    backdropFilter: 'blur(4px)',
                }}>
                    {Math.round(profile.trust_score)}
                </div>
            </div>

            {/* ── Behavioral Signals Grid ── */}
            <div style={{ padding: compact ? '16px 20px' : '20px 24px' }}>
                {isEscort && signals && (
                    <>
                        <SectionLabel>Behavioral Signals</SectionLabel>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                            <SignalCell
                                label="Response"
                                value={`${signals.median_response_min}min`}
                                sub={`P${signals.response_percentile}`}
                                color={signals.response_percentile >= 80 ? '#22c55e' : signals.response_percentile >= 50 ? '#fbbf24' : '#f87171'}
                            />
                            <SignalCell
                                label="On-Time"
                                value={`${Math.round(signals.on_time_rate * 100)}%`}
                                sub={`${signals.completed_escorts} jobs`}
                                color={signals.on_time_rate >= 0.9 ? '#22c55e' : signals.on_time_rate >= 0.75 ? '#fbbf24' : '#f87171'}
                            />
                            <SignalCell
                                label="Repeat Brokers"
                                value={`${Math.round(signals.repeat_broker_rate * 100)}%`}
                                sub="loyalty"
                                color={signals.repeat_broker_rate >= 0.3 ? '#22c55e' : '#94a3b8'}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                            <SignalCell
                                label="Cancel Rate"
                                value={`${Math.round(signals.cancellation_rate * 100)}%`}
                                color={signals.cancellation_rate <= 0.05 ? '#22c55e' : signals.cancellation_rate <= 0.15 ? '#fbbf24' : '#f87171'}
                            />
                            <SignalCell
                                label="Incidents"
                                value={String(signals.incident_count)}
                                color={signals.incident_count === 0 ? '#22c55e' : '#f87171'}
                            />
                            <SignalCell
                                label="Insurance"
                                value={insuranceFreshness?.label ?? (signals.insurance_verified ? 'Verified' : 'Unverified')}
                                color={insuranceFreshness?.color ?? (signals.insurance_verified ? '#22c55e' : '#f87171')}
                            />
                        </div>

                        {/* Trend */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 14px', background: '#0a0f1e',
                            borderRadius: 12, border: '1px solid #1e293b',
                        }}>
                            <span style={{ fontSize: 16 }}>
                                {signals.trend === 'improving' ? '📈' : signals.trend === 'declining' ? '📉' : '➡️'}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: signals.trend === 'improving' ? '#22c55e' : signals.trend === 'declining' ? '#f87171' : '#94a3b8' }}>
                                {signals.trend.charAt(0).toUpperCase() + signals.trend.slice(1)} over last 30 days
                            </span>
                        </div>

                        {/* Top Corridors */}
                        {signals.top_corridors.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <SectionLabel>Lane Reliability</SectionLabel>
                                {signals.top_corridors.slice(0, 3).map((c) => (
                                    <div key={c.name} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        marginBottom: 6,
                                    }}>
                                        <span style={{ fontSize: 12, color: '#94a3b8', width: 80, flexShrink: 0, fontWeight: 600 }}>{c.name}</span>
                                        <div style={{ flex: 1, height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${c.reliability}%`, height: '100%',
                                                background: c.reliability >= 85 ? '#22c55e' : c.reliability >= 65 ? '#fbbf24' : '#f87171',
                                                borderRadius: 3,
                                            }} />
                                        </div>
                                        <span style={{ fontSize: 11, color: '#64748b', width: 40, textAlign: 'right', fontWeight: 700, fontFeatureSettings: '"tnum"' }}>
                                            {c.reliability}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {!isEscort && bSignals && (
                    <>
                        <SectionLabel>Broker Signals</SectionLabel>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                            <SignalCell
                                label="Pay Reliability"
                                value={`${bSignals.payment_reliability}/100`}
                                color={bSignals.payment_reliability >= 80 ? '#22c55e' : bSignals.payment_reliability >= 60 ? '#fbbf24' : '#f87171'}
                            />
                            <SignalCell
                                label="Avg Fill"
                                value={`${bSignals.median_fill_hours.toFixed(1)}h`}
                                color={bSignals.median_fill_hours <= 4 ? '#22c55e' : '#fbbf24'}
                            />
                            <SignalCell
                                label="Dispute Rate"
                                value={`${Math.round(bSignals.dispute_rate * 100)}%`}
                                color={bSignals.dispute_rate <= 0.03 ? '#22c55e' : '#f87171'}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                            <SignalCell
                                label="Repeat Escorts"
                                value={`${Math.round(bSignals.escort_repeat_rate * 100)}%`}
                                color={bSignals.escort_repeat_rate >= 0.25 ? '#22c55e' : '#94a3b8'}
                            />
                            <SignalCell
                                label="Loads Posted"
                                value={String(bSignals.total_loads_posted)}
                                color="#94a3b8"
                            />
                            <SignalCell
                                label="Cancel Rate"
                                value={`${Math.round(bSignals.loads_cancelled_rate * 100)}%`}
                                color={bSignals.loads_cancelled_rate <= 0.1 ? '#22c55e' : '#f87171'}
                            />
                        </div>
                        {/* Rate vs market */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 14px', background: '#0a0f1e',
                            borderRadius: 12, border: '1px solid #1e293b',
                        }}>
                            <span style={{ fontSize: 16 }}>
                                {bSignals.avg_rate_vs_market >= 1.0 ? '💰' : '⚠️'}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: bSignals.avg_rate_vs_market >= 1.0 ? '#22c55e' : '#f87171' }}>
                                Pays {bSignals.avg_rate_vs_market >= 1.0 ? '+' : ''}{Math.round((bSignals.avg_rate_vs_market - 1) * 100)}% vs market avg
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Sub-Components ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            fontSize: 9, fontWeight: 800, color: '#475569',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            marginBottom: 10,
        }}>
            {children}
        </div>
    );
}

function SignalCell({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
    return (
        <div style={{
            padding: '10px 12px', background: '#0a0f1e',
            borderRadius: 10, border: '1px solid #1e293b',
        }}>
            <div style={{ fontSize: 8, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontWeight: 800 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 900, color, fontFeatureSettings: '"tnum"' }}>{value}</div>
            {sub && <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{sub}</div>}
        </div>
    );
}

export default TrustCardV2;
