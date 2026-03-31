"use client";

import { useEffect, useState } from "react";
import { calculateRange, PricingBenchmark } from "@/lib/pricing";

/**
 * /quote — Smart Quote Calculator (brand-upgraded)
 * Mobile-first design matching HC design language.
 */
export default function QuoteWizard() {
    const [services, setServices] = useState<any[]>([]);
    const [benchmarks, setBenchmarks] = useState<PricingBenchmark[]>([]);
    const [regions, setRegions] = useState<any[]>([]);
    const [form, setForm] = useState({ service_key: "", region_key: "", miles: 0, days: 1, addons: [] as string[] });
    const [quote, setQuote] = useState<any>(null);

    useEffect(() => {
        fetch("/api/public/services").then(r => r.json()).then(data => {
            setServices(data || []);
            const allBenchmarks = (data || []).flatMap((s: any) => s.pricing_benchmarks || []);
            setBenchmarks(allBenchmarks);
            const regionSet = new Map<string, string>();
            for (const b of allBenchmarks) {
                if (b.region_key && !regionSet.has(b.region_key)) {
                    regionSet.set(b.region_key, b.region_key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()));
                }
            }
            regionSet.set('all', 'National');
            setRegions(Array.from(regionSet.entries()).map(([key, label]) => ({ key, label })));
        });
    }, []);

    const handleCalculate = () => {
        const result = calculateRange(form, benchmarks);
        setQuote(result);
    };

    const S = {
        bg: '#050508',
        surface: 'rgba(255,255,255,0.03)',
        border: 'rgba(255,255,255,0.08)',
        gold: '#F1A91B',
        text: '#f9fafb',
        muted: '#6b7280',
        input: { width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#f9fafb', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
    };

    return (
        <div style={{ minHeight: '100dvh', background: S.bg, color: S.text, fontFamily: "var(--font-inter, 'Inter', system-ui, sans-serif)", padding: '2rem 1rem' }}>
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', color: S.gold, marginBottom: 8 }}>HAUL COMMAND</div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Smart Quote Calculator</h1>
                    <p style={{ fontSize: 13, color: S.muted, marginTop: 6 }}>Get fair-market pricing powered by real corridor intelligence.</p>
                </div>

                {/* Form */}
                <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 16, padding: '1.5rem', display: 'grid', gap: 16 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Service Type</label>
                        <select style={{ ...S.input, boxSizing: 'border-box' } as any} onChange={e => setForm({ ...form, service_key: e.target.value })}>
                            <option value="">Select...</option>
                            {services.filter(s => s.category === 'service').map(s => <option key={s.service_key} value={s.service_key}>{s.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Region</label>
                        <select style={{ ...S.input, boxSizing: 'border-box' } as any} onChange={e => setForm({ ...form, region_key: e.target.value })}>
                            <option value="">Select...</option>
                            {regions.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Total Miles</label>
                            <input type="number" style={S.input as any} value={form.miles} onChange={e => setForm({ ...form, miles: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Est. Days</label>
                            <input type="number" style={S.input as any} value={form.days} onChange={e => setForm({ ...form, days: Number(e.target.value) })} />
                        </div>
                    </div>

                    {services.filter(s => s.category === 'addon').length > 0 && (
                        <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Add-ons</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {services.filter(s => s.category === 'addon').map(s => {
                                    const active = form.addons.includes(s.service_key);
                                    return (
                                        <button aria-label="Interactive Button" key={s.service_key} type="button" onClick={() => {
                                            if (active) setForm({ ...form, addons: form.addons.filter(x => x !== s.service_key) });
                                            else setForm({ ...form, addons: [...form.addons, s.service_key] });
                                        }} style={{
                                            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                            background: active ? 'rgba(241,169,27,0.15)' : 'rgba(255,255,255,0.04)',
                                            border: `1px solid ${active ? 'rgba(241,169,27,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                            color: active ? S.gold : '#999', transition: 'all 0.15s',
                                        }}>
                                            {s.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <button aria-label="Interactive Button" onClick={handleCalculate} style={{
                        width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                        color: '#030712', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                        transition: 'all 0.15s',
                    }}>
                        Calculate Fair Range
                    </button>
                </div>

                {/* Result */}
                {quote && (
                    <div style={{
                        marginTop: '1.5rem', background: 'rgba(241,169,27,0.05)',
                        border: '1px solid rgba(241,169,27,0.2)', borderRadius: 16, padding: '1.5rem',
                    }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: S.gold, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Recommended Range</div>
                        <div style={{ fontSize: 32, fontWeight: 900, color: S.text, marginTop: 6 }}>
                            ${quote.min.toFixed(0)} — ${quote.max.toFixed(0)}
                        </div>
                        <div style={{ fontSize: 12, color: S.muted, marginTop: 4 }}>Based on market data for {form.miles} miles</div>

                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {quote.lineItems.map((l: any, i: number) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between', fontSize: 13,
                                    padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                                }}>
                                    <span style={{ color: '#d1d5db' }}>{l.label}</span>
                                    <span style={{ color: S.gold, fontWeight: 700 }}>${l.min.toFixed(0)}–${l.max.toFixed(0)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
