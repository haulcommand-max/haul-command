"use client";

import React from 'react';
import useSWR from 'swr';

type LiquidityData = {
    geo_key: string;
    liquidity_score: number;
    predicted_fill_minutes: number;
    risk_band: 'green' | 'yellow' | 'red';
    active_drivers: number;
    active_loads: number;
    matches_6h: number;
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

const RISK_STYLES: Record<string, { bg: string; border: string; text: string; label: string; glow: string }> = {
    green: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', text: '#10b981', label: 'Fast Fill Expected', glow: '0 0 20px rgba(16,185,129,0.15)' },
    yellow: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', text: '#f59e0b', label: 'Moderate Wait', glow: '0 0 20px rgba(245,158,11,0.1)' },
    red: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#ef4444', label: 'Supply Tight', glow: '0 0 20px rgba(239,68,68,0.1)' },
};

export default function LiquidityPulse({ state }: { state: string }) {
    const { data, isLoading } = useSWR<LiquidityData>(
        `/api/liquidity?state=${state}`,
        fetcher,
        { refreshInterval: 60_000, dedupingInterval: 15_000 }
    );

    if (isLoading || !data) return null;

    const style = RISK_STYLES[data.risk_band] || RISK_STYLES.yellow;

    return (
        <div className="pulse-card hover-lift mb-6">
            {/* Left status bar */}
            <div className="pulse-card__status-bar" style={{ background: style.text }} />

            <div className="pulse-card__content">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span
                            className="animate-pulse-gold"
                            style={{
                                width: 10, height: 10, borderRadius: '50%', background: style.text,
                                display: 'inline-block',
                            }}
                        />
                        <span className="text-micro font-extrabold uppercase tracking-widest" style={{ color: style.text }}>
                            {style.label}
                        </span>
                    </div>
                    <span className="micro-text font-semibold">
                        {state} Market
                    </span>
                </div>

                {/* Stat grid */}
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { label: 'Liquidity', val: `${data.liquidity_score}`, color: style.text },
                        { label: 'Est. Fill', val: data.predicted_fill_minutes <= 30 ? `~${data.predicted_fill_minutes}m` : data.predicted_fill_minutes <= 120 ? `~${data.predicted_fill_minutes}m` : '2h+', color: 'var(--hc-text)' },
                        { label: 'Escorts Online', val: `${data.active_drivers}`, color: 'var(--hc-success)' },
                        { label: 'Active Loads', val: `${data.active_loads}`, color: 'var(--hc-gold-500)' },
                    ].map(item => (
                        <div key={item.label} className="text-center">
                            <div className="text-lg font-black" style={{ color: item.color, fontFamily: 'var(--font-mono)' }}>{item.val}</div>
                            <div className="text-[9px] text-hc-subtle uppercase tracking-wide mt-0.5 font-bold">{item.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
