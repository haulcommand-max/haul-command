'use client';

/**
 * MarketPlaybook — Band D Rank 7
 * Market readiness dashboard + gap-to-dominance checklists.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MobileGate } from '@/components/mobile/MobileGate';
import { track } from '@/lib/telemetry';

interface PlaybookData {
    verified_operators: number; claimed_operators: number; total_operators: number;
    active_loads: number; market_mode: string; service_type_mix: Record<string, number>;
}

interface ChecklistItem { label: string; met: boolean; target: string; current: string; action?: string }

function buildChecklist(data: PlaybookData): ChecklistItem[] {
    return [
        { label: 'Verified operators', met: data.verified_operators >= 5, target: '5+', current: String(data.verified_operators), action: '/directory' },
        { label: 'Claimed profiles', met: data.claimed_operators >= 3, target: '3+', current: String(data.claimed_operators), action: '/claim' },
        { label: 'Active loads', met: data.active_loads >= 3, target: '3+', current: String(data.active_loads), action: '/loads' },
        { label: 'Service type coverage', met: Object.keys(data.service_type_mix || {}).length >= 3, target: '3+ types', current: `${Object.keys(data.service_type_mix || {}).length} types`, action: '/directory' },
        { label: 'Claim penetration', met: data.total_operators > 0 && (data.claimed_operators / data.total_operators) >= 0.3, target: '30%+', current: data.total_operators > 0 ? `${Math.round(data.claimed_operators / data.total_operators * 100)}%` : '0%', action: '/claim' },
    ];
}

function getPlaybookMode(mode: string): { title: string; desc: string; color: string; steps: string[] } {
    const playbooks: Record<string, { title: string; desc: string; color: string; steps: string[] }> = {
        waitlist: { title: 'Waitlist â†’ Seeding', color: '#6B7280', desc: 'Get first operators and loads into this market.',
            steps: ['Seed 5+ operator profiles', 'Post first load or attract first broker', 'Identify founder operators', 'Set up corridor connections'] },
        demand_capture: { title: 'Demand Capture â†’ Live', color: '#8B5CF6', desc: 'Loads flowing but supply is thin. Priority: verified supply.',
            steps: ['Recruit 3+ verified operators', 'Enable rescue actions for aging posts', 'Deploy claim pressure on profiles', 'Activate corridor heartbeat'] },
        seeding: { title: 'Seeding â†’ Live', color: '#F59E0B', desc: 'Operators claiming, activity building. Priority: real matches.',
            steps: ['Hit 5 verified operators', 'Get first real load fill', 'Activate infrastructure support', 'Deploy outcome proof blocks'] },
        live: { title: 'Live â†’ Consolidating', color: '#22C55E', desc: 'Market is active. Priority: dominance signals and fill rate.',
            steps: ['Maintain 80%+ post visibility', 'Grow claim penetration above 40%', 'Show outcome proof on all surfaces', 'Enable sponsor slots'] },
    };
    return playbooks[mode] || playbooks.waitlist;
}

export default function MarketPlaybookPage() {
    const [stateCode, setStateCode] = useState('TX');
    const [data, setData] = useState<PlaybookData | null>(null);
    const [loading, setLoading] = useState(true);
    const states = ['TX', 'CA', 'FL', 'GA', 'NC', 'OH', 'PA', 'IL', 'LA', 'OK', 'CO', 'AZ', 'WA', 'NY', 'NJ'];

    useEffect(() => {
        setLoading(true);
        fetch(`/api/market/heartbeat?state=${stateCode}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [stateCode]);

    useEffect(() => {
        track('playbook_page_seen' as any, { metadata: { state: stateCode, mode: data?.market_mode } });
    }, [stateCode, data]);

    const checklist = data ? buildChecklist(data) : [];
    const playbook = data ? getPlaybookMode(data.market_mode) : null;
    const completedCount = checklist.filter(c => c.met).length;
    const readinessPct = checklist.length > 0 ? Math.round(completedCount / checklist.length * 100) : 0;

    const content = (
        <div style={{ minHeight: '100vh', background: '#060b12', color: '#f5f7fb' }}>
            <div style={{ padding: '48px 16px 80px', maxWidth: 800, margin: '0 auto' }}>
                <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 8px' }}>
                    Market Playbook
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: '0 0 24px' }}>
                    Track readiness and execute gap-to-dominance for each market.
                </p>

                {/* State selector */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
                    {states.map(s => (
                        <button aria-label="Interactive Button" key={s} onClick={() => setStateCode(s)} style={{
                            padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                            background: stateCode === s ? 'rgba(241,169,27,0.12)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${stateCode === s ? 'rgba(241,169,27,0.25)' : 'rgba(255,255,255,0.06)'}`,
                            color: stateCode === s ? '#F1A91B' : '#888', fontSize: 12, fontWeight: 700,
                        }}>
                            {s}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading market data...</div>
                ) : data && playbook ? (
                    <>
                        {/* Readiness gauge */}
                        <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', marginBottom: 20 }}>
                            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{stateCode} Market</div>
                                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Readiness: {readinessPct}%</div>
                                </div>
                                <span style={{ fontSize: 9, fontWeight: 900, padding: '4px 12px', borderRadius: 8, background: `${playbook.color}10`, border: `1px solid ${playbook.color}20`, color: playbook.color, textTransform: 'uppercase' }}>
                                    {data.market_mode.replace('_', ' ')}
                                </span>
                            </div>
                            <div style={{ padding: '0 20px 16px' }}>
                                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                                    <div style={{ width: `${readinessPct}%`, height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${playbook.color}, #22C55E)`, transition: 'width 0.5s ease' }} />
                                </div>
                            </div>
                        </div>

                        {/* Playbook */}
                        <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${playbook.color}15`, background: `${playbook.color}04`, marginBottom: 20 }}>
                            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${playbook.color}08` }}>
                                <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{playbook.title}</div>
                                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{playbook.desc}</div>
                            </div>
                            <div style={{ padding: '12px 20px' }}>
                                {playbook.steps.map((step, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                        <span style={{ fontSize: 12, fontWeight: 900, color: playbook.color, width: 20 }}>{i + 1}.</span>
                                        <span style={{ fontSize: 12, color: '#bbb' }}>{step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Gap checklist */}
                        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13, fontWeight: 900, color: '#fff' }}>
                                Gap-to-Dominance Checklist ({completedCount}/{checklist.length})
                            </div>
                            {checklist.map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 20px', borderBottom: i < checklist.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                                    <span style={{ fontSize: 14, color: item.met ? '#22C55E' : '#EF4444', fontWeight: 900 }}>
                                        {item.met ? 'âœ“' : 'âœ—'}
                                    </span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: item.met ? '#bbb' : '#fff' }}>{item.label}</div>
                                        <div style={{ fontSize: 10, color: '#888' }}>{item.current} / {item.target}</div>
                                    </div>
                                    {!item.met && item.action && (
                                        <Link aria-label="Navigation Link" href={item.action} style={{ fontSize: 10, fontWeight: 700, color: '#F1A91B', textDecoration: 'none' }}>Fix â†’</Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>No market data available</div>
                )}
            </div>
        </div>
    );

    return <MobileGate mobile={content} desktop={content} />;
}