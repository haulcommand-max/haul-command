'use client';

/**
 * CorridorHeartbeatStrip — Live market truth for corridor pages
 * 
 * Client component that fetches from /api/market/heartbeat?corridor=XX-YY
 * and displays:
 *   - Active loads count + freshness
 *   - Verified operator density
 *   - Market mode badge (live/seeding/demand_capture/waitlist)
 *   - Recent load summaries
 *   - CTAs: Browse Loads, Post Load, Find Operator
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

const MODE_CONFIG = {
    live: { label: 'LIVE', color: '#22C55E', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', pulse: true },
    seeding: { label: 'SEEDING', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', pulse: false },
    demand_capture: { label: 'DEMAND CAPTURE', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', pulse: false },
    waitlist: { label: 'WAITLIST', color: '#6B7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)', pulse: false },
};

export function CorridorHeartbeatStrip({
    corridorSlug,
    displayName,
}: {
    corridorSlug: string;
    displayName: string;
}) {
    const [data, setData] = useState<HeartbeatData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/market/heartbeat?corridor=${encodeURIComponent(corridorSlug)}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [corridorSlug]);

    if (loading) {
        return (
            <div style={{
                padding: '20px 24px',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', gap: 16, alignItems: 'center',
            }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', animation: 'pulse 1.5s infinite' }} />
                <div style={{ flex: 1 }}>
                    <div style={{ width: 120, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
                </div>
            </div>
        );
    }

    if (!data) return null;

    const mode = MODE_CONFIG[data.market_mode];

    return (
        <div style={{
            borderRadius: 18,
            border: `1px solid ${mode.border}`,
            background: `linear-gradient(135deg, ${mode.bg}, rgba(0,0,0,0.2))`,
            overflow: 'hidden',
        }}>
            {/* Top bar: Mode + Freshness + Key Stats */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                padding: '16px 20px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Mode badge */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '5px 12px', borderRadius: 999,
                        background: mode.bg, border: `1px solid ${mode.border}`,
                    }}>
                        {mode.pulse && (
                            <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
                                <span style={{
                                    position: 'absolute', inset: 0, borderRadius: '50%',
                                    background: mode.color, opacity: 0.6,
                                    animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
                                }} />
                                <span style={{
                                    position: 'relative', width: 8, height: 8, borderRadius: '50%',
                                    background: mode.color,
                                }} />
                            </span>
                        )}
                        <span style={{
                            fontSize: 10, fontWeight: 900, letterSpacing: '0.12em',
                            textTransform: 'uppercase', color: mode.color,
                        }}>
                            {mode.label}
                        </span>
                    </div>

                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                        {data.freshness_label}
                    </span>
                </div>

                {/* Key metrics */}
                <div style={{ display: 'flex', gap: 20 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{data.active_loads}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Loads</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{data.verified_operators}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Verified</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{data.total_operators}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Operators</div>
                    </div>
                </div>
            </div>

            {/* Recent loads (if any) */}
            {data.recent_loads.length > 0 && (
                <div style={{
                    padding: '0 20px 16px',
                    display: 'flex',
                    gap: 8,
                    overflowX: 'auto',
                }}>
                    {data.recent_loads.slice(0, 4).map((load, i) => (
                        <div key={i} style={{
                            flex: '0 0 auto',
                            padding: '10px 14px',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            minWidth: 180,
                        }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {load.origin} → {load.destination}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                                <span>{load.position_type}</span>
                                <span>{load.rate_amount ? `$${load.rate_amount}` : ''}</span>
                                <span>{load.ago}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CTAs */}
            <div style={{
                display: 'flex', gap: 8,
                padding: '12px 20px 16px',
                borderTop: '1px solid rgba(255,255,255,0.04)',
            }}>
                <Link aria-label="Navigation Link" href="/loads" style={{
                    flex: 1, textAlign: 'center',
                    padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(241,169,27,0.12)', border: '1px solid rgba(241,169,27,0.25)',
                    color: '#F1A91B', fontSize: 12, fontWeight: 800,
                    textDecoration: 'none',
                }}>
                    Browse Loads
                </Link>
                <Link aria-label="Navigation Link" href="/loads/post" style={{
                    flex: 1, textAlign: 'center',
                    padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff', fontSize: 12, fontWeight: 800,
                    textDecoration: 'none',
                }}>
                    Post Load
                </Link>
                <Link aria-label="Navigation Link" href={`/directory`} style={{
                    flex: 1, textAlign: 'center',
                    padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff', fontSize: 12, fontWeight: 800,
                    textDecoration: 'none',
                }}>
                    Find Operator
                </Link>
            </div>
        </div>
    );
}

export default CorridorHeartbeatStrip;
