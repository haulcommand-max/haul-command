'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { PressureDecision, PressureLevel } from '@/lib/platform/freemium-pressure-engine';

// ═══════════════════════════════════════════════════════════════
// FREEMIUM PRESSURE WIDGET — Client-side upgrade prompt
//
// Renders contextual upgrade prompts based on
// FreemiumPressureEngine decisions from /api/monetization/pressure
//
// Surfaces: directory sidebar, app dashboard, tool results,
//           notification panels, profile pages
//
// Only shows when pressure level >= threshold (default: 'soft')
// ═══════════════════════════════════════════════════════════════

interface PressureWidgetProps {
    userId?: string;
    role?: 'escort' | 'broker';
    placement: 'sidebar' | 'inline' | 'modal' | 'toast';
    minPressure?: PressureLevel;
}

const PRESSURE_CONFIG: Record<PressureLevel, {
    show: boolean;
    urgency: 'low' | 'medium' | 'high';
    borderColor: string;
    accentColor: string;
}> = {
    none:       { show: false, urgency: 'low',    borderColor: 'transparent',           accentColor: '#6b7280' },
    soft:       { show: true,  urgency: 'low',    borderColor: 'rgba(212,168,67,0.15)', accentColor: '#D4A843' },
    medium:     { show: true,  urgency: 'medium', borderColor: 'rgba(251,191,36,0.25)', accentColor: '#fbbf24' },
    aggressive: { show: true,  urgency: 'high',   borderColor: 'rgba(239,68,68,0.25)',  accentColor: '#ef4444' },
    hard_gate:  { show: true,  urgency: 'high',   borderColor: 'rgba(239,68,68,0.40)',  accentColor: '#ef4444' },
};

export function FreemiumPressureWidget({ userId, role, placement, minPressure = 'soft' }: PressureWidgetProps) {
    const [decision, setDecision] = useState<PressureDecision | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!userId || !role) return;

        // Check localStorage for recent dismissal (respects consent via capture-router)
        const dismissKey = `hc_pressure_dismiss_${userId}`;
        const lastDismissed = localStorage.getItem(dismissKey);
        if (lastDismissed) {
            const hoursSince = (Date.now() - parseInt(lastDismissed)) / 3600000;
            if (hoursSince < 24) {
                setDismissed(true);
                return;
            }
        }

        // Fetch pressure decision from API
        fetch('/api/monetization/pressure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user: {
                    userId,
                    role,
                    countryCode: 'US',
                    profileViews7d: 0,
                    searchAppearances7d: 0,
                    responseSpeed_p50_hours: 2,
                    jobAcceptanceRate: 0.5,
                    profileCompleteness: 0.6,
                    daysSinceSignup: 14,
                    lastActiveHoursAgo: 1,
                    dailyOpens7d: 3,
                    notificationOpenRate: 0.3,
                    featureUsageScore: 0.4,
                    revenueGenerated: 0,
                    missedOpportunities7d: 2,
                    corridorRank: 15,
                    isPaidUser: false,
                    currentTier: 'free',
                    trustScore: 0.5,
                    verificationLevel: 'none',
                    reviewCount: 0,
                    avgRating: 0,
                },
            }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.pressure) setDecision(data.pressure);
            })
            .catch(() => { /* Fail silently — pressure is non-critical */ });
    }, [userId, role]);

    if (dismissed || !decision) return null;

    const pressureLevels: PressureLevel[] = ['none', 'soft', 'medium', 'aggressive', 'hard_gate'];
    const minIdx = pressureLevels.indexOf(minPressure);
    const currentIdx = pressureLevels.indexOf(decision.overallPressure);
    if (currentIdx < minIdx) return null;

    const config = PRESSURE_CONFIG[decision.overallPressure];
    if (!config.show) return null;

    const handleDismiss = () => {
        setDismissed(true);
        try {
            localStorage.setItem(`hc_pressure_dismiss_${userId}`, Date.now().toString());
        } catch { /* localStorage may be unavailable */ }
    };

    if (placement === 'inline') {
        return (
            <div style={{
                padding: '12px 16px', borderRadius: 10,
                background: `rgba(212,168,67,0.04)`,
                border: `1px solid ${config.borderColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 12,
            }}>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                    {decision.directoryPressure.upgradePromptMessage || 'Unlock premium features'}
                </div>
                <Link href="/pricing" style={{
                    padding: '6px 16px', borderRadius: 8, fontSize: 11, fontWeight: 800,
                    background: `linear-gradient(135deg, ${config.accentColor}, #d97706)`,
                    color: '#000', textDecoration: 'none', whiteSpace: 'nowrap',
                }}>
                    Upgrade
                </Link>
            </div>
        );
    }

    // sidebar variant (default)
    return (
        <div style={{
            borderRadius: 16, overflow: 'hidden',
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${config.borderColor}`,
            position: 'relative',
        }}>
            {/* Dismiss */}
            <button
                onClick={handleDismiss}
                style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'none', border: 'none', color: '#6b7280',
                    fontSize: 14, cursor: 'pointer', padding: 4,
                }}
            >
                ✕
            </button>

            {/* Accent bar */}
            <div style={{
                height: 3,
                background: `linear-gradient(90deg, ${config.accentColor}, transparent)`,
            }} />

            <div style={{ padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb', marginBottom: 8 }}>
                    {config.urgency === 'high' ? '🔥 ' : config.urgency === 'medium' ? '⚡ ' : '💡 '}
                    {decision.directoryPressure.upgradePromptMessage || 'Unlock more from Haul Command'}
                </div>

                {/* Reasons */}
                {decision.reasons.length > 0 && (
                    <ul style={{ padding: 0, margin: '0 0 16px', listStyle: 'none' }}>
                        {decision.reasons.slice(0, 3).map((r, i) => (
                            <li key={i} style={{
                                fontSize: 11, color: '#9CA3AF', marginBottom: 4,
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <span style={{ color: config.accentColor, fontSize: 8 }}>●</span> {r}
                            </li>
                        ))}
                    </ul>
                )}

                {/* Pricing pressure */}
                {decision.pricingPressure.discountOffered > 0 && (
                    <div style={{
                        padding: '8px 12px', borderRadius: 8, marginBottom: 12,
                        background: 'rgba(16,185,129,0.06)',
                        border: '1px solid rgba(16,185,129,0.15)',
                        fontSize: 11, color: '#34d399', fontWeight: 700,
                    }}>
                        🎁 Limited: {Math.round(decision.pricingPressure.discountOffered * 100)}% off if you upgrade now
                    </div>
                )}

                {/* Social proof */}
                {decision.pricingPressure.socialProof && (
                    <div style={{
                        fontSize: 10, color: '#6b7280', marginBottom: 12, fontStyle: 'italic',
                    }}>
                        {decision.pricingPressure.socialProof}
                    </div>
                )}

                {/* CTA */}
                <Link href="/pricing" style={{
                    display: 'block', padding: '11px 0', borderRadius: 10,
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${config.accentColor}, #d97706)`,
                    color: '#000', fontWeight: 800, fontSize: 12, textDecoration: 'none',
                }}>
                    {decision.pricingPressure.showMissedRevenue
                        ? 'Stop Missing Leads — Upgrade Now'
                        : 'See Upgrade Plans →'}
                </Link>

                {/* Next escalation info (for transparency) */}
                {decision.nextEscalationHours > 0 && (
                    <div style={{ textAlign: 'center', marginTop: 6, fontSize: 9, color: '#4b5563' }}>
                        This offer refreshes in {decision.nextEscalationHours}h
                    </div>
                )}
            </div>
        </div>
    );
}
