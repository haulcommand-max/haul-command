'use client';

/**
 * components/intelligence/BrokerUrgencyEngine.tsx
 *
 * Broker urgency engine UI layer.
 * Shows context-sensitive prompts to brokers when stress signals fire.
 *
 * Stress signals (Phase 1 — manually triggered or from URL params):
 *   - corridor is in shortage
 *   - user has viewed the same corridor multiple times
 *   - load has been posted for > threshold minutes (comes from active load state)
 *
 * Phase 2: Replace signal detection with real-time signals from hc_events + Supabase Realtime.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, TrendingUp, Zap, X, ChevronRight } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/hc-events';

// ── Types ─────────────────────────────────────────────────────

type UrgencyLevel = 'none' | 'moderate' | 'high' | 'critical';

interface UrgencySignal {
    level: UrgencyLevel;
    headline: string;
    body: string;
    cta: string;
    ctaHref: string;
    accent: string;
}

function buildSignal(
    corridorSlug: string,
    scarcityIndex: number,
    minutesSincePost?: number
): UrgencySignal | null {
    if (scarcityIndex >= 70 && minutesSincePost && minutesSincePost > 30) {
        return {
            level: 'critical',
            headline: 'Your load is aging in a shortage corridor',
            body: `Supply on this corridor is critically low. Loads posted over 30 minutes ago have a 3× lower fill rate. Increase your rate or widen your search radius now.`,
            cta: 'Boost Rate → Instant Notification to 25 Operators',
            ctaHref: `/loads/new?corridor=${corridorSlug}&boost=1`,
            accent: '#f87171',
        };
    }
    if (scarcityIndex >= 70) {
        return {
            level: 'high',
            headline: `Escort supply is critically low on this corridor`,
            body: `Book at least ${Math.ceil(scarcityIndex / 20)} hours in advance or consider rate adjustment to ensure a fill.`,
            cta: 'Post Now — Access Priority Network',
            ctaHref: `/loads/new?corridor=${corridorSlug}`,
            accent: '#f59e0b',
        };
    }
    if (scarcityIndex >= 50) {
        return {
            level: 'moderate',
            headline: 'Supply is tightening on this corridor',
            body: 'Response times are running longer than usual. Posting now gets you ahead of the rush.',
            cta: 'Post Load',
            ctaHref: `/loads/new?corridor=${corridorSlug}`,
            accent: '#f59e0b',
        };
    }
    return null;
}

// ── Top-3 Match Buckets (scaffold) ────────────────────────────

const MATCH_BUCKETS = [
    { label: 'Sure Thing', desc: 'Historically accepts 90%+ of loads on this lane', color: '#27d17f', emoji: '✅' },
    { label: 'Best Value', desc: 'Highest lane-history score in your rate range', color: '#3ba4ff', emoji: '💰' },
    { label: 'Speedster', desc: 'Fastest median response time in the last 30 days', color: '#f59e0b', emoji: '⚡' },
];

// ── Component ─────────────────────────────────────────────────

interface Props {
    corridorSlug: string;
    scarcityIndex: number;
    minutesSincePost?: number;
    /** Hide the component entirely if no urgency signals fire */
    hideIfNoSignal?: boolean;
}

export default function BrokerUrgencyEngine({
    corridorSlug, scarcityIndex, minutesSincePost, hideIfNoSignal = true,
}: Props) {
    const [dismissed, setDismissed] = useState(false);
    const signal = buildSignal(corridorSlug, scarcityIndex, minutesSincePost);

    useEffect(() => {
        if (signal && signal.level !== 'none') {
            trackEvent('urgency_banner_shown', {
                corridor_slug: corridorSlug,
                supply_pct: 100 - scarcityIndex,
                properties: { urgency_level: signal.level },
            });
        }
    }, [signal?.level]);

    if (!signal || dismissed) {
        if (hideIfNoSignal) return null;
        return null;
    }

    return (
        <div style={{
            padding: '16px 20px', borderRadius: 16,
            background: `linear-gradient(135deg, ${signal.accent}08, transparent)`,
            border: `1px solid ${signal.accent}30`,
            position: 'relative',
        }}>
            {/* Dismiss */}
            <button
                onClick={() => setDismissed(true)}
                style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)' }}
            >
                <X size={14} />
            </button>

            {/* Signal header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <AlertTriangle size={15} color={signal.accent} style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{signal.headline}</div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: 0 }}>{signal.body}</p>
                </div>
            </div>

            {/* Top-3 match buckets */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                {MATCH_BUCKETS.map(b => (
                    <div key={b.label} style={{
                        flex: '1 1 120px', padding: '8px 10px', borderRadius: 10,
                        background: `${b.color}0a`, border: `1px solid ${b.color}20`,
                    }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: b.color, marginBottom: 2 }}>
                            {b.emoji} {b.label}
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{b.desc}</div>
                    </div>
                ))}
            </div>

            {/* CTA */}
            <Link
                href={signal.ctaHref}
                onClick={() => trackEvent('urgency_boost_clicked', { corridor_slug: corridorSlug, surface: 'urgency_engine' })}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 20px', borderRadius: 12,
                    background: `linear-gradient(135deg, ${signal.accent}, ${signal.accent}cc)`,
                    color: signal.accent === '#f87171' ? '#fff' : '#000',
                    fontWeight: 900, fontSize: 12, textDecoration: 'none',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                }}
            >
                <Zap size={12} />
                {signal.cta}
                <ChevronRight size={12} />
            </Link>
        </div>
    );
}
