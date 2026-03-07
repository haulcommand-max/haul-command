'use client';

/**
 * BROKER CONFIDENCE CARD — Presence UI Surface #2
 *
 * Shows on broker search results and operator profile sidebar.
 * Surfaces: status badge + freshness timer + confidence signals.
 *
 * Badges:
 *   🟢 "available now" → "ready for dispatch"
 *   🟡 "available soon" → "opening coming up"
 *   🔵 "on a job" → "currently on a load"
 *   ⚪ "recently active" → "recently active in this corridor"
 *
 * Confidence signals:
 *   - median response time
 *   - on-time rate
 *   - repeat broker count
 *   - booking probability meter
 *   - corridor specialist flag
 *   - fast responder flag
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// ── Types ────────────────────────────────────────────────────────────────────

type PresenceStatus = 'available_now' | 'available_soon' | 'on_job' | 'recently_active' | 'offline';
type ConfidenceTier = 'high' | 'medium' | 'low' | 'unknown';

interface BrokerConfidenceCardProps {
    operatorId: string;
    operatorName: string;
    corridorContext?: string;
    compact?: boolean;          // inline card vs full sidebar
    className?: string;
}

interface ConfidenceData {
    confidence_tier: ConfidenceTier;
    confidence_score: number;
    summary: string;
    response_time: { median_minutes: number; percentile: string; label: string };
    reliability: { on_time_pct: number; completed_jobs: number; label: string };
    social_proof: { repeat_broker_count: number; total_broker_count: number; label: string };
    corridor_expertise: { primary_corridor: string | null; corridor_jobs: number; familiarity_score: number; label: string };
    booking_probability: { score: number; label: string; factors: string[] };
    availability: { status: PresenceStatus; last_active_hours: number; label: string };
}

// ── Status badge config ──────────────────────────────────────────────────────

const STATUS_BADGES: Record<PresenceStatus, {
    text: string;
    subtext: string;
    bg: string;
    border: string;
    color: string;
    dot: string;
}> = {
    available_now: {
        text: 'available now',
        subtext: 'ready for dispatch',
        bg: 'rgba(16,185,129,0.1)',
        border: 'rgba(16,185,129,0.3)',
        color: '#10b981',
        dot: '#10b981',
    },
    available_soon: {
        text: 'available soon',
        subtext: 'opening coming up',
        bg: 'rgba(245,158,11,0.08)',
        border: 'rgba(245,158,11,0.25)',
        color: '#f59e0b',
        dot: '#f59e0b',
    },
    on_job: {
        text: 'on a job',
        subtext: 'currently on a load',
        bg: 'rgba(59,130,246,0.08)',
        border: 'rgba(59,130,246,0.25)',
        color: '#3b82f6',
        dot: '#3b82f6',
    },
    recently_active: {
        text: 'recently active',
        subtext: 'active in this corridor',
        bg: 'rgba(156,163,175,0.08)',
        border: 'rgba(156,163,175,0.2)',
        color: '#9ca3af',
        dot: '#9ca3af',
    },
    offline: {
        text: 'offline',
        subtext: 'not recently checked in',
        bg: 'rgba(107,114,128,0.06)',
        border: 'rgba(107,114,128,0.15)',
        color: '#6b7280',
        dot: '#4b5563',
    },
};

// ── Confidence tier styling ──────────────────────────────────────────────────

const TIER_STYLE: Record<ConfidenceTier, { color: string; bg: string; border: string }> = {
    high: { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
    medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)' },
    low: { color: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.12)' },
    unknown: { color: '#6b7280', bg: 'rgba(107,114,128,0.05)', border: 'rgba(107,114,128,0.1)' },
};

const CONFIDENCE_COPY: Record<ConfidenceTier, string> = {
    high: 'highly responsive — brokers frequently book this operator',
    medium: 'reliable operator with steady response history',
    low: 'response history limited — may require follow-up',
    unknown: 'not enough data to assess yet',
};

// ── Freshness formatter ──────────────────────────────────────────────────────

function formatFreshness(hours: number): { text: string; emphasis: 'strong' | 'medium' | 'low' } {
    const mins = Math.round(hours * 60);
    if (mins < 60) return { text: `updated ${mins}m ago`, emphasis: 'strong' };
    if (hours < 24) return { text: `checked in ${Math.round(hours)}h ago`, emphasis: 'medium' };
    return { text: `last active ${Math.round(hours / 24)}d ago`, emphasis: 'low' };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function BrokerConfidenceCard({
    operatorId,
    operatorName,
    corridorContext,
    compact = false,
    className,
}: BrokerConfidenceCardProps) {
    const [data, setData] = useState<ConfidenceData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const params = new URLSearchParams({ operatorId });
            if (corridorContext) params.set('corridor', corridorContext);
            const res = await fetch(`/api/operator/confidence?${params}`);
            if (res.ok) setData(await res.json());
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [operatorId, corridorContext]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading || !data) {
        return (
            <div className={className} style={{ padding: compact ? 12 : 20 }}>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif' }}>
                    loading confidence data...
                </div>
            </div>
        );
    }

    const badge = STATUS_BADGES[data.availability.status];
    const tier = TIER_STYLE[data.confidence_tier];
    const freshness = formatFreshness(data.availability.last_active_hours);

    // ── COMPACT MODE (Search results inline) ─────────────────────────────

    if (compact) {
        return (
            <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {/* Status badge */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: badge.bg, border: `1px solid ${badge.border}`,
                    borderRadius: 8, padding: '4px 10px',
                }}>
                    <span style={{
                        width: 7, height: 7, borderRadius: '50%', background: badge.dot,
                        boxShadow: data.availability.status === 'available_now' ? `0 0 8px ${badge.dot}` : 'none',
                    }} />
                    <span style={{ color: badge.color, fontSize: 12, fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}>
                        {badge.text}
                    </span>
                </div>

                {/* Freshness timer */}
                <span style={{
                    color: freshness.emphasis === 'strong' ? 'rgba(16,185,129,0.7)' :
                        freshness.emphasis === 'medium' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.25)',
                    fontSize: 11, fontFamily: 'Inter, system-ui, sans-serif',
                }}>
                    {freshness.text}
                </span>

                {/* Quick flags */}
                {data.response_time.median_minutes <= 15 && (
                    <span style={{
                        color: '#10b981', fontSize: 10, fontWeight: 500,
                        background: 'rgba(16,185,129,0.08)', padding: '2px 7px',
                        borderRadius: 6, fontFamily: 'Inter, system-ui, sans-serif',
                    }}>
                        fast responder
                    </span>
                )}
                {data.social_proof.repeat_broker_count >= 3 && (
                    <span style={{
                        color: '#8b5cf6', fontSize: 10, fontWeight: 500,
                        background: 'rgba(139,92,246,0.08)', padding: '2px 7px',
                        borderRadius: 6, fontFamily: 'Inter, system-ui, sans-serif',
                    }}>
                        repeat broker history
                    </span>
                )}
                {data.corridor_expertise.familiarity_score >= 60 && (
                    <span style={{
                        color: '#f59e0b', fontSize: 10, fontWeight: 500,
                        background: 'rgba(245,158,11,0.08)', padding: '2px 7px',
                        borderRadius: 6, fontFamily: 'Inter, system-ui, sans-serif',
                    }}>
                        knows this corridor
                    </span>
                )}
            </div>
        );
    }

    // ── FULL MODE (Profile sidebar) ──────────────────────────────────────

    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'rgba(15,15,20,0.9)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: 20,
                backdropFilter: 'blur(20px)',
            }}
        >
            {/* Operator name + status badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h4 style={{ color: '#fff', fontSize: 15, fontWeight: 600, margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {operatorName}
                </h4>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: badge.bg, border: `1px solid ${badge.border}`,
                    borderRadius: 8, padding: '5px 10px',
                }}>
                    <span style={{
                        width: 8, height: 8, borderRadius: '50%', background: badge.dot,
                        boxShadow: data.availability.status === 'available_now' ? `0 0 10px ${badge.dot}` : 'none',
                        animation: data.availability.status === 'available_now' ? 'pulse-dot 2s infinite' : 'none',
                    }} />
                    <span style={{ color: badge.color, fontSize: 12, fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}>
                        {badge.text}
                    </span>
                </div>
            </div>

            {/* Subtext + freshness */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {badge.subtext}
                </span>
                <span style={{
                    color: freshness.emphasis === 'strong' ? 'rgba(16,185,129,0.7)' : 'rgba(255,255,255,0.3)',
                    fontSize: 11, fontFamily: 'Inter, system-ui, sans-serif',
                }}>
                    {freshness.text}
                </span>
            </div>

            {/* Confidence score */}
            <div style={{
                background: tier.bg, border: `1px solid ${tier.border}`,
                borderRadius: 10, padding: '12px 14px', marginBottom: 14,
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ color: tier.color, fontSize: 13, fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}>
                        {data.confidence_tier} confidence
                    </span>
                    <span style={{ color: tier.color, fontSize: 20, fontWeight: 700, fontFamily: 'Inter, system-ui, sans-serif' }}>
                        {data.confidence_score}
                    </span>
                </div>
                <div style={{
                    height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.06)',
                    overflow: 'hidden', marginBottom: 8,
                }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${data.confidence_score}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{ height: '100%', borderRadius: 4, background: tier.color }}
                    />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {CONFIDENCE_COPY[data.confidence_tier]}
                </p>
            </div>

            {/* Booking probability */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.04)',
            }}>
                <div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Inter, system-ui, sans-serif' }}>
                        booking probability
                    </div>
                    <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginTop: 2, fontFamily: 'Inter, system-ui, sans-serif' }}>
                        {data.booking_probability.label}
                    </div>
                </div>
                <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    border: `3px solid ${data.booking_probability.score >= 70 ? '#10b981' : data.booking_probability.score >= 40 ? '#f59e0b' : '#ef4444'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <span style={{
                        color: data.booking_probability.score >= 70 ? '#10b981' : data.booking_probability.score >= 40 ? '#f59e0b' : '#ef4444',
                        fontSize: 13, fontWeight: 700, fontFamily: 'Inter, system-ui, sans-serif',
                    }}>
                        {data.booking_probability.score}%
                    </span>
                </div>
            </div>

            {/* Signal rows */}
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SignalRow label="response time" value={data.response_time.label} />
                <SignalRow label="reliability" value={data.reliability.label} />
                <SignalRow label="broker history" value={data.social_proof.label} />
                {data.corridor_expertise.primary_corridor && (
                    <SignalRow label="corridor" value={data.corridor_expertise.label} />
                )}
            </div>

            {/* Quick flags */}
            {data.booking_probability.factors.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                    {data.booking_probability.factors.map((f, i) => (
                        <span key={i} style={{
                            color: 'rgba(16,185,129,0.8)', fontSize: 10, fontWeight: 500,
                            background: 'rgba(16,185,129,0.06)', padding: '3px 8px',
                            borderRadius: 6, fontFamily: 'Inter, system-ui, sans-serif',
                        }}>
                            {f}
                        </span>
                    ))}
                </div>
            )}

            <style>{`
                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </motion.div>
    );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SignalRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'Inter, system-ui, sans-serif' }}>
                {label}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 500, fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'right', maxWidth: '60%' }}>
                {value}
            </span>
        </div>
    );
}
