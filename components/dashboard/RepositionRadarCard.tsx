'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, TrendingUp, Zap, AlertCircle, RefreshCw } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface RepositionPlay {
    id: string;
    target_region: string;
    target_country: string;
    play_type: string;
    confidence_score: number;
    distance_miles: number | null;
    expected_premium_pct: number | null;
    shortage_severity: string | null;
    explanation: string | null;
    valid_until: string;
}

interface RadarData {
    plays: RepositionPlay[];
    plays_by_type: {
        sure_thing: RepositionPlay | null;
        best_value: RepositionPlay | null;
        speedster: RepositionPlay | null;
    };
    liquidity_score: number | null;
    liquidity_breakdown: {
        availability: number;
        response: number;
        capabilities: number;
        port_depth: number;
    } | null;
    home_region_snapshot: {
        cal_label: string;
        coverage_action_level: number;
        pressure_24h: number;
        premium_low_pct: number;
        premium_high_pct: number;
        loads_posted_7d: number;
        available_now: number;
    } | null;
}

// ── Play type constants ────────────────────────────────────────────────────────

const PLAY_CONFIG: Record<string, { label: string; icon: string; color: string; border: string; desc: string }> = {
    sure_thing: {
        label: 'Sure Thing',
        icon: '🏆',
        color: '#34d399',
        border: 'rgba(52,211,153,0.25)',
        desc: 'Highest fill confidence — escorts needed now',
    },
    best_value: {
        label: 'Best Value',
        icon: '💰',
        color: '#f59e0b',
        border: 'rgba(245,158,11,0.25)',
        desc: 'Best premium-to-distance ratio',
    },
    speedster: {
        label: 'Speedster',
        icon: '⚡',
        color: '#a78bfa',
        border: 'rgba(167,139,250,0.25)',
        desc: 'Closest zone with active demand',
    },
};

const SEVERITY_COLOR: Record<string, string> = {
    critical: '#f87171',
    high: '#fb923c',
    medium: '#fbbf24',
    low: '#34d399',
};

// ── Component ──────────────────────────────────────────────────────────────────

