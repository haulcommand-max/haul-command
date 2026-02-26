'use client';

/**
 * components/intelligence/SupplyRadarStrip.tsx
 *
 * Supply radar UI — shows corridor shortage index, available escorts,
 * and avg response time. Used on /directory and /map.
 *
 * Data: reads from /api/supply/recommendations (supply_move_recommendations table)
 * or falls back to static corridor data while backend is wiring up.
 *
 * Phase 1: Static data fallback + scaffold
 * Phase 2: Wire to /api/supply/recommendations via useEffect
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/hc-events';

interface CorridorSupply {
    slug: string;
    label: string;
    scarcityIndex: number;   // 0-100 (100 = worst shortage)
    availableNow: number;
    avgResponseMin: number;
}

// Static fallback until API is wired
const STATIC_SUPPLY: CorridorSupply[] = [
    { slug: 'i-10', label: 'I-10 Gulf South', scarcityIndex: 72, availableNow: 13, avgResponseMin: 34 },
    { slug: 'i-35', label: 'I-35 Central Spine', scarcityIndex: 69, availableNow: 16, avgResponseMin: 28 },
    { slug: 'i-20', label: 'I-20 Deep South', scarcityIndex: 62, availableNow: 17, avgResponseMin: 41 },
    { slug: 'i-75', label: 'I-75 Southeast', scarcityIndex: 58, availableNow: 26, avgResponseMin: 22 },
    { slug: 'i-40', label: 'I-40 Southwest', scarcityIndex: 45, availableNow: 21, avgResponseMin: 47 },
];

function scarcityColor(idx: number): string {
    if (idx >= 70) return '#f87171';   // red
    if (idx >= 50) return '#f59e0b';   // amber
    return '#27d17f';                  // green
}

function scarcityLabel(idx: number): string {
    if (idx >= 70) return 'Critical';
    if (idx >= 50) return 'Tight';
    return 'Stable';
}

interface Props {
    /** Where is this strip being shown? Used for analytics */
    surface?: 'directory' | 'map';
    /** Show only corridors with scarcity above this threshold */
    minScarcity?: number;
}

export default function SupplyRadarStrip({ surface = 'directory', minScarcity = 0 }: Props) {
    const [corridors, setCorridors] = useState<CorridorSupply[]>(STATIC_SUPPLY);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Phase 2: swap this for live API call
        // fetch('/api/supply/recommendations').then(r => r.json()).then(setCorridors);
        setLoading(false);
    }, []);

    const filtered = corridors
        .filter(c => c.scarcityIndex >= minScarcity)
        .sort((a, b) => b.scarcityIndex - a.scarcityIndex);

    return (
        <div style={{
            background: 'rgba(8, 14, 22, 0.95)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '12px 0',
        }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Zap size={13} color="#f59e0b" />
                        <span style={{ fontSize: 10, fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                            Supply Radar
                        </span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 4 }}>
                            · Updated 4 min ago
                        </span>
                    </div>
                    <Link
                        href="/escort/corridor"
                        onClick={() => trackEvent('directory_scroll_cta_shown', { surface })}
                        style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontWeight: 700 }}
                    >
                        See all corridors →
                    </Link>
                </div>

                {/* Corridor shortage bars */}
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {filtered.map(c => {
                        const color = scarcityColor(c.scarcityIndex);
                        return (
                            <Link
                                key={c.slug}
                                href={`/corridors/${c.slug}`}
                                onClick={() => trackEvent('corridor_viewed', { corridor_slug: c.slug, surface })}
                                style={{
                                    flexShrink: 0, minWidth: 160, padding: '10px 14px',
                                    borderRadius: 12, textDecoration: 'none',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${color}22`,
                                }}
                            >
                                {/* Corridor name + scarcity badge */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: '#e2eaf4', lineHeight: 1.2 }}>{c.label}</span>
                                    <span style={{
                                        fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 6,
                                        background: `${color}18`, color, border: `1px solid ${color}30`,
                                        textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', marginLeft: 6,
                                    }}>
                                        {scarcityLabel(c.scarcityIndex)}
                                    </span>
                                </div>

                                {/* Scarcity bar */}
                                <div style={{ height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.06)', marginBottom: 8 }}>
                                    <div style={{ height: '100%', borderRadius: 999, width: `${c.scarcityIndex}%`, background: color, transition: 'width 0.8s ease' }} />
                                </div>

                                {/* Stats */}
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <span style={{ color, fontWeight: 800 }}>{c.availableNow}</span> avail
                                    </span>
                                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <Clock size={9} />
                                        {c.avgResponseMin}m
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Shortage banner — shows when any corridor is critical */}
                {filtered.some(c => c.scarcityIndex >= 70) && (
                    <div style={{
                        marginTop: 10, padding: '8px 14px', borderRadius: 10,
                        background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <AlertTriangle size={12} color="#f87171" />
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
                            Supply is critically low on{' '}
                            <strong style={{ color: '#f87171' }}>
                                {filtered.filter(c => c.scarcityIndex >= 70).map(c => c.label).join(', ')}
                            </strong>
                            .{' '}
                            <Link href="/onboarding/start?role=escort" style={{ color: '#f87171', fontWeight: 700, textDecoration: 'underline' }}>
                                Escort operators: claim this corridor
                            </Link>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
