'use client';

import React from 'react';
import useSWR from 'swr';
import Link from 'next/link';

/* ══════════════════════════════════════════════════════════════
   MobileMarketHeartbeat — Mobile-native live market truth
   
   Card-based layout for mobile screens. Shows:
   - Market mode badge (Live / Seeding / Demand Capture / Waitlist)
   - Active loads count with recent load preview
   - Verified operator count
   - Last activity freshness
   - CTA based on market mode
   
   This makes every mobile surface answer:
   "Is this market alive? Can I act now?"
   ══════════════════════════════════════════════════════════════ */

interface HeartbeatData {
    active_loads: number;
    verified_operators: number;
    total_operators: number;
    claimed_operators: number;
    recent_loads: {
        company_name: string;
        origin: string;
        destination: string;
        position_type: string;
        rate_amount: number | null;
        ago: string;
    }[];
    last_activity_at: string | null;
    market_mode: 'live' | 'seeding' | 'demand_capture' | 'waitlist';
    freshness_seconds: number;
    freshness_label: string;
}

interface MobileMarketHeartbeatProps {
    state?: string;
    city?: string;
    corridor?: string;
    /** Show recent loads preview */
    showRecentLoads?: boolean;
    /** Show CTA button */
    showCta?: boolean;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

const MODE_CONFIG: Record<string, {
    label: string;
    color: string;
    bg: string;
    border: string;
    ctaText: string;
    ctaHref: string;
}> = {
    live: {
        label: 'LIVE MARKET',
        color: '#22C55E',
        bg: 'rgba(34,197,94,0.08)',
        border: 'rgba(34,197,94,0.15)',
        ctaText: 'Browse Active Loads',
        ctaHref: '/loads',
    },
    seeding: {
        label: 'BUILDING COVERAGE',
        color: '#F59E0B',
        bg: 'rgba(245,158,11,0.08)',
        border: 'rgba(245,158,11,0.15)',
        ctaText: 'Claim Your Profile',
        ctaHref: '/onboarding/start',
    },
    demand_capture: {
        label: 'LOADS ACTIVE',
        color: '#3B82F6',
        bg: 'rgba(59,130,246,0.08)',
        border: 'rgba(59,130,246,0.15)',
        ctaText: 'Operators Needed',
        ctaHref: '/onboarding/start',
    },
    waitlist: {
        label: 'COMING SOON',
        color: '#6B7280',
        bg: 'rgba(107,114,128,0.08)',
        border: 'rgba(107,114,128,0.15)',
        ctaText: 'Join Waitlist',
        ctaHref: '/onboarding/start',
    },
};

const POSITION_LABELS: Record<string, string> = {
    chase: 'Chase',
    pilot: 'Pilot',
    lead: 'Lead',
    high_pole: 'High Pole',
    unknown: 'Escort',
};

export default function MobileMarketHeartbeat({
    state,
    city,
    corridor,
    showRecentLoads = true,
    showCta = true,
}: MobileMarketHeartbeatProps) {
    const params = new URLSearchParams();
    if (state) params.set('state', state);
    if (city) params.set('city', city);
    if (corridor) params.set('corridor', corridor);

    const { data, isLoading } = useSWR<HeartbeatData>(
        (state || corridor) ? `/api/market/heartbeat?${params}` : null,
        fetcher,
        { refreshInterval: 30000, dedupingInterval: 15000 }
    );

    if (!state && !corridor) return null;

    // Skeleton
    if (isLoading || !data) {
        return (
            <div style={{ padding: '0 var(--m-screen-pad, 16px)', marginTop: 16 }}>
                <div className="m-animate-pulse" style={{
                    height: 120, borderRadius: 'var(--m-radius-lg, 16px)',
                    background: 'var(--m-surface, rgba(255,255,255,0.04))',
                    border: '1px solid var(--m-border-subtle, rgba(255,255,255,0.06))',
                }} />
            </div>
        );
    }

    const mode = MODE_CONFIG[data.market_mode] || MODE_CONFIG.waitlist;

    return (
        <div style={{ padding: '0 var(--m-screen-pad, 16px)', marginTop: 16 }}>
            <div style={{
                borderRadius: 'var(--m-radius-lg, 16px)',
                border: `1px solid ${mode.border}`,
                background: 'var(--m-surface, rgba(255,255,255,0.04))',
                overflow: 'hidden',
            }}>
                {/* Mode header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: mode.bg,
                    borderBottom: `1px solid ${mode.border}`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Pulse dot */}
                        <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
                            {data.market_mode === 'live' && (
                                <span style={{
                                    position: 'absolute', inset: 0, borderRadius: '50%',
                                    background: mode.color, opacity: 0.75,
                                    animation: 'ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite',
                                }} />
                            )}
                            <span style={{
                                position: 'relative', display: 'inline-block', width: 8, height: 8,
                                borderRadius: '50%', background: mode.color,
                            }} />
                        </span>
                        <span style={{
                            fontSize: 10, fontWeight: 800, color: mode.color,
                            textTransform: 'uppercase', letterSpacing: '0.12em',
                        }}>
                            {mode.label}
                        </span>
                    </div>
                    <span style={{
                        fontSize: 10, fontWeight: 700,
                        color: 'var(--m-text-muted, #6a7181)',
                    }}>
                        {data.freshness_label}
                    </span>
                </div>

                {/* Metrics row */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 1, padding: '12px 16px',
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: 22, fontWeight: 900,
                            color: data.active_loads > 0 ? '#22C55E' : 'var(--m-text-muted, #6a7181)',
                            lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                        }}>
                            {data.active_loads}
                        </div>
                        <div style={{
                            fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.08em', color: 'var(--m-text-muted, #6a7181)',
                            marginTop: 4,
                        }}>
                            Active Loads
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: 22, fontWeight: 900,
                            color: data.verified_operators > 0 ? 'var(--m-gold, #D4A844)' : 'var(--m-text-muted, #6a7181)',
                            lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                        }}>
                            {data.verified_operators}
                        </div>
                        <div style={{
                            fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.08em', color: 'var(--m-text-muted, #6a7181)',
                            marginTop: 4,
                        }}>
                            Verified
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: 22, fontWeight: 900,
                            color: 'var(--m-text-primary, #f5f7fb)',
                            lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                        }}>
                            {data.total_operators}
                        </div>
                        <div style={{
                            fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.08em', color: 'var(--m-text-muted, #6a7181)',
                            marginTop: 4,
                        }}>
                            Operators
                        </div>
                    </div>
                </div>

                {/* Recent loads preview */}
                {showRecentLoads && data.recent_loads.length > 0 && (
                    <div style={{
                        borderTop: '1px solid var(--m-border-subtle, rgba(255,255,255,0.06))',
                        padding: '10px 16px',
                    }}>
                        <div style={{
                            fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                            letterSpacing: '0.1em', color: 'var(--m-text-muted, #6a7181)',
                            marginBottom: 8,
                        }}>
                            Recent Activity
                        </div>
                        {data.recent_loads.slice(0, 3).map((load, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '6px 0',
                                borderBottom: i < Math.min(data.recent_loads.length, 3) - 1
                                    ? '1px solid rgba(255,255,255,0.03)' : 'none',
                            }}>
                                {/* Position badge */}
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center',
                                    padding: '2px 6px', borderRadius: 4,
                                    background: 'rgba(255,255,255,0.04)',
                                    fontSize: 9, fontWeight: 800,
                                    color: 'var(--m-text-secondary, #c7ccd7)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    flexShrink: 0,
                                    minWidth: 40, justifyContent: 'center',
                                }}>
                                    {POSITION_LABELS[load.position_type] || 'Escort'}
                                </span>
                                {/* Route */}
                                <div style={{
                                    flex: 1, minWidth: 0,
                                    fontSize: 12, fontWeight: 600,
                                    color: 'var(--m-text-primary, #f5f7fb)',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {load.origin} → {load.destination}
                                </div>
                                {/* Time */}
                                <span style={{
                                    fontSize: 10, fontWeight: 600,
                                    color: 'var(--m-text-muted, #6a7181)',
                                    flexShrink: 0,
                                }}>
                                    {load.ago}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* CTA */}
                {showCta && (
                    <div style={{
                        padding: '10px 16px 14px',
                        borderTop: '1px solid var(--m-border-subtle, rgba(255,255,255,0.06))',
                    }}>
                        <Link aria-label="Navigation Link" href={mode.ctaHref} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '100%', height: 40, borderRadius: 10,
                            background: data.market_mode === 'live'
                                ? 'linear-gradient(135deg, var(--m-gold, #D4A844), #f1c27b)'
                                : 'var(--m-surface, rgba(255,255,255,0.04))',
                            color: data.market_mode === 'live' ? '#060b12' : 'var(--m-text-primary, #f5f7fb)',
                            border: data.market_mode === 'live'
                                ? 'none'
                                : '1px solid var(--m-border-subtle, rgba(255,255,255,0.06))',
                            fontSize: 12, fontWeight: 800, textDecoration: 'none',
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>
                            {mode.ctaText}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