export function RepositionRadarCard() {
    const [data, setData] = useState<RadarData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/dashboard/reposition-radar')
            .then(r => r.json())
            .then(setData)
            .catch(() => setError('Could not load plays'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={cardBase}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '28px 20px' }}>
                <RefreshCw style={{ width: 14, height: 14, color: '#6b7280', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 12, color: '#6b7280' }}>Calculating plays…</span>
            </div>
        </div>
    );

    if (error || !data) return (
        <div style={cardBase}>
            <div style={{ padding: '24px 20px', display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle style={{ width: 14, height: 14, color: '#f87171' }} />
                <span style={{ fontSize: 12, color: '#9ca3af' }}>
                    {error ?? 'No plays available. Check back in a few hours.'}
                </span>
            </div>
        </div>
    );

    const hasPlays = data.plays.length > 0;
    const snap = data.home_region_snapshot;

    return (
        <div style={cardBase}>
            {/* Header */}
            <div style={{ padding: '16px 20px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Zap style={{ width: 14, height: 14, color: '#F1A91B' }} />
                        <span style={{ fontSize: 11, fontWeight: 900, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                            Reposition Radar
                        </span>
                    </div>
                    {data.liquidity_score != null && (
                        <div style={{ fontSize: 10, color: '#6b7280', marginTop: 3 }}>
                            Your liquidity score: <span style={{ color: data.liquidity_score >= 70 ? '#34d399' : data.liquidity_score >= 40 ? '#f59e0b' : '#f87171', fontWeight: 700 }}>{Math.round(data.liquidity_score)}</span>/100
                        </div>
                    )}
                </div>
                {/* Home region pressure */}
                {snap && (
                    <div style={{
                        padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800,
                        background: snap.cal_label === 'CRITICAL' ? 'rgba(239,68,68,0.12)'
                            : snap.cal_label === 'TIGHT' ? 'rgba(245,158,11,0.12)'
                                : 'rgba(52,211,153,0.08)',
                        color: snap.cal_label === 'CRITICAL' ? '#f87171'
                            : snap.cal_label === 'TIGHT' ? '#fbbf24'
                                : '#34d399',
                        border: `1px solid ${snap.cal_label === 'CRITICAL' ? 'rgba(239,68,68,0.25)'
                            : snap.cal_label === 'TIGHT' ? 'rgba(245,158,11,0.25)'
                                : 'rgba(52,211,153,0.15)'}`,
                    }}>
                        Home: {snap.cal_label}
                    </div>
                )}
            </div>

            {/* Plays */}
            {!hasPlays ? (
                <div style={{ padding: '24px 20px', textAlign: 'center' }}>
                    <TrendingUp style={{ width: 28, height: 28, color: '#374151', margin: '0 auto 10px' }} />
                    <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>No reposition plays right now.</p>
                    <p style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>
                        Plays appear when your nearby zones have open gaps.
                    </p>
                </div>
            ) : (
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(['sure_thing', 'best_value', 'speedster'] as const).map(type => {
                        const play = data.plays_by_type[type];
                        const cfg = PLAY_CONFIG[type];
                        if (!play) return null;
                        const isOpen = expanded === play.id;

                        return (
                            <div key={play.id}
                                onClick={() => setExpanded(isOpen ? null : play.id)}
                                style={{
                                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                                    background: `linear-gradient(135deg, rgba(255,255,255,0.025), rgba(255,255,255,0.012))`,
                                    border: `1px solid ${isOpen ? cfg.border : 'rgba(255,255,255,0.07)'}`,
                                    transition: 'border-color 0.15s',
                                }}
                            >
                                {/* Play header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                {cfg.label}
                                            </div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb', marginTop: 1 }}>
                                                {play.target_region}
                                                {play.distance_miles != null && (
                                                    <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 400, marginLeft: 6 }}>
                                                        {Math.round(play.distance_miles)} mi
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        {play.expected_premium_pct != null && (
                                            <div style={{ fontSize: 14, fontWeight: 900, color: cfg.color }}>
                                                +{Math.round(play.expected_premium_pct)}%
                                            </div>
                                        )}
                                        <div style={{ fontSize: 10, color: '#4b5563', marginTop: 1 }}>
                                            {Math.round(play.confidence_score * 100)}% confidence
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded detail */}
                                {isOpen && (
                                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        {play.shortage_severity && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: SEVERITY_COLOR[play.shortage_severity] ?? '#9ca3af' }}>
                                                    {play.shortage_severity} shortage
                                                </span>
                                            </div>
                                        )}
                                        {play.explanation && (
                                            <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5, margin: '0 0 8px' }}>
                                                {play.explanation}
                                            </p>
                                        )}
                                        <div style={{ fontSize: 10, color: '#4b5563' }}>
                                            Valid until {new Date(play.valid_until).toLocaleString()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Market context strip */}
            {snap && hasPlays && (
                <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 16 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 900, color: '#e5e7eb' }}>{snap.loads_posted_7d ?? 0}</div>
                        <div style={{ fontSize: 9, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Loads 7d</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 900, color: '#e5e7eb' }}>{snap.available_now ?? 0}</div>
                        <div style={{ fontSize: 9, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Supply Now</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 900, color: '#f59e0b' }}>
                            +{Math.round(((snap.premium_low_pct ?? 0) + (snap.premium_high_pct ?? 0)) / 2)}%
                        </div>
                        <div style={{ fontSize: 9, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Avg Premium</div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <MapPin style={{ width: 11, height: 11, color: '#4b5563' }} />
                <span style={{ fontSize: 11, color: '#4b5563' }}>
                    {hasPlays ? `${data.plays.length} plays available` : 'Watching market signals…'}
                </span>
                {hasPlays && (
                    <Link href="/dashboard/map" style={{ marginLeft: 'auto', fontSize: 11, color: '#F1A91B', fontWeight: 700, textDecoration: 'none' }}>
                        View map →
                    </Link>
                )}
            </div>
        </div>
    );
}

const cardBase: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14,
    overflow: 'hidden',
};
