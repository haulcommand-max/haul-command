'use client';

import React, { useState, useCallback } from 'react';
import ToolsSidebar from "@/components/tools/ToolsSidebar";
import EmailCaptureWidget from "@/components/monetization/EmailCaptureWidget";

const GRADIENT_BG = 'radial-gradient(ellipse at 15% 20%, rgba(241,169,27,0.06) 0%, transparent 50%), radial-gradient(ellipse at 85% 80%, rgba(16,185,129,0.04) 0%, transparent 50%), #0a0a0f';

const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

interface SimResult {
    permit_complexity_score: number;
    risk_band: string;
    escort_count_estimate: number;
    police_escort_probability: number;
    warnings: string[];
    estimated_cost_range: { min: number; max: number };
}

export default function PermitCheckerPage() {
    const [form, setForm] = useState({ height_in: 168, width_in: 120, weight_lbs: 95000, states_crossed: ['TX', 'OK'] as string[] });
    const [result, setResult] = useState<SimResult | null>(null);
    const [calculating, setCalculating] = useState(false);
    const [selectedStates, setSelectedStates] = useState<string[]>(['TX', 'OK']);

    const toggleState = (st: string) => {
        setForm(p => ({
            ...p,
            states_crossed: p.states_crossed.includes(st)
                ? p.states_crossed.filter(s => s !== st)
                : [...p.states_crossed, st]
        }));
        setSelectedStates(prev => prev.includes(st) ? prev.filter(s => s !== st) : [...prev, st]);
    };

    const calculate = useCallback(() => {
        setCalculating(true);
        setTimeout(() => {
            const j = form.states_crossed.length;
            let score = 0;
            const warnings: string[] = [];
            score += Math.min(30, j * 6);
            if (form.height_in > 162) { score += Math.min(25, (form.height_in - 162) / 6); warnings.push('Height exceeds 13\'6" — escorts required in most states'); }
            if (form.width_in > 102) { score += 10; warnings.push('Width exceeds 8\'6" — escort required'); }
            if (form.width_in > 144) { score += 10; warnings.push('Width exceeds 12\' — dual escorts likely required'); }
            if (form.weight_lbs > 80000) { score += Math.min(15, (form.weight_lbs - 80000) / 10000); warnings.push('Weight exceeds 80,000 lbs — overweight permits needed'); }
            score = Math.min(100, Math.max(0, score));

            const risk_band = score < 30 ? 'low_complexity' : score < 55 ? 'moderate' : score < 75 ? 'complex' : 'high_risk';
            const escort_count_estimate = score < 30 ? 1 : score < 55 ? 1 : score < 75 ? 2 : 3;
            const base_rate = 350;
            const est_min = Math.round(base_rate * escort_count_estimate * 0.88 + j * 75);
            const est_max = Math.round(base_rate * escort_count_estimate * 1.18 + j * 95);

            setResult({
                permit_complexity_score: Math.round(score),
                risk_band,
                escort_count_estimate,
                police_escort_probability: Math.round(Math.min(1, score / 100 * 0.6) * 100) / 100,
                warnings,
                estimated_cost_range: { min: est_min, max: est_max },
            });
            setCalculating(false);
        }, 600);
    }, [form]);

    const riskColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
        low_complexity: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', text: '#10b981', label: 'Low Complexity' },
        moderate: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b', label: 'Moderate' },
        complex: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', text: '#ef4444', label: 'Complex' },
        high_risk: { bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.4)', text: '#dc2626', label: 'High Risk' },
    };

    return (
        <div style={{ minHeight: '100vh', background: GRADIENT_BG, color: '#e5e7eb', fontFamily: "'Inter', system-ui, sans-serif", padding: '2rem 1rem' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(241,169,27,0.08)', border: '1px solid rgba(241,169,27,0.2)', borderRadius: 20, marginBottom: 16 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: 2 }}>Free Tool</span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: 36, fontWeight: 900, color: '#f9fafb', letterSpacing: -1, lineHeight: 1.1 }}>Permit Complexity Checker</h1>
                    <p style={{ margin: '12px auto 0', maxWidth: 500, fontSize: 15, color: '#6b7280', lineHeight: 1.6 }}>
                        Estimate escort requirements, permit complexity, and costs for your oversize load — instantly, for free.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                    {/* Main Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Dimension Inputs */}
                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.5rem' }}>
                            <h2 style={{ margin: '0 0 1.25rem', fontSize: 14, fontWeight: 700, color: '#d1d5db', textTransform: 'uppercase', letterSpacing: 1 }}>Load Dimensions</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                {[
                                    { label: 'Height (inches)', key: 'height_in' as const, val: form.height_in, hint: "Standard: 162\" (13'6\")" },
                                    { label: 'Width (inches)', key: 'width_in' as const, val: form.width_in, hint: "Standard: 102\" (8'6\")" },
                                    { label: 'Weight (lbs)', key: 'weight_lbs' as const, val: form.weight_lbs, hint: "Standard: 80,000 lbs" },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>{f.label}</label>
                                        <input
                                            type="number"
                                            value={f.val}
                                            onChange={e => setForm(p => ({ ...p, [f.key]: parseFloat(e.target.value) || 0 }))}
                                            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.6rem 0.75rem', color: '#f9fafb', fontSize: 16, fontWeight: 700, outline: 'none', boxSizing: 'border-box', fontFamily: 'JetBrains Mono, monospace' }}
                                        />
                                        <div style={{ fontSize: 10, color: '#4b5563', marginTop: 4 }}>{f.hint}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* State Selection */}
                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.5rem' }}>
                            <h2 style={{ margin: '0 0 0.5rem', fontSize: 14, fontWeight: 700, color: '#d1d5db', textTransform: 'uppercase', letterSpacing: 1 }}>States Crossed ({form.states_crossed.length})</h2>
                            <p style={{ margin: '0 0 1rem', fontSize: 12, color: '#6b7280' }}>Tap each state your route crosses through</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {US_STATES.map(st => {
                                    const active = form.states_crossed.includes(st);
                                    return (
                                        <button
                                            key={st}
                                            onClick={() => toggleState(st)}
                                            style={{
                                                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                                                background: active ? 'rgba(241,169,27,0.2)' : 'rgba(255,255,255,0.04)',
                                                border: `1px solid ${active ? 'rgba(241,169,27,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                                color: active ? '#F1A91B' : '#6b7280',
                                                cursor: 'pointer', transition: 'all 0.15s',
                                            }}
                                        >{st}</button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Calculate Button */}
                        <button
                            onClick={calculate}
                            disabled={calculating || form.states_crossed.length === 0}
                            style={{
                                width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none',
                                background: calculating || form.states_crossed.length === 0 ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#F1A91B,#d97706)',
                                color: calculating || form.states_crossed.length === 0 ? '#4b5563' : '#000',
                                fontSize: 15, fontWeight: 800, cursor: calculating ? 'wait' : 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            {calculating ? '⏳ Calculating...' : '🔍 Check Permit Complexity'}
                        </button>

                        {/* Results */}
                        {result && (
                            <div style={{ animation: 'slide-up-fade 0.4s ease-out' }}>
                                {/* Risk Band */}
                                <div style={{
                                    background: riskColors[result.risk_band].bg,
                                    border: `1px solid ${riskColors[result.risk_band].border}`,
                                    borderRadius: 16, padding: '1.5rem', marginBottom: '1rem', textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: 56, fontWeight: 900, color: riskColors[result.risk_band].text, lineHeight: 1 }}>
                                        {result.permit_complexity_score}
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: riskColors[result.risk_band].text, textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 }}>
                                        {riskColors[result.risk_band].label}
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                                    {[
                                        { label: 'Escorts Needed', val: result.escort_count_estimate, color: '#f9fafb' },
                                        { label: 'Police Escort Prob.', val: `${Math.round(result.police_escort_probability * 100)}%`, color: result.police_escort_probability > 0.3 ? '#f59e0b' : '#10b981' },
                                        { label: 'Est. Cost Range', val: `$${result.estimated_cost_range.min.toLocaleString()} - $${result.estimated_cost_range.max.toLocaleString()}`, color: '#F1A91B' },
                                    ].map(item => (
                                        <div key={item.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
                                            <div style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.val}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Warnings */}
                                {result.warnings.length > 0 && (
                                    <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>⚠ Route Warnings</div>
                                        {result.warnings.map((w: string, i: number) => (
                                            <div key={i} style={{ fontSize: 13, color: '#d1d5db', padding: '0.3rem 0', display: 'flex', gap: 8 }}>
                                                <span style={{ color: '#f59e0b' }}>•</span> {w}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* CTA */}
                                <div style={{ background: 'rgba(241,169,27,0.06)', border: '1px solid rgba(241,169,27,0.2)', borderRadius: 16, padding: '1.5rem', textAlign: 'center' }}>
                                    <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#f9fafb' }}>Need Escorts for This Route?</h3>
                                    <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>Post your load on Haul Command and get matched with verified escorts in minutes.</p>
                                    <a href="/onboarding/start?role=broker" style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 28px',
                                        background: 'linear-gradient(135deg,#F1A91B,#d97706)', color: '#000',
                                        fontSize: 13, fontWeight: 800, borderRadius: 10, textDecoration: 'none',
                                    }}>
                                        Post a Load — Free →
                                    </a>
                                </div>

                                {/* Email Capture after results */}
                                <div style={{ marginTop: '1.5rem' }}>
                                    <EmailCaptureWidget
                                        headline="Save this permit analysis"
                                        subheadline="We'll email you this estimate, plus updates if these state regulations change."
                                        context="tool"
                                        geoInterest={selectedStates.join(', ')}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside>
                        <ToolsSidebar currentPath="/tools/permit-checker" />
                    </aside>
                </div>
            </div>
        </div>
    );
}
