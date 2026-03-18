'use client';

/**
 * DominanceSignals — Band D Rank 4
 * Momentum modules, trend badges, claim growth signals.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { track } from '@/lib/telemetry';

interface MomentumData {
    verified_operators: number; claimed_operators: number; total_operators: number;
    active_loads: number; market_mode: string;
}

function deriveMomentum(data: MomentumData) {
    const claimPct = data.total_operators > 0 ? Math.round(data.claimed_operators / data.total_operators * 100) : 0;
    const badges: { label: string; color: string; icon: string }[] = [];

    if (data.market_mode === 'live' && data.active_loads > 5) badges.push({ label: 'HIGH DENSITY', color: '#22C55E', icon: '📡' });
    if (claimPct > 40) badges.push({ label: 'FAST GROWING', color: '#F59E0B', icon: '🚀' });
    if (data.verified_operators >= 10) badges.push({ label: 'ROUTE READY', color: '#3B82F6', icon: '✓' });
    if (data.market_mode === 'seeding' && data.claimed_operators > 0) badges.push({ label: 'FOUNDER MARKET', color: '#8B5CF6', icon: '🌱' });
    if (data.active_loads > 10) badges.push({ label: 'RESCUE HOTSPOT', color: '#EF4444', icon: '🚨' });

    return {
        badges: badges.slice(0, 3),
        claimPct,
        trend: data.active_loads > 3 ? 'up' : data.market_mode === 'seeding' ? 'building' : 'stable',
    };
}

export function MarketMomentumModule({ state }: { state?: string }) {
    const [data, setData] = useState<MomentumData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const p = new URLSearchParams();
        if (state) p.set('state', state);
        fetch(`/api/market/heartbeat?${p}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [state]);

    if (loading || !data) return null;

    const { badges, claimPct, trend } = deriveMomentum(data);
    if (badges.length === 0) return null;

    const trendConfig: Record<string, { icon: string; label: string; color: string }> = {
        up: { icon: '↑', label: 'Activity Up', color: '#22C55E' },
        building: { icon: '→', label: 'Building', color: '#F59E0B' },
        stable: { icon: '—', label: 'Steady', color: '#888' },
    };
    const t = trendConfig[trend];

    return (
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>Market Momentum</div>
                <span style={{ fontSize: 11, fontWeight: 800, color: t.color }}>{t.icon} {t.label}</span>
            </div>
            <div style={{ padding: '12px 18px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {badges.map(b => (
                    <span key={b.label} style={{
                        fontSize: 9, fontWeight: 900, padding: '4px 10px', borderRadius: 8,
                        background: `${b.color}08`, border: `1px solid ${b.color}15`,
                        color: b.color, textTransform: 'uppercase', letterSpacing: '0.06em',
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                        {b.icon} {b.label}
                    </span>
                ))}
            </div>
            {claimPct > 0 && (
                <div style={{ padding: '0 18px 14px' }}>
                    <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>Claim Penetration</div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(claimPct, 100)}%`, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #F59E0B, #22C55E)', transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#F59E0B', marginTop: 4 }}>{claimPct}% claimed</div>
                </div>
            )}
        </div>
    );
}

export function DominanceBadges({ state }: { state?: string }) {
    const [data, setData] = useState<MomentumData | null>(null);
    useEffect(() => {
        const p = new URLSearchParams();
        if (state) p.set('state', state);
        fetch(`/api/market/heartbeat?${p}`).then(r => r.ok ? r.json() : null).then(setData).catch(() => {});
    }, [state]);
    if (!data) return null;
    const { badges } = deriveMomentum(data);
    if (badges.length === 0) return null;
    return (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {badges.map(b => (
                <span key={b.label} style={{ fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 6, background: `${b.color}08`, border: `1px solid ${b.color}15`, color: b.color }}>
                    {b.icon} {b.label}
                </span>
            ))}
        </div>
    );
}
