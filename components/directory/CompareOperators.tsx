'use client';

import { useState } from 'react';

interface Operator {
    id: string;
    display_name: string;
    trust_score: number;
    tier: string;
    response_time_min: number;
    completion_rate: number;
    on_time_rate: number;
    cancellation_rate: number;
    total_completions: number;
    corridor_experience: string[];
    equipment: string[];
    available: boolean;
    rate_per_mile?: number;
    distance_miles?: number;
    languages: string[];
    verified_insurance: boolean;
    verified_license: boolean;
    verified_equipment: boolean;
    last_active: string;
    photo_url?: string;
}

interface Props {
    operators: Operator[];
    onRemove: (id: string) => void;
    onBook: (id: string) => void;
}

export default function CompareOperators({ operators, onRemove, onBook }: Props) {
    if (operators.length === 0) return null;

    const best = (metric: keyof Operator, higher = true) => {
        const vals = operators.map(o => Number(o[metric]) || 0);
        const target = higher ? Math.max(...vals) : Math.min(...vals);
        return operators.filter(o => (Number(o[metric]) || 0) === target).map(o => o.id);
    };

    const Cell = ({ value, best: isBest, suffix = '' }: { value: string | number; best: boolean; suffix?: string }) => (
        <td style={{
            padding: '10px 12px', fontSize: 13, textAlign: 'center',
            color: isBest ? '#10B981' : '#D1D5DB',
            fontWeight: isBest ? 700 : 400,
            background: isBest ? 'rgba(16,185,129,0.06)' : 'transparent',
        }}>{value}{suffix}</td>
    );

    const rows: { label: string; key: keyof Operator; higher?: boolean; suffix?: string; format?: (v: any) => string }[] = [
        { label: 'Trust Score', key: 'trust_score', higher: true, suffix: '/100' },
        { label: 'Response Time', key: 'response_time_min', higher: false, suffix: 'min' },
        { label: 'Completion Rate', key: 'completion_rate', higher: true, format: v => `${(v * 100).toFixed(0)}%` },
        { label: 'On-Time Rate', key: 'on_time_rate', higher: true, format: v => `${(v * 100).toFixed(0)}%` },
        { label: 'Cancellation Rate', key: 'cancellation_rate', higher: false, format: v => `${(v * 100).toFixed(1)}%` },
        { label: 'Total Completions', key: 'total_completions', higher: true },
        { label: 'Distance', key: 'distance_miles', higher: false, suffix: 'mi' },
        { label: 'Rate/Mile', key: 'rate_per_mile', higher: false, format: v => v ? `$${v.toFixed(2)}` : '—' },
    ];

    return (
        <div style={{
            background: '#0B1120', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 16,
            overflow: 'auto', fontFamily: "var(--font-inter, 'Inter', system-ui, sans-serif)",
        }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ margin: 0, color: '#F9FAFB', fontSize: 16, fontWeight: 700 }}>⚖️ Compare Operators ({operators.length})</h3>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ padding: '12px', width: 140, textAlign: 'left', fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Metric</th>
                        {operators.map(op => (
                            <th key={op.id} style={{ padding: '12px', textAlign: 'center', minWidth: 150 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                                        {op.photo_url ? <img src={op.photo_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} /> : '👤'}
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB' }}>{op.display_name}</span>
                                    <span style={{
                                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                                        background: op.tier === 'elite' ? 'rgba(245,158,11,0.2)' : op.tier === 'strong' ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.08)',
                                        color: op.tier === 'elite' ? '#F59E0B' : op.tier === 'strong' ? '#8B5CF6' : '#9CA3AF',
                                    }}>{op.tier.toUpperCase()}</span>
                                    <button aria-label="Interactive Button" onClick={() => onRemove(op.id)} style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 11, cursor: 'pointer' }}>✕ Remove</button>
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {/* Availability */}
                    <tr style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>Available Now</td>
                        {operators.map(op => (
                            <td key={op.id} style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: op.available ? '#10B981' : '#EF4444' }}>
                                    {op.available ? '🟢 Yes' : '🔴 No'}
                                </span>
                            </td>
                        ))}
                    </tr>

                    {/* Metric rows */}
                    {rows.map(row => {
                        const bests = best(row.key, row.higher !== false);
                        return (
                            <tr key={row.key} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '10px 12px', fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>{row.label}</td>
                                {operators.map(op => {
                                    const v = op[row.key];
                                    const display = row.format ? row.format(v) : `${v ?? '—'}${row.suffix || ''}`;
                                    return <Cell key={op.id} value={display} best={bests.includes(op.id)} />;
                                })}
                            </tr>
                        );
                    })}

                    {/* Verification */}
                    <tr style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>Verified</td>
                        {operators.map(op => (
                            <td key={op.id} style={{ padding: '10px 12px', textAlign: 'center', fontSize: 14 }}>
                                {op.verified_insurance ? '🛡️' : '⬜'} {op.verified_license ? '📋' : '⬜'} {op.verified_equipment ? '🚗' : '⬜'}
                            </td>
                        ))}
                    </tr>

                    {/* Equipment */}
                    <tr style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>Equipment</td>
                        {operators.map(op => (
                            <td key={op.id} style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, color: '#D1D5DB' }}>
                                {op.equipment.length > 0 ? op.equipment.join(', ') : '—'}
                            </td>
                        ))}
                    </tr>

                    {/* Corridors */}
                    <tr style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>Corridors</td>
                        {operators.map(op => (
                            <td key={op.id} style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, color: '#D1D5DB' }}>
                                {op.corridor_experience.length > 0 ? op.corridor_experience.join(', ') : '—'}
                            </td>
                        ))}
                    </tr>

                    {/* Book CTA */}
                    <tr style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '12px' }} />
                        {operators.map(op => (
                            <td key={op.id} style={{ padding: '12px', textAlign: 'center' }}>
                                <button aria-label="Interactive Button" onClick={() => onBook(op.id)} disabled={!op.available} style={{
                                    padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                    background: op.available ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'rgba(255,255,255,0.06)',
                                    color: op.available ? '#030712' : '#6B7280',
                                    fontWeight: 700, fontSize: 13, opacity: op.available ? 1 : 0.5,
                                }}>
                                    {op.available ? 'Book Now' : 'Unavailable'}
                                </button>
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
