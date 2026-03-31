'use client';

/**
 * DensityScoreboard — Band C Rank 3
 * 
 * Local density and coverage visibility system.
 * Shows: verified count, claimed count, loads, coverage gaps, founder advantages.
 * 
 * Variants:
 *   - market:   State/city density board
 *   - corridor: Lane-specific density
 *   - category: Service type density
 * 
 * Includes gap prompts and founder advantage nudges for thin markets.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { track } from '@/lib/telemetry';

interface DensityData {
    verified_operators: number;
    claimed_operators: number;
    total_operators: number;
    active_loads: number;
    market_mode: string;
    service_type_mix: Record<string, number>;
}

interface DensityScoreboardProps {
    variant?: 'market' | 'corridor' | 'category';
    state?: string;
    corridor?: string;
    title?: string;
    className?: string;
}

function getGapPrompts(data: DensityData): string[] {
    const prompts: string[] = [];
    if (data.verified_operators < 5) {
        const needed = 5 - data.verified_operators;
        prompts.push(`${needed} more verified operators unlock stronger corridor coverage`);
    }
    if (data.total_operators > 0 && data.claimed_operators / data.total_operators < 0.3) {
        prompts.push(`${Math.round((1 - data.claimed_operators / data.total_operators) * 100)}% of operators are unclaimed — early advantage available`);
    }
    const serviceTypes = Object.entries(data.service_type_mix || {});
    const thinTypes = serviceTypes.filter(([, count]) => count < 3);
    if (thinTypes.length > 0) {
        prompts.push(`Thin supply: ${thinTypes.map(([type]) => type).join(', ')}`);
    }
    if (data.market_mode === 'seeding') {
        prompts.push('Be one of the first visible operators here');
    }
    return prompts.slice(0, 3);
}

function getFounderPrompt(data: DensityData): string | null {
    if (data.market_mode === 'waitlist') return 'Early market advantage available — founding badges for first claimers';
    if (data.verified_operators < 3) return 'Be among the first verified — founding operators get permanent priority';
    if (data.claimed_operators < 5) return 'Claim now to appear early in this market';
    return null;
}

export function DensityScoreboard({
    variant = 'market',
    state,
    corridor,
    title,
    className = '',
}: DensityScoreboardProps) {
    const [data, setData] = useState<DensityData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams();
        if (state) params.set('state', state);
        if (corridor) params.set('corridor', corridor);

        fetch(`/api/market/heartbeat?${params}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [state, corridor]);

    useEffect(() => {
        if (!loading) {
            track('density_board_seen' as any, {
                metadata: { variant, market_mode: data?.market_mode || 'unknown', state, corridor },
            });
        }
    }, [loading, data, variant, state, corridor]);

    if (loading) {
        return (
            <div className={className} style={{
                padding: '20px', borderRadius: 18, background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{ width: '50%', height: 14, borderRadius: 6, background: 'rgba(255,255,255,0.04)', marginBottom: 16 }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ height: 60, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }} />
                    ))}
                </div>
            </div>
        );
    }

    if (!data) return null;

    const gapPrompts = getGapPrompts(data);
    const founderPrompt = getFounderPrompt(data);
    const modeColors: Record<string, string> = {
        live: '#22C55E', seeding: '#F59E0B', demand_capture: '#8B5CF6', waitlist: '#6B7280',
    };
    const modeColor = modeColors[data.market_mode] || '#6B7280';

    const densityMetrics = [
        { value: data.verified_operators, label: 'Verified', color: '#22C55E', show: true },
        { value: data.claimed_operators, label: 'Claimed', color: '#F59E0B', show: true },
        { value: data.active_loads, label: 'Active Loads', color: '#3B82F6', show: data.active_loads > 0 },
        { value: data.total_operators, label: 'In Network', color: '#8B5CF6', show: data.total_operators > 0 },
        { value: Object.keys(data.service_type_mix || {}).length, label: 'Service Types', color: '#14B8A6', show: Object.keys(data.service_type_mix || {}).length > 0 },
    ].filter(m => m.show);

    return (
        <div className={className} style={{
            borderRadius: 18, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(0,0,0,0.1))',
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>
                        {title || (variant === 'corridor' ? 'Corridor Density' : variant === 'category' ? 'Category Density' : 'Market Density')}
                    </div>
                    <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                        Live coverage snapshot
                    </div>
                </div>
                <span style={{
                    fontSize: 9, fontWeight: 900, padding: '4px 10px', borderRadius: 8,
                    background: `${modeColor}10`, border: `1px solid ${modeColor}20`,
                    color: modeColor, textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                    {data.market_mode.replace('_', ' ')}
                </span>
            </div>

            {/* Density metrics grid */}
            <div style={{
                padding: '16px 20px',
                display: 'grid', gridTemplateColumns: `repeat(${Math.min(densityMetrics.length, 3)}, 1fr)`,
                gap: 10,
            }}>
                {densityMetrics.map(m => (
                    <div key={m.label} style={{
                        padding: '12px', borderRadius: 12, textAlign: 'center',
                        background: `${m.color}06`, border: `1px solid ${m.color}10`,
                    }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: m.color }}>{m.value}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: m.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>
                            {m.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Gap prompts */}
            {gapPrompts.length > 0 && (
                <div style={{ padding: '0 20px 16px' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                        Coverage Gaps
                    </div>
                    {gapPrompts.map((p, i) => (
                        <div key={i} style={{
                            display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 4,
                        }}>
                            <span style={{ color: '#F59E0B', fontWeight: 900, fontSize: 12, lineHeight: 1.5 }}>›</span>
                            <span style={{ fontSize: 11, color: '#bbb', lineHeight: 1.4 }}>{p}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Founder advantage */}
            {founderPrompt && (
                <div style={{
                    padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.04)',
                    background: 'rgba(241,169,27,0.03)',
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <span style={{ fontSize: 14 }}>🌱</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B' }}>{founderPrompt}</span>
                    </div>
                    <Link aria-label="Navigation Link" href="/claim" onClick={() => {
                        track('density_claim_clicked' as any, { metadata: { market_mode: data.market_mode, state, corridor } });
                    }} style={{
                        display: 'inline-flex', marginTop: 10, padding: '8px 18px', borderRadius: 10,
                        background: '#F1A91B', color: '#000', fontWeight: 800, fontSize: 11,
                        textDecoration: 'none',
                    }}>
                        Claim Your Profile →
                    </Link>
                </div>
            )}
        </div>
    );
}

export default DensityScoreboard;
