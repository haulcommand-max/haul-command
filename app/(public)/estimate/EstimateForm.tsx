'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { InstantQuote } from '@/lib/quotes/instant-quote-engine';

// ── Design Tokens ──
const T = {
    bg: '#0B0B0C',
    card: '#111114',
    surface: '#161619',
    border: 'rgba(255,255,255,0.06)',
    borderMid: 'rgba(255,255,255,0.10)',
    gold: '#C6923A',
    goldLight: '#E4B872',
    goldDim: 'rgba(198,146,58,0.10)',
    goldBorder: 'rgba(198,146,58,0.25)',
    green: '#22c55e',
    blue: '#3b82f6',
    red: '#ef4444',
    orange: '#f59e0b',
    text: '#F0F0F2',
    muted: '#9CA3AF',
    subtle: '#6B7280',
};

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    background: T.surface, border: `1px solid ${T.borderMid}`,
    color: T.text, fontSize: 14, fontWeight: 500,
    outline: 'none', transition: 'border-color 0.2s',
};

const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: T.subtle,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: 6, display: 'block',
};

export default function EstimateForm() {
    const [loading, setLoading] = useState(false);
    const [quote, setQuote] = useState<InstantQuote | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [widthM, setWidthM] = useState('3.66');
    const [heightM, setHeightM] = useState('4.3');
    const [lengthM, setLengthM] = useState('22');
    const [weightT, setWeightT] = useState('45');
    const [origin, setOrigin] = useState('');
    const [originState, setOriginState] = useState('');
    const [destination, setDestination] = useState('');
    const [destinationState, setDestinationState] = useState('');
    const [originCountry, setOriginCountry] = useState('US');
    const [urgency, setUrgency] = useState<'standard' | 'emergency' | 'planned'>('standard');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/quote/instant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    loadDimensions: {
                        widthM: parseFloat(widthM),
                        heightM: parseFloat(heightM),
                        lengthM: parseFloat(lengthM),
                        weightT: parseFloat(weightT),
                    },
                    origin, originState, originCountry,
                    destination, destinationState,
                    destinationCountry: originCountry,
                    urgency,
                }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setQuote(data as InstantQuote);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to get estimate');
        } finally {
            setLoading(false);
        }
    }

    return (
        <section style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 96px' }}>
            {/* ── Form Card ── */}
            <form onSubmit={handleSubmit} style={{
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 20, padding: 32,
            }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>
                    Load Details
                </h2>

                {/* Dimensions Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
                    <div>
                        <label style={labelStyle}>Width (meters)</label>
                        <input style={inputStyle} type="number" step="0.01" value={widthM}
                            onChange={e => setWidthM(e.target.value)} required />
                    </div>
                    <div>
                        <label style={labelStyle}>Height (meters)</label>
                        <input style={inputStyle} type="number" step="0.01" value={heightM}
                            onChange={e => setHeightM(e.target.value)} required />
                    </div>
                    <div>
                        <label style={labelStyle}>Length (meters)</label>
                        <input style={inputStyle} type="number" step="0.01" value={lengthM}
                            onChange={e => setLengthM(e.target.value)} required />
                    </div>
                    <div>
                        <label style={labelStyle}>Weight (tonnes)</label>
                        <input style={inputStyle} type="number" step="0.1" value={weightT}
                            onChange={e => setWeightT(e.target.value)} required />
                    </div>
                </div>

                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>
                    Route
                </h2>

                {/* Route Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
                    <div>
                        <label style={labelStyle}>Origin City</label>
                        <input style={inputStyle} placeholder="e.g. Houston" value={origin}
                            onChange={e => setOrigin(e.target.value)} required />
                    </div>
                    <div>
                        <label style={labelStyle}>Origin State</label>
                        <input style={inputStyle} placeholder="e.g. TX" value={originState}
                            onChange={e => setOriginState(e.target.value)} />
                    </div>
                    <div>
                        <label style={labelStyle}>Destination City</label>
                        <input style={inputStyle} placeholder="e.g. Denver" value={destination}
                            onChange={e => setDestination(e.target.value)} required />
                    </div>
                    <div>
                        <label style={labelStyle}>Destination State</label>
                        <input style={inputStyle} placeholder="e.g. CO" value={destinationState}
                            onChange={e => setDestinationState(e.target.value)} />
                    </div>
                </div>

                {/* Country + Urgency */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 32 }}>
                    <div>
                        <label style={labelStyle}>Country</label>
                        <select style={{ ...inputStyle, cursor: 'pointer' }} value={originCountry}
                            onChange={e => setOriginCountry(e.target.value)}>
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="AU">Australia</option>
                            <option value="GB">United Kingdom</option>
                            <option value="DE">Germany</option>
                            <option value="FR">France</option>
                            <option value="NZ">New Zealand</option>
                            <option value="ZA">South Africa</option>
                            <option value="BR">Brazil</option>
                            <option value="MX">Mexico</option>
                            <option value="AE">UAE</option>
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Urgency</label>
                        <select style={{ ...inputStyle, cursor: 'pointer' }} value={urgency}
                            onChange={e => setUrgency(e.target.value as typeof urgency)}>
                            <option value="planned">Planned (5+ days)</option>
                            <option value="standard">Standard (2-5 days)</option>
                            <option value="emergency">Emergency (ASAP)</option>
                        </select>
                    </div>
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading} style={{
                    width: '100%', padding: '16px 24px', borderRadius: 12,
                    border: 'none', fontSize: 15, fontWeight: 800,
                    background: loading
                        ? 'rgba(198,146,58,0.3)'
                        : 'linear-gradient(135deg, #C6923A, #E4B872)',
                    color: '#0B0B0C', cursor: loading ? 'not-allowed' : 'pointer',
                    textTransform: 'uppercase' as const, letterSpacing: '0.03em',
                    transition: 'all 0.2s',
                }}>
                    {loading ? 'Calculating…' : '⚡ Get Instant Estimate'}
                </button>

                {error && (
                    <div style={{
                        marginTop: 16, padding: '12px 16px', borderRadius: 10,
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)',
                        color: T.red, fontSize: 13,
                    }}>
                        {error}
                    </div>
                )}
            </form>

            {/* ── Quote Results ── */}
            {quote && (
                <div style={{
                    marginTop: 24, background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 20, padding: 32, position: 'relative', overflow: 'hidden',
                }}>
                    {/* Gold accent top */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                        background: 'linear-gradient(90deg, #C6923A, #E4B872, transparent)',
                    }} />

                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: 24, flexWrap: 'wrap', gap: 12,
                    }}>
                        <h2 style={{ fontSize: 20, fontWeight: 900 }}>Estimate Ready</h2>
                        <span style={{
                            fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 999,
                            background: T.goldDim, border: `1px solid ${T.goldBorder}`,
                            color: T.gold, textTransform: 'uppercase' as const,
                        }}>
                            ID: {quote.quoteId}
                        </span>
                    </div>

                    {/* Pricing Hero */}
                    <div style={{
                        background: T.surface, borderRadius: 14, padding: 24,
                        border: `1px solid ${T.borderMid}`, marginBottom: 20,
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.subtle, textTransform: 'uppercase' as const, marginBottom: 8 }}>
                            Estimated Total Cost
                        </div>
                        <div style={{ fontSize: 36, fontWeight: 900, color: T.gold, marginBottom: 4 }}>
                            {quote.pricing.currency} {quote.pricing.totalLow.toLocaleString()} – {quote.pricing.totalHigh.toLocaleString()}
                        </div>
                        <div style={{ fontSize: 12, color: T.muted }}>
                            {quote.pricing.seasonalNote}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
                        marginBottom: 20,
                    }}>
                        <StatBox label="Escorts Needed" value={`${quote.escortRequirements.minEscortsNeeded}–${quote.escortRequirements.maxEscortsNeeded}`} />
                        <StatBox label="Transit Days" value={`${quote.routeSummary.estimatedTransitDays}`} />
                        <StatBox label="Coverage" value={`${quote.coverage.overallConfidence}%`}
                            color={quote.coverage.overallConfidence >= 70 ? T.green : quote.coverage.overallConfidence >= 50 ? T.orange : T.red} />
                    </div>

                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
                        marginBottom: 20,
                    }}>
                        <StatBox label="Escort Cost" value={`${quote.pricing.currency} ${quote.pricing.escortLow}–${quote.pricing.escortHigh}`} />
                        <StatBox label="Permit Estimate" value={`${quote.pricing.currency} ${quote.pricing.permitEstimate}`} />
                        <StatBox label="Matched Operators" value={`${quote.coverage.matchedOperators}`} />
                    </div>

                    {/* Warnings */}
                    {quote.warnings.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                            {quote.warnings.map((w, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 8,
                                    padding: '10px 14px', borderRadius: 10, marginBottom: 6,
                                    background: 'rgba(245,158,11,0.06)',
                                    border: '1px solid rgba(245,158,11,0.15)',
                                    fontSize: 12, color: T.orange, lineHeight: 1.5,
                                }}>
                                    <span style={{ flexShrink: 0 }}>⚠️</span>
                                    {w}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* CTA Row */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <Link href="/directory" style={{
                            flex: 1, minWidth: 160, padding: '14px 20px', borderRadius: 12,
                            textAlign: 'center', textDecoration: 'none',
                            background: 'linear-gradient(135deg, #C6923A, #E4B872)',
                            color: '#0B0B0C', fontWeight: 800, fontSize: 13,
                            textTransform: 'uppercase' as const,
                        }}>
                            Find Escorts Now →
                        </Link>
                        <Link href="/tools" style={{
                            flex: 1, minWidth: 160, padding: '14px 20px', borderRadius: 12,
                            textAlign: 'center', textDecoration: 'none',
                            background: T.surface, border: `1px solid ${T.borderMid}`,
                            color: T.text, fontWeight: 700, fontSize: 13,
                        }}>
                            More Tools
                        </Link>
                    </div>
                </div>
            )}

            {/* ── Trust Footer ── */}
            <div style={{
                marginTop: 32, textAlign: 'center', padding: '0 24px',
            }}>
                <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 20, fontSize: 12, color: T.subtle }}>
                    <span>✅ Free — no sign-up</span>
                    <span>🔒 Data not stored</span>
                    <span>🌍 120 countries</span>
                    <span>⚡ 30 second results</span>
                </div>
            </div>
        </section>
    );
}

// ── Stat Box ──
function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div style={{
            background: T.surface, borderRadius: 10, padding: '14px 12px',
            border: `1px solid ${T.border}`, textAlign: 'center',
        }}>
            <div style={{
                fontSize: 18, fontWeight: 900,
                color: color || T.text,
                fontVariantNumeric: 'tabular-nums',
            }}>
                {value}
            </div>
            <div style={{
                fontSize: 9, fontWeight: 700, color: T.subtle,
                textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4,
            }}>
                {label}
            </div>
        </div>
    );
}
