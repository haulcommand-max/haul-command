'use client';

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { cn } from '@/lib/utils/cn';

/* ══════════════════════════════════════════════════════════════
   MarketHeartbeat — Live Market Truth Strip
   
   Answers: "Is this market alive right now?"
   Shows: active loads, verified operators, last activity, market mode.
   
   This is the #1 dominance component. It turns every surface from
   a catalog page into an operating surface.
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

interface MarketHeartbeatProps {
    state?: string;
    city?: string;
    corridor?: string;
    /** Compact variant for embedding in cards */
    variant?: 'strip' | 'compact' | 'full';
    className?: string;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

const MODE_CONFIG: Record<string, {
    label: string;
    color: string;
    bg: string;
    borderColor: string;
    pulseColor: string;
    description: string;
}> = {
    live: {
        label: 'LIVE',
        color: '#22C55E',
        bg: 'rgba(34,197,94,0.08)',
        borderColor: 'rgba(34,197,94,0.2)',
        pulseColor: '#22C55E',
        description: 'Active loads and operators in this market',
    },
    seeding: {
        label: 'SEEDING',
        color: '#F59E0B',
        bg: 'rgba(245,158,11,0.08)',
        borderColor: 'rgba(245,158,11,0.2)',
        pulseColor: '#F59E0B',
        description: 'Building operator coverage in this market',
    },
    demand_capture: {
        label: 'DEMAND ACTIVE',
        color: '#3B82F6',
        bg: 'rgba(59,130,246,0.08)',
        borderColor: 'rgba(59,130,246,0.2)',
        pulseColor: '#3B82F6',
        description: 'Loads flowing — operators needed',
    },
    waitlist: {
        label: 'COMING SOON',
        color: '#6B7280',
        bg: 'rgba(107,114,128,0.08)',
        borderColor: 'rgba(107,114,128,0.2)',
        pulseColor: '#6B7280',
        description: 'Join the waitlist for this market',
    },
};

function PulseDot({ color }: { color: string }) {
    return (
        <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
            <span style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: color, opacity: 0.75,
                animation: 'ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite',
            }} />
            <span style={{
                position: 'relative', display: 'inline-block', width: 8, height: 8,
                borderRadius: '50%', background: color,
            }} />
        </span>
    );
}

function MetricCell({ value, label, color }: { value: string | number; label: string; color?: string }) {
    return (
        <div style={{ textAlign: 'center', minWidth: 60 }}>
            <div style={{
                fontSize: 20, fontWeight: 900,
                color: color || 'var(--hc-text, #fff)',
                lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            }}>
                {value}
            </div>
            <div style={{
                fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const,
                letterSpacing: '0.1em', color: 'var(--hc-subtle, #5A6577)',
                marginTop: 4,
            }}>
                {label}
            </div>
        </div>
    );
}

export function MarketHeartbeat({
    state,
    city,
    corridor,
    variant = 'strip',
    className,
}: MarketHeartbeatProps) {
    const params = new URLSearchParams();
    if (state) params.set('state', state);
    if (city) params.set('city', city);
    if (corridor) params.set('corridor', corridor);

    const { data, error, isLoading } = useSWR<HeartbeatData>(
        (state || corridor) ? `/api/market/heartbeat?${params}` : null,
        fetcher,
        { refreshInterval: 30000, dedupingInterval: 15000 }
    );

    if (!state && !corridor) return null;

    // Skeleton
    if (isLoading || !data) {
        return (
            <div className={cn('animate-pulse', className)} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '12px 16px', borderRadius: 14,
                background: 'var(--hc-surface, rgba(255,255,255,0.03))',
                border: '1px solid var(--hc-border, rgba(255,255,255,0.06))',
            }}>
                <div style={{ width: 60, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ flex: 1, height: 16, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
            </div>
        );
    }

    if (error) return null;

    const mode = MODE_CONFIG[data.market_mode] || MODE_CONFIG.waitlist;

    if (variant === 'compact') {
        return (
            <div className={className} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 12px', borderRadius: 8,
                background: mode.bg,
                border: `1px solid ${mode.borderColor}`,
            }}>
                <PulseDot color={mode.pulseColor} />
                <span style={{
                    fontSize: 10, fontWeight: 800, color: mode.color,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                    {mode.label}
                </span>
                {data.active_loads > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--hc-muted, #8fa3b8)' }}>
                        · {data.active_loads} active load{data.active_loads !== 1 ? 's' : ''}
                    </span>
                )}
            </div>
        );
    }

    // Strip layout (default)
    return (
        <div className={className} style={{
            display: 'flex', alignItems: 'center', gap: 20,
            padding: '14px 20px', borderRadius: 16,
            background: 'var(--hc-surface, rgba(255,255,255,0.03))',
            border: `1px solid ${mode.borderColor}`,
            flexWrap: 'wrap',
        }}>
            {/* Mode badge */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 10px', borderRadius: 8,
                background: mode.bg,
            }}>
                <PulseDot color={mode.pulseColor} />
                <span style={{
                    fontSize: 10, fontWeight: 800, color: mode.color,
                    textTransform: 'uppercase', letterSpacing: '0.12em',
                }}>
                    {mode.label}
                </span>
            </div>

            {/* Metrics row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1, minWidth: 0, justifyContent: 'center' }}>
                <MetricCell
                    value={data.active_loads}
                    label="Active Loads"
                    color={data.active_loads > 0 ? '#22C55E' : undefined}
                />
                <MetricCell
                    value={data.verified_operators}
                    label="Verified"
                    color={data.verified_operators > 0 ? 'var(--hc-gold-500, #C6923A)' : undefined}
                />
                <MetricCell
                    value={data.total_operators}
                    label="Operators"
                />
                <MetricCell
                    value={data.freshness_label}
                    label="Last Activity"
                    color={data.freshness_seconds < 3600 ? '#22C55E' : undefined}
                />
            </div>
        </div>
    );
}

export default MarketHeartbeat;
