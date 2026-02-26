'use client';

import React, { useState, useCallback } from 'react';
import ToolsSidebar from "@/components/tools/ToolsSidebar";

const GRADIENT_BG = 'radial-gradient(ellipse at 20% 30%, rgba(16,185,129,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(241,169,27,0.05) 0%, transparent 50%), #0a0a0f';

// Market rate data by corridor type (representative ranges)
const CORRIDOR_RATES: Record<string, { label: string; p25: number; p50: number; p75: number; avg_miles: number }> = {
    'short_local': { label: 'Short/Local (<50 mi)', p25: 225, p50: 300, p75: 400, avg_miles: 30 },
    'regional': { label: 'Regional (50-150 mi)', p25: 350, p50: 450, p75: 600, avg_miles: 100 },
    'long_haul': { label: 'Long Haul (150-400 mi)', p25: 500, p50: 700, p75: 950, avg_miles: 275 },
    'cross_state': { label: 'Cross-State (400+ mi)', p25: 800, p50: 1100, p75: 1500, avg_miles: 550 },
    'cross_border': { label: 'US ↔ Canada', p25: 900, p50: 1300, p75: 1800, avg_miles: 400 },
};

const SERVICE_TYPES: Record<string, { label: string; multiplier: number }> = {
    'pilot_car': { label: 'Pilot/Escort Car', multiplier: 1.0 },
    'height_pole': { label: 'Height Pole Vehicle', multiplier: 1.15 },
    'police_escort': { label: 'Police Escort', multiplier: 2.2 },
    'route_survey': { label: 'Route Survey', multiplier: 0.85 },
};

export default function RateLookupPage() {
    const [corridor, setCorridor] = useState('regional');
    const [service, setService] = useState('pilot_car');
    const [escorts, setEscorts] = useState(1);
    const [showResult, setShowResult] = useState(false);

    const compute = useCallback(() => { setShowResult(true); }, []);

    const rate = CORRIDOR_RATES[corridor];
    const svc = SERVICE_TYPES[service];
    const p25 = Math.round(rate.p25 * svc.multiplier * escorts);
    const p50 = Math.round(rate.p50 * svc.multiplier * escorts);
    const p75 = Math.round(rate.p75 * svc.multiplier * escorts);
    const perMile50 = (p50 / rate.avg_miles).toFixed(2);

    return (
        <div style={{ minHeight: '100vh', background: GRADIENT_BG, color: '#e5e7eb', fontFamily: "'Inter', system-ui, sans-serif", padding: '2rem 1rem' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, marginBottom: 16 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: 2 }}>Free Tool</span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: 36, fontWeight: 900, color: '#f9fafb', letterSpacing: -1, lineHeight: 1.1 }}>Lane Rate Lookup</h1>
                    <p style={{ margin: '12px auto 0', maxWidth: 500, fontSize: 15, color: '#6b7280', lineHeight: 1.6 }}>
                        See what pilot car services typically cost by corridor type and service. Market intelligence, free.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                    <div>
                        {/* Form */}
                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'grid', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Corridor Type</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                                        {Object.entries(CORRIDOR_RATES).map(([k, v]) => (
                                            <button key={k} onClick={() => setCorridor(k)} style={{
                                                padding: '10px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                                                background: corridor === k ? 'rgba(241,169,27,0.15)' : 'rgba(255,255,255,0.04)',
                                                border: `1px solid ${corridor === k ? 'rgba(241,169,27,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                                color: corridor === k ? '#F1A91B' : '#9ca3af',
                                                cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                                            }}>{v.label}</button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Service Type</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                                        {Object.entries(SERVICE_TYPES).map(([k, v]) => (
                                            <button key={k} onClick={() => setService(k)} style={{
                                                padding: '10px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                                                background: service === k ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                                                border: `1px solid ${service === k ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)'}`,
                                                color: service === k ? '#10b981' : '#9ca3af',
                                                cursor: 'pointer', transition: 'all 0.15s',
                                            }}>{v.label}</button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Number of Escorts</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {[1, 2, 3].map(n => (
                                            <button key={n} onClick={() => setEscorts(n)} style={{
                                                padding: '10px 24px', borderRadius: 10, fontSize: 16, fontWeight: 800,
                                                background: escorts === n ? 'rgba(241,169,27,0.15)' : 'rgba(255,255,255,0.04)',
                                                border: `1px solid ${escorts === n ? 'rgba(241,169,27,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                                color: escorts === n ? '#F1A91B' : '#6b7280',
                                                cursor: 'pointer', transition: 'all 0.15s',
                                            }}>{n}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button onClick={compute} style={{
                            width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none',
                            background: 'linear-gradient(135deg,#10b981,#059669)', color: '#000',
                            fontSize: 15, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', marginBottom: '1.5rem',
                        }}>
                            📊 See Market Rates
                        </button>

                        {showResult && (
                            <div style={{ animation: 'slide-up-fade 0.4s ease-out' }}>
                                {/* Rate Display */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    {[
                                        { label: '25th Percentile', val: `$${p25.toLocaleString()}`, color: '#6b7280', sub: 'Budget' },
                                        { label: 'Market Median', val: `$${p50.toLocaleString()}`, color: '#F1A91B', sub: 'Sweet Spot', highlight: true },
                                        { label: '75th Percentile', val: `$${p75.toLocaleString()}`, color: '#10b981', sub: 'Premium / Urgent' },
                                    ].map(item => (
                                        <div key={item.label} style={{
                                            background: item.highlight ? 'rgba(241,169,27,0.08)' : 'rgba(255,255,255,0.04)',
                                            border: `1px solid ${item.highlight ? 'rgba(241,169,27,0.25)' : 'rgba(255,255,255,0.08)'}`,
                                            borderRadius: 14, padding: '1.25rem', textAlign: 'center',
                                        }}>
                                            <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{item.label}</div>
                                            <div style={{ fontSize: 28, fontWeight: 900, color: item.color, fontFamily: 'JetBrains Mono, monospace' }}>{item.val}</div>
                                            <div style={{ fontSize: 10, color: '#4b5563', marginTop: 4 }}>{item.sub}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Per-mile */}
                                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13, color: '#9ca3af' }}>Estimated per-mile rate (median)</span>
                                    <span style={{ fontSize: 16, fontWeight: 800, color: '#f9fafb', fontFamily: 'JetBrains Mono, monospace' }}>${perMile50}/mi</span>
                                </div>

                                {/* Context */}
                                <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>💡 Market Context</div>
                                    <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>
                                        Rates vary based on: time of year, urban density, permit complexity, day of week (weekend premiums common), and driver availability.
                                        Posting at the median rate typically fills in under 2 hours. Posting at 75th percentile attracts premium, experienced escorts faster.
                                    </div>
                                </div>

                                {/* CTA */}
                                <div style={{ background: 'rgba(241,169,27,0.06)', border: '1px solid rgba(241,169,27,0.2)', borderRadius: 16, padding: '1.5rem', textAlign: 'center' }}>
                                    <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#f9fafb' }}>Ready to Post at the Right Rate?</h3>
                                    <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>Haul Command's intelligence engine adjusts rate recommendations in real-time.</p>
                                    <a href="/onboarding/start?role=broker" style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 28px',
                                        background: 'linear-gradient(135deg,#F1A91B,#d97706)', color: '#000',
                                        fontSize: 13, fontWeight: 800, borderRadius: 10, textDecoration: 'none',
                                    }}>
                                        Post a Load — Free →
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                    <aside><ToolsSidebar currentPath="/tools/rate-lookup" /></aside>
                </div>
            </div>
        </div>
    );
}
