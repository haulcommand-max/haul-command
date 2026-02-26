'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ToolsSidebar from "@/components/tools/ToolsSidebar";

// Free Tool #3 — Route Complexity Calculator
const US_STATES = ['AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

function calcComplexity(states: string[], loadWidth: number, loadHeight: number, loadWeight: number, hasUrban: boolean, hasNight: boolean) {
    let score = 0, factors: string[] = [];
    // States crossed
    if (states.length >= 4) { score += 25; factors.push(`${states.length} states = complex permitting`); }
    else if (states.length >= 2) { score += 12; factors.push(`${states.length} states crossed`); }
    // Width
    if (loadWidth >= 16) { score += 30; factors.push('Superload width (16\'+ wide)'); }
    else if (loadWidth >= 14) { score += 20; factors.push('Wide load (14\'+ wide, double escort likely)'); }
    else if (loadWidth >= 12) { score += 10; factors.push('Oversize width (12\'+ wide)'); }
    // Height
    if (loadHeight >= 16) { score += 25; factors.push('Extreme height — utility crew likely'); }
    else if (loadHeight >= 14) { score += 15; factors.push('High load — height pole critical'); }
    // Weight
    if (loadWeight >= 200000) { score += 20; factors.push('Superload weight — bridge analysis required'); }
    else if (loadWeight >= 100000) { score += 10; factors.push('Heavy load — route restrictions likely'); }
    // Modifiers
    if (hasUrban) { score += 10; factors.push('Urban segments increase complexity'); }
    if (hasNight) { score += 5; factors.push('Night moves may be restricted'); }

    const escortCount = loadWidth >= 16 ? 3 : loadWidth >= 14 ? 2 : loadWidth >= 10 ? 1 : 0;
    const policeProb = score >= 50 ? 'High' : score >= 30 ? 'Moderate' : 'Low';
    const permitDays = states.length * (score >= 50 ? 5 : score >= 30 ? 3 : 2);
    const risk = score >= 60 ? 'Critical' : score >= 40 ? 'High' : score >= 20 ? 'Moderate' : 'Low';
    return { score: Math.min(score, 100), factors, escortCount, policeProb, permitDays, risk };
}

export default function RouteComplexityCalculator() {
    const [selectedStates, setSelectedStates] = useState<string[]>([]);
    const [width, setWidth] = useState(12);
    const [height, setHeight] = useState(14);
    const [weight, setWeight] = useState(80000);
    const [hasUrban, setHasUrban] = useState(false);
    const [hasNight, setHasNight] = useState(false);
    const [result, setResult] = useState<ReturnType<typeof calcComplexity> | null>(null);

    const toggleState = (s: string) => setSelectedStates(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    const run = () => setResult(calcComplexity(selectedStates, width, height, weight, hasUrban, hasNight));

    const riskColor: Record<string, string> = { Low: '#10b981', Moderate: '#f59e0b', High: '#ef4444', Critical: '#dc2626' };

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '2rem 1rem' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                <header style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'inline-flex', gap: 6, padding: '4px 14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, marginBottom: 12 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: 2 }}>🗺️ Free Tool</span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#f9fafb' }}>Route Complexity Calculator</h1>
                    <p style={{ margin: '8px 0 0', fontSize: 13, color: '#6b7280' }}>Estimate escort needs, permit timelines, and risk before you dispatch.</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                    <div>
                        {/* Input Form */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem', marginBottom: 16 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>States Crossed (click to select)</label>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
                                {US_STATES.map(s => (
                                    <button key={s} onClick={() => toggleState(s)} style={{
                                        padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                                        background: selectedStates.includes(s) ? 'rgba(241,169,27,0.2)' : 'rgba(255,255,255,0.04)',
                                        border: `1px solid ${selectedStates.includes(s) ? 'rgba(241,169,27,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                        color: selectedStates.includes(s) ? '#F1A91B' : '#6b7280',
                                    }}>{s}</button>
                                ))}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                                {[
                                    { label: 'Width (ft)', val: width, set: setWidth, min: 8, max: 30, step: 1 },
                                    { label: 'Height (ft)', val: height, set: setHeight, min: 10, max: 22, step: 0.5 },
                                    { label: 'Weight (lbs)', val: weight, set: setWeight, min: 40000, max: 500000, step: 10000 },
                                ].map(f => (
                                    <div key={f.label}>
                                        <label style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{f.label}</label>
                                        <input type="number" value={f.val} onChange={e => f.set(Number(e.target.value))} min={f.min} max={f.max} step={f.step} style={{ width: '100%', padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f9fafb', fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', boxSizing: 'border-box' }} />
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                {[
                                    { label: 'Urban segments', val: hasUrban, set: setHasUrban },
                                    { label: 'Night moves needed', val: hasNight, set: setHasNight },
                                ].map(c => (
                                    <label key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9ca3af', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={c.val} onChange={e => c.set(e.target.checked)} style={{ accentColor: '#F1A91B' }} /> {c.label}
                                    </label>
                                ))}
                            </div>

                            <button onClick={run} disabled={selectedStates.length === 0} style={{
                                width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                                background: selectedStates.length > 0 ? 'linear-gradient(135deg,#F1A91B,#d97706)' : 'rgba(255,255,255,0.06)',
                                color: selectedStates.length > 0 ? '#000' : '#4b5563',
                                fontSize: 14, fontWeight: 800, cursor: selectedStates.length > 0 ? 'pointer' : 'not-allowed',
                            }}>Calculate Route Complexity</button>
                        </div>

                        {/* Results */}
                        {result && (
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem', animation: 'slide-up-fade 0.3s ease-out' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                                    <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
                                        <div style={{ fontSize: 28, fontWeight: 900, color: riskColor[result.risk], fontFamily: 'JetBrains Mono' }}>{result.score}</div>
                                        <div style={{ fontSize: 8, color: '#6b7280', textTransform: 'uppercase' }}>Complexity</div>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
                                        <div style={{ fontSize: 28, fontWeight: 900, color: '#F1A91B', fontFamily: 'JetBrains Mono' }}>{result.escortCount}</div>
                                        <div style={{ fontSize: 8, color: '#6b7280', textTransform: 'uppercase' }}>Escorts</div>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
                                        <div style={{ fontSize: 28, fontWeight: 900, color: '#3b82f6', fontFamily: 'JetBrains Mono' }}>{result.permitDays}d</div>
                                        <div style={{ fontSize: 8, color: '#6b7280', textTransform: 'uppercase' }}>Permit Lead</div>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
                                        <div style={{ fontSize: 14, fontWeight: 900, color: riskColor[result.risk] }}>{result.risk}</div>
                                        <div style={{ fontSize: 8, color: '#6b7280', textTransform: 'uppercase' }}>Risk Level</div>
                                    </div>
                                </div>

                                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 }}>Factors</div>
                                {result.factors.map((f, i) => (
                                    <div key={i} style={{ fontSize: 12, color: '#d1d5db', padding: '4px 0', borderBottom: i < result.factors.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>→ {f}</div>
                                ))}

                                <div style={{ marginTop: 20, textAlign: 'center' }}>
                                    <Link href="/loads/post" style={{ display: 'inline-flex', padding: '10px 28px', background: 'linear-gradient(135deg,#F1A91B,#d97706)', color: '#000', fontSize: 13, fontWeight: 800, borderRadius: 10, textDecoration: 'none' }}>Post This Load →</Link>
                                </div>
                            </div>
                        )}
                    </div>
                    <aside><ToolsSidebar currentPath="/tools/route-complexity" /></aside>
                </div>
            </div>
        </div>
    );
}
