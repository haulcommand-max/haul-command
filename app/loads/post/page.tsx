'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface Candidate {
    driver_id: string;
    score: number;
    deadline_miles?: number;
    eta_minutes?: number;
    breakdown?: Record<string, number | string | string[]>;
}

interface MatchResult {
    ok: boolean;
    match_run_id: string;
    lr: number;
    lr_label: string;
    ttf_minutes: number;
    action: 'instant_book' | 'offer_flow' | 'self_heal';
    top: Candidate[];
    candidate_count: { stage_a: number; stage_b: number };
}

const URGENCY_OPTIONS = ['normal', 'soon', 'now'] as const;
const URGENCY_LABELS = { normal: 'Standard', soon: 'Urgent (2–4h)', now: 'Emergency (now)' };
const LR_COLOR = (lr: number) =>
    lr >= 3 ? '#22c55e' : lr >= 1.5 ? '#86efac' : lr >= 0.8 ? '#fbbf24' : '#f87171';

export default function PostLoadPage() {
    const supabase = createClient();
    const router = useRouter();

    const [form, setForm] = useState({
        origin_lat: '', origin_lng: '', dest_lat: '', dest_lng: '',
        pickup_start: '', pickup_end: '',
        load_height: '', load_width: '', load_length: '', load_weight: '',
        urgency: 'normal' as typeof URGENCY_OPTIONS[number],
        base_rate: '',
        escort_lead: '1', escort_chase: '0',
        requires_police: false,
    });
    const [loadId, setLoadId] = useState<string | null>(null);
    const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [offersSent, setOffersSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }));

    async function handlePost() {
        setLoading(true); setError(null); setMatchResult(null);
        const t0 = performance.now();

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        // 1. Insert load
        const { data: loadData, error: loadErr } = await supabase.from('loads').insert({
            origin_lat: parseFloat(form.origin_lat), origin_lng: parseFloat(form.origin_lng),
            dest_lat: parseFloat(form.dest_lat), dest_lng: parseFloat(form.dest_lng),
            pickup_start: form.pickup_start || null, pickup_end: form.pickup_end || null,
            load_height: parseFloat(form.load_height) || null,
            load_width: parseFloat(form.load_width) || null,
            load_length: parseFloat(form.load_length) || null,
            load_weight: parseFloat(form.load_weight) || null,
            urgency: form.urgency,
            base_rate: parseFloat(form.base_rate) || null,
            status: 'open',
            escort_class_required: {
                lead: parseInt(form.escort_lead), chase: parseInt(form.escort_chase),
                police: form.requires_police,
            },
        }).select('id').single();

        if (loadErr || !loadData) { setError(loadErr?.message ?? 'Failed to create load'); setLoading(false); return; }
        setLoadId(loadData.id);

        // 2. Run match engine immediately
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const res = await fetch(`${SUPABASE_URL}/functions/v1/match-engine`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ load_id: loadData.id, step: 0, mode: 'strict' }),
        });

        const elapsed = Math.round(performance.now() - t0);
        if (res.ok) {
            const data: MatchResult = await res.json();
            setMatchResult({ ...data, _elapsed: elapsed } as any);
        } else {
            setError('Match engine error — load posted, check offers page.');
        }
        setLoading(false);
    }

    async function handleInstantBook() {
        if (!matchResult?.match_run_id || !loadId) return;
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        await fetch(`${SUPABASE_URL}/functions/v1/offer-dispatch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
            body: JSON.stringify({ load_id: loadId, match_run_id: matchResult.match_run_id, K: 5 }),
        });
        setOffersSent(true);
        setLoading(false);
    }

    async function handleSelfHeal() {
        if (!loadId) return;
        const { data: { session } } = await supabase.auth.getSession();
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        await fetch(`${SUPABASE_URL}/functions/v1/self-heal-fallback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
            body: JSON.stringify({ load_id: loadId, current_step: 0 }),
        });
        router.push(`/loads/${loadId}/self-heal`);
    }

    const lrColor = matchResult ? LR_COLOR(matchResult.lr) : '#94a3b8';

    return (
        <div style={{ minHeight: '100vh', background: '#0a0f1e', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <div style={{ borderBottom: '1px solid #1e293b', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚛</div>
                <div>
                    <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>Post a Load</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Instant match preview in &lt;5 seconds</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: matchResult ? '1fr 420px' : '1fr', gap: 24, padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
                {/* Form */}
                <div>
                    {/* Route */}
                    <Section title="📍 Route">
                        <Row>
                            <Field label="Origin Lat" value={form.origin_lat} onChange={v => set('origin_lat', v)} placeholder="28.5383" />
                            <Field label="Origin Lng" value={form.origin_lng} onChange={v => set('origin_lng', v)} placeholder="-81.3792" />
                        </Row>
                        <Row>
                            <Field label="Dest Lat" value={form.dest_lat} onChange={v => set('dest_lat', v)} placeholder="33.4484" />
                            <Field label="Dest Lng" value={form.dest_lng} onChange={v => set('dest_lng', v)} placeholder="-112.0740" />
                        </Row>
                        <Row>
                            <Field label="Pickup Start" value={form.pickup_start} onChange={v => set('pickup_start', v)} type="datetime-local" />
                            <Field label="Pickup End" value={form.pickup_end} onChange={v => set('pickup_end', v)} type="datetime-local" />
                        </Row>
                    </Section>

                    {/* Load Dimensions */}
                    <Section title="📐 Load Dimensions">
                        <Row>
                            <Field label="Height (ft)" value={form.load_height} onChange={v => set('load_height', v)} placeholder="16.5" />
                            <Field label="Width (ft)" value={form.load_width} onChange={v => set('load_width', v)} placeholder="14.0" />
                            <Field label="Length (ft)" value={form.load_length} onChange={v => set('load_length', v)} placeholder="120" />
                            <Field label="Weight (lbs)" value={form.load_weight} onChange={v => set('load_weight', v)} placeholder="80000" />
                        </Row>
                    </Section>

                    {/* Escort Requirements */}
                    <Section title="🚗 Escort Requirements">
                        <Row>
                            <Field label="Lead Escorts" value={form.escort_lead} onChange={v => set('escort_lead', v)} placeholder="1" />
                            <Field label="Chase Escorts" value={form.escort_chase} onChange={v => set('escort_chase', v)} placeholder="0" />
                            <Field label="Base Rate ($)" value={form.base_rate} onChange={v => set('base_rate', v)} placeholder="600" />
                        </Row>
                        <div style={{ marginTop: 12 }}>
                            <label style={labelStyle}>Police Escort Required</label>
                            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                {[true, false].map(v => (
                                    <button key={String(v)} onClick={() => set('requires_police', v)}
                                        style={{ ...pillStyle, background: form.requires_police === v ? '#f97316' : '#1e293b', color: form.requires_police === v ? '#fff' : '#94a3b8' }}>
                                        {v ? 'Yes' : 'No'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Section>

                    {/* Urgency */}
                    <Section title="⚡ Urgency">
                        <div style={{ display: 'flex', gap: 10 }}>
                            {URGENCY_OPTIONS.map(u => (
                                <button key={u} onClick={() => set('urgency', u)}
                                    style={{
                                        ...pillStyle, flex: 1, padding: '10px 0',
                                        background: form.urgency === u
                                            ? u === 'now' ? '#ef4444' : u === 'soon' ? '#f97316' : '#3b82f6'
                                            : '#1e293b',
                                        color: form.urgency === u ? '#fff' : '#94a3b8',
                                        border: `1px solid ${form.urgency === u ? 'transparent' : '#334155'}`
                                    }}>
                                    {URGENCY_LABELS[u]}
                                </button>
                            ))}
                        </div>
                    </Section>

                    {error && <div style={{ color: '#f87171', padding: '12px 16px', background: '#1e0a0a', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

                    <button onClick={handlePost} disabled={loading || !form.origin_lat || !form.dest_lat}
                        style={{
                            width: '100%', padding: '16px 0', borderRadius: 10, border: 'none', cursor: loading ? 'wait' : 'pointer',
                            background: loading ? '#334155' : 'linear-gradient(135deg, #f97316, #ea580c)',
                            color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: 0.3,
                            transition: 'all 0.2s', opacity: !form.origin_lat || !form.dest_lat ? 0.5 : 1
                        }}>
                        {loading ? '⚡ Finding Escorts...' : '🚀 Post Load & Match Instantly'}
                    </button>
                </div>

                {/* Match Results Panel */}
                {matchResult && (
                    <div style={{ position: 'sticky', top: 24 }}>
                        {/* LR / TTF Banner */}
                        <div style={{ background: '#0f172a', border: `1px solid ${lrColor}33`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>MARKET COVERAGE</span>
                                <span style={{ fontSize: 11, color: '#475569' }}>⚡ {(matchResult as any)._elapsed}ms</span>
                            </div>
                            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                                <Stat label="Liquidity Ratio" value={matchResult.lr.toFixed(2)} color={lrColor} />
                                <Stat label="Est. Fill Time" value={`${Math.round(matchResult.ttf_minutes)}m`} color="#94a3b8" />
                                <Stat label="Candidates" value={String(matchResult.candidate_count.stage_b)} color="#94a3b8" />
                            </div>
                            <div style={{ padding: '8px 12px', borderRadius: 7, background: `${lrColor}18`, color: lrColor, fontSize: 13, fontWeight: 600 }}>
                                {matchResult.lr_label}
                            </div>
                        </div>

                        {/* Action Button */}
                        {!offersSent ? (
                            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                                {matchResult.action === 'instant_book' || matchResult.action === 'offer_flow' ? (
                                    <button onClick={handleInstantBook} disabled={loading}
                                        style={{
                                            flex: 1, padding: '13px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
                                            background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', fontWeight: 700, fontSize: 14
                                        }}>
                                        {matchResult.action === 'instant_book' ? '⚡ Instant Book' : '📡 Send Offers'}
                                    </button>
                                ) : null}
                                {matchResult.action === 'self_heal' && (
                                    <button onClick={handleSelfHeal}
                                        style={{
                                            flex: 1, padding: '13px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
                                            background: 'linear-gradient(135deg, #f97316, #dc2626)', color: '#fff', fontWeight: 700, fontSize: 14
                                        }}>
                                        🔁 Activate Self-Heal
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div style={{ padding: '12px 16px', borderRadius: 9, background: '#052e16', color: '#22c55e', fontWeight: 600, marginBottom: 16, textAlign: 'center' }}>
                                ✅ Offers sent to top {Math.min(matchResult.candidate_count.stage_b, 5)} escorts
                            </div>
                        )}

                        {/* Top Candidates */}
                        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, overflow: 'hidden' }}>
                            <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e293b', fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
                                TOP MATCHED ESCORTS
                            </div>
                            {matchResult.top.slice(0, 8).map((c, i) => (
                                <div key={c.driver_id} style={{
                                    padding: '12px 16px', borderBottom: '1px solid #0f172a',
                                    background: i === 0 ? '#0d2018' : i % 2 === 0 ? '#080d18' : '#0c111f',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: '50%',
                                            background: i === 0 ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#1e293b',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 11, fontWeight: 700, color: i === 0 ? '#fff' : '#64748b'
                                        }}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 600 }}>{c.driver_id.slice(0, 8)}…</div>
                                            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                                                {c.deadline_miles != null ? `${Math.round(c.deadline_miles)}mi` : '—'} · {c.eta_minutes != null ? `ETA ${c.eta_minutes}m` : '—'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: c.score >= 80 ? '#22c55e' : c.score >= 60 ? '#fbbf24' : '#f87171' }}>
                                            {c.score.toFixed(0)}
                                        </div>
                                        <div style={{ fontSize: 10, color: '#475569' }}>score</div>
                                    </div>
                                </div>
                            ))}
                            {matchResult.top.length === 0 && (
                                <div style={{ padding: 24, textAlign: 'center', color: '#475569', fontSize: 13 }}>
                                    No eligible escorts in range — activate self-heal to expand search
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Sub-components ────────────────────────────────────────
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 };
const pillStyle: React.CSSProperties = { borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.15s' };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 14, letterSpacing: 0.3 }}>{title}</div>
            {children}
        </div>
    );
}

function Row({ children }: { children: React.ReactNode }) {
    return <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>{children}</div>;
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
    return (
        <div style={{ flex: 1 }}>
            <label style={labelStyle}>{label}</label>
            <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
                style={{
                    width: '100%', marginTop: 6, padding: '9px 12px', borderRadius: 7,
                    border: '1px solid #334155', background: '#0a0f1e', color: '#e2e8f0',
                    fontSize: 13, outline: 'none', boxSizing: 'border-box'
                }} />
        </div>
    );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
        </div>
    );
}
