'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

// ── Types ──────────────────────────────────────────────────────────────────────

interface MatchCard {
    type: 'sure_thing' | 'best_value' | 'speedster';
    label: string;
    tagline: string;
    operator_id: string;
    operator_name: string;
    trust_score: number;
    response_min: number | null;
    rate_per_mile: number | null;
    corridor_match_count: number;
    composite_score: number;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string[];
}

interface MatchResponse {
    matches: MatchCard[];
    candidate_pool_size: number;
    generated_at: string;
}

interface WaveResponse {
    ok: boolean;
    offers_created: number;
    wave: number;
    wave_size: number;
    expires_at: string;
    ttl_seconds: number;
    candidates_considered: number;
}

const URGENCY_OPTIONS = ['normal', 'soon', 'now'] as const;
const URGENCY_LABELS: Record<string, string> = { normal: 'Standard', soon: 'Urgent (2–4 hr)', now: 'Emergency' };
const URGENCY_ICONS: Record<string, string> = { normal: '📋', soon: '⚡', now: '🚨' };

const LOAD_TYPES = [
    { id: 'oversized', label: 'Oversized / Wide Load', icon: '🚛' },
    { id: 'superload', label: 'Superload', icon: '🏗️' },
    { id: 'high_pole', label: 'High Pole Required', icon: '📡' },
    { id: 'standard', label: 'Standard Escort', icon: '🚗' },
] as const;

// ── Page Component ─────────────────────────────────────────────────────────────

export default function PostLoadPage() {
    const supabase = createClient();
    const router = useRouter();

    // ── Form State ─────────────────────────────────────────────────────────
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [form, setForm] = useState({
        origin_address: '',
        origin_city: '',
        origin_state: '',
        origin_lat: '',
        origin_lng: '',
        dest_address: '',
        dest_city: '',
        dest_state: '',
        dest_lat: '',
        dest_lng: '',
        pickup_start: '',
        pickup_end: '',
        load_height: '',
        load_width: '',
        load_length: '',
        load_weight: '',
        load_type: 'oversized' as string,
        urgency: 'normal' as typeof URGENCY_OPTIONS[number],
        base_rate: '',
        escort_lead: '1',
        escort_chase: '0',
        requires_police: false,
        requires_high_pole: false,
        special_notes: '',
    });

    const [loadId, setLoadId] = useState<string | null>(null);
    const [matchResult, setMatchResult] = useState<MatchResponse | null>(null);
    const [waveResult, setWaveResult] = useState<WaveResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [matchLoading, setMatchLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const [offersSent, setOffersSent] = useState(false);
    const [elapsed, setElapsed] = useState(0);

    const set = useCallback((k: keyof typeof form, v: unknown) =>
        setForm(f => ({ ...f, [k]: v })), []);

    // ── Step 1 → 2: Insert load + run match-generate ───────────────────────

    async function handlePostLoad() {
        setLoading(true);
        setError(null);
        setMatchResult(null);
        setWaveResult(null);
        setOffersSent(false);
        const t0 = performance.now();

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { setError('Please sign in to post a load.'); setLoading(false); return; }

            // 1. Insert load into Supabase
            const payload: Record<string, unknown> = {
                origin_lat: parseFloat(form.origin_lat) || null,
                origin_lng: parseFloat(form.origin_lng) || null,
                origin_city: form.origin_city || null,
                origin_state: form.origin_state || null,
                dest_lat: parseFloat(form.dest_lat) || null,
                dest_lng: parseFloat(form.dest_lng) || null,
                dest_city: form.dest_city || null,
                dest_state: form.dest_state || null,
                pickup_start: form.pickup_start || null,
                pickup_end: form.pickup_end || null,
                load_height: parseFloat(form.load_height) || null,
                load_width: parseFloat(form.load_width) || null,
                load_length: parseFloat(form.load_length) || null,
                load_weight: parseFloat(form.load_weight) || null,
                load_type: form.load_type,
                urgency: form.urgency,
                base_rate: parseFloat(form.base_rate) || null,
                status: 'open',
                escort_class_required: {
                    lead: parseInt(form.escort_lead),
                    chase: parseInt(form.escort_chase),
                    police: form.requires_police,
                    high_pole: form.requires_high_pole,
                },
                special_notes: form.special_notes || null,
                broker_id: session.user.id,
            };

            const { data: loadData, error: loadErr } = await supabase
                .from('loads')
                .insert(payload)
                .select('id')
                .single();

            if (loadErr || !loadData) {
                setError(loadErr?.message ?? 'Failed to create load.');
                setLoading(false);
                return;
            }

            setLoadId(loadData.id);

            // 2. Call match-generate API for Top 3 cards
            setMatchLoading(true);
            const matchRes = await fetch('/api/loads/match-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    load_id: loadData.id,
                    origin_state: form.origin_state,
                    dest_state: form.dest_state,
                    budget_max: parseFloat(form.base_rate) || undefined,
                    load_type: form.load_type,
                }),
            });

            const dt = Math.round(performance.now() - t0);
            setElapsed(dt);

            if (matchRes.ok) {
                const data: MatchResponse = await matchRes.json();
                setMatchResult(data);
                setStep(2);
            } else {
                setError('Match engine returned an error — load was posted successfully. Check your offers page.');
                setStep(2);
            }
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
            setMatchLoading(false);
        }
    }

    // ── Step 2 → 3: Dispatch offers via match-generate edge function ───────

    async function handleDispatchOffers() {
        if (!loadId) return;
        setLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

            const res = await fetch(`${SUPABASE_URL}/functions/v1/match-generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ load_id: loadId, wave: 1 }),
            });

            if (res.ok) {
                const data: WaveResponse = await res.json();
                setWaveResult(data);
                setOffersSent(true);
                setStep(3);
            } else {
                const errBody = await res.json().catch(() => ({}));
                setError(errBody?.error ?? 'Failed to dispatch offers.');
            }
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
        }
    }

    // ── Card Styling ───────────────────────────────────────────────────────

    const CARD_CONFIG: Record<string, { gradient: string; icon: string; border: string; glow: string }> = {
        sure_thing: {
            gradient: 'linear-gradient(135deg, #059669, #047857)',
            icon: '🛡️',
            border: '#10b981',
            glow: 'rgba(16, 185, 129, 0.15)',
        },
        best_value: {
            gradient: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            icon: '💎',
            border: '#3b82f6',
            glow: 'rgba(59, 130, 246, 0.15)',
        },
        speedster: {
            gradient: 'linear-gradient(135deg, #d97706, #b45309)',
            icon: '⚡',
            border: '#f59e0b',
            glow: 'rgba(245, 158, 11, 0.15)',
        },
    };

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <div style={{ minHeight: '100vh', background: '#030712', color: '#e2e8f0', fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* ── Header ── */}
            <div style={{
                borderBottom: '1px solid #1e293b',
                padding: '20px 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(3, 7, 18, 0.8)',
                backdropFilter: 'blur(12px)',
                position: 'sticky',
                top: 0,
                zIndex: 50,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: 'linear-gradient(135deg, #f97316, #ea580c)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
                    }}>🚛</div>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>Post a Load</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Instant match preview → Top 3 → Dispatch in seconds</div>
                    </div>
                </div>

                {/* Stepper */}
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[1, 2, 3].map(s => (
                        <React.Fragment key={s}>
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 13, fontWeight: 800,
                                background: step >= s ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#1e293b',
                                color: step >= s ? '#fff' : '#475569',
                                transition: 'all 0.3s',
                            }}>{s}</div>
                            {s < 3 && <div style={{ width: 28, height: 2, background: step > s ? '#f97316' : '#1e293b', borderRadius: 1, transition: 'all 0.3s' }} />}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>

                {/* ════════════════════════════════════════════════════════════════
                    STEP 1: Load Details Form
                   ════════════════════════════════════════════════════════════════ */}
                {step === 1 && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                            {/* Left Column */}
                            <div>
                                {/* Origin */}
                                <Section title="📍 Origin" subtitle="Where is the load picking up?">
                                    <Field label="City" value={form.origin_city} onChange={v => set('origin_city', v)} placeholder="Orlando" />
                                    <Row>
                                        <Field label="State" value={form.origin_state} onChange={v => set('origin_state', v)} placeholder="FL" />
                                        <Field label="Latitude" value={form.origin_lat} onChange={v => set('origin_lat', v)} placeholder="28.5383" />
                                        <Field label="Longitude" value={form.origin_lng} onChange={v => set('origin_lng', v)} placeholder="-81.3792" />
                                    </Row>
                                </Section>

                                {/* Destination */}
                                <Section title="📍 Destination" subtitle="Where is the load heading?">
                                    <Field label="City" value={form.dest_city} onChange={v => set('dest_city', v)} placeholder="Phoenix" />
                                    <Row>
                                        <Field label="State" value={form.dest_state} onChange={v => set('dest_state', v)} placeholder="AZ" />
                                        <Field label="Latitude" value={form.dest_lat} onChange={v => set('dest_lat', v)} placeholder="33.4484" />
                                        <Field label="Longitude" value={form.dest_lng} onChange={v => set('dest_lng', v)} placeholder="-112.0740" />
                                    </Row>
                                </Section>

                                {/* Pickup Window */}
                                <Section title="🕐 Pickup Window">
                                    <Row>
                                        <Field label="Earliest Pickup" value={form.pickup_start} onChange={v => set('pickup_start', v)} type="datetime-local" />
                                        <Field label="Latest Pickup" value={form.pickup_end} onChange={v => set('pickup_end', v)} type="datetime-local" />
                                    </Row>
                                </Section>
                            </div>

                            {/* Right Column */}
                            <div>
                                {/* Load Type */}
                                <Section title="🏷️ Load Type">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        {LOAD_TYPES.map(lt => (
                                            <button key={lt.id} onClick={() => set('load_type', lt.id)}
                                                style={{
                                                    padding: '12px 14px', borderRadius: 10,
                                                    border: `1.5px solid ${form.load_type === lt.id ? '#f97316' : '#1e293b'}`,
                                                    background: form.load_type === lt.id ? 'rgba(249,115,22,0.08)' : '#0f172a',
                                                    color: form.load_type === lt.id ? '#fb923c' : '#94a3b8',
                                                    cursor: 'pointer', textAlign: 'left',
                                                    transition: 'all 0.2s', display: 'flex', gap: 8, alignItems: 'center',
                                                    fontWeight: form.load_type === lt.id ? 700 : 500, fontSize: 13,
                                                }}>
                                                <span style={{ fontSize: 18 }}>{lt.icon}</span>{lt.label}
                                            </button>
                                        ))}
                                    </div>
                                </Section>

                                {/* Dimensions */}
                                <Section title="📐 Load Dimensions">
                                    <Row>
                                        <Field label="Height (ft)" value={form.load_height} onChange={v => set('load_height', v)} placeholder="16.5" />
                                        <Field label="Width (ft)" value={form.load_width} onChange={v => set('load_width', v)} placeholder="14.0" />
                                    </Row>
                                    <Row>
                                        <Field label="Length (ft)" value={form.load_length} onChange={v => set('load_length', v)} placeholder="120" />
                                        <Field label="Weight (lbs)" value={form.load_weight} onChange={v => set('load_weight', v)} placeholder="80,000" />
                                    </Row>
                                </Section>

                                {/* Escort Requirements */}
                                <Section title="🚗 Escort Configuration">
                                    <Row>
                                        <Field label="Lead Escorts" value={form.escort_lead} onChange={v => set('escort_lead', v)} placeholder="1" />
                                        <Field label="Chase Escorts" value={form.escort_chase} onChange={v => set('escort_chase', v)} placeholder="0" />
                                        <Field label="Base Rate ($)" value={form.base_rate} onChange={v => set('base_rate', v)} placeholder="600" />
                                    </Row>
                                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                                        <TogglePill label="Police Escort" active={form.requires_police} onClick={() => set('requires_police', !form.requires_police)} />
                                        <TogglePill label="High Pole" active={form.requires_high_pole} onClick={() => set('requires_high_pole', !form.requires_high_pole)} />
                                    </div>
                                </Section>

                                {/* Urgency */}
                                <Section title="⚡ Urgency Level">
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {URGENCY_OPTIONS.map(u => (
                                            <button key={u} onClick={() => set('urgency', u)}
                                                style={{
                                                    flex: 1, padding: '12px 8px', borderRadius: 10,
                                                    border: `1.5px solid ${form.urgency === u
                                                        ? u === 'now' ? '#ef4444' : u === 'soon' ? '#f97316' : '#3b82f6'
                                                        : '#1e293b'}`,
                                                    background: form.urgency === u
                                                        ? u === 'now' ? 'rgba(239,68,68,0.1)' : u === 'soon' ? 'rgba(249,115,22,0.1)' : 'rgba(59,130,246,0.1)'
                                                        : '#0f172a',
                                                    color: form.urgency === u ? '#fff' : '#64748b',
                                                    cursor: 'pointer', fontWeight: 700, fontSize: 13,
                                                    transition: 'all 0.2s', textAlign: 'center',
                                                }}>
                                                <div style={{ fontSize: 18, marginBottom: 4 }}>{URGENCY_ICONS[u]}</div>
                                                {URGENCY_LABELS[u]}
                                            </button>
                                        ))}
                                    </div>
                                </Section>
                            </div>
                        </div>

                        {/* Special Notes */}
                        <Section title="📝 Special Notes (Optional)">
                            <textarea
                                value={form.special_notes}
                                onChange={e => set('special_notes', e.target.value)}
                                placeholder="Any special requirements, route restrictions, or communication notes for the escort operators..."
                                rows={3}
                                style={{
                                    width: '100%', padding: '12px 14px', borderRadius: 10,
                                    border: '1px solid #1e293b', background: '#0f172a', color: '#e2e8f0',
                                    fontSize: 13, outline: 'none', boxSizing: 'border-box',
                                    resize: 'vertical', fontFamily: 'inherit',
                                }}
                            />
                        </Section>

                        {error && <ErrorBanner message={error} />}

                        {/* Submit */}
                        <button
                            onClick={handlePostLoad}
                            disabled={loading || !form.origin_state || !form.dest_state}
                            style={{
                                width: '100%', padding: '18px 0', borderRadius: 14, border: 'none',
                                cursor: loading ? 'wait' : 'pointer',
                                background: loading
                                    ? '#334155'
                                    : 'linear-gradient(135deg, #f97316, #ea580c)',
                                color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: 0.3,
                                transition: 'all 0.3s',
                                opacity: !form.origin_state || !form.dest_state ? 0.4 : 1,
                                boxShadow: loading ? 'none' : '0 6px 24px rgba(249,115,22,0.3)',
                            }}>
                            {loading ? '⚡ Finding Your Top 3 Matches...' : '🚀 Post Load & Preview Matches'}
                        </button>
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════════
                    STEP 2: Top 3 Match Cards
                   ════════════════════════════════════════════════════════════════ */}
                {step === 2 && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                        {/* Summary Bar */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '16px 20px', background: '#0f172a', border: '1px solid #1e293b',
                            borderRadius: 14, marginBottom: 24,
                        }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                                    🚛 {form.origin_city || form.origin_state}, {form.origin_state} → {form.dest_city || form.dest_state}, {form.dest_state}
                                </div>
                                <div style={{ fontSize: 12, color: '#64748b' }}>
                                    {form.load_type?.toUpperCase()} · {URGENCY_LABELS[form.urgency]} · Rate: ${form.base_rate || '—'}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Match Time</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: '#22c55e', fontFeatureSettings: '"tnum"' }}>
                                    {elapsed}ms
                                </div>
                            </div>
                        </div>

                        {/* Candidate Pool Info */}
                        {matchResult && (
                            <div style={{
                                fontSize: 12, color: '#64748b', marginBottom: 16, textAlign: 'center',
                            }}>
                                Analyzed <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{matchResult.candidate_pool_size}</span> eligible operators
                                · Generated <span style={{ color: '#f97316', fontWeight: 700 }}>{matchResult.matches.length}</span> recommended match{matchResult.matches.length !== 1 ? 'es' : ''}
                            </div>
                        )}

                        {/* Top 3 Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
                            {matchResult?.matches.map(card => {
                                const cfg = CARD_CONFIG[card.type] ?? CARD_CONFIG.sure_thing;
                                const isSelected = selectedCard === card.operator_id;

                                return (
                                    <button
                                        key={card.operator_id}
                                        onClick={() => setSelectedCard(isSelected ? null : card.operator_id)}
                                        style={{
                                            background: '#0f172a',
                                            border: `2px solid ${isSelected ? cfg.border : '#1e293b'}`,
                                            borderRadius: 16,
                                            padding: 0,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            overflow: 'hidden',
                                            transition: 'all 0.25s',
                                            transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                            boxShadow: isSelected ? `0 8px 32px ${cfg.glow}` : 'none',
                                            color: '#e2e8f0',
                                        }}>
                                        {/* Card Header */}
                                        <div style={{
                                            background: cfg.gradient,
                                            padding: '16px 18px',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        }}>
                                            <div>
                                                <div style={{ fontSize: 20, marginBottom: 4 }}>{cfg.icon}</div>
                                                <div style={{ fontSize: 16, fontWeight: 800 }}>{card.label}</div>
                                                <div style={{ fontSize: 11, opacity: 0.8 }}>{card.tagline}</div>
                                            </div>
                                            <div style={{
                                                width: 48, height: 48, borderRadius: '50%',
                                                background: 'rgba(255,255,255,0.18)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 18, fontWeight: 900,
                                            }}>
                                                {Math.round(card.composite_score * 100)}
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div style={{ padding: '16px 18px' }}>
                                            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{card.operator_name}</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                                                <MiniStat label="Trust" value={`${card.trust_score}/100`} color={card.trust_score >= 80 ? '#22c55e' : card.trust_score >= 60 ? '#fbbf24' : '#f87171'} />
                                                <MiniStat label="Response" value={card.response_min ? `${card.response_min}min` : '—'} color="#94a3b8" />
                                                <MiniStat label="Rate" value={card.rate_per_mile ? `$${card.rate_per_mile.toFixed(2)}/mi` : '—'} color="#94a3b8" />
                                                <MiniStat label="Corridor XP" value={`${card.corridor_match_count}`} color="#94a3b8" />
                                            </div>

                                            {/* Confidence Badge */}
                                            <div style={{
                                                display: 'inline-block', padding: '3px 10px',
                                                borderRadius: 6, fontSize: 10, fontWeight: 800,
                                                textTransform: 'uppercase', letterSpacing: '0.08em',
                                                background: card.confidence === 'high' ? 'rgba(16,185,129,0.12)' : card.confidence === 'medium' ? 'rgba(251,191,36,0.12)' : 'rgba(248,113,113,0.12)',
                                                color: card.confidence === 'high' ? '#10b981' : card.confidence === 'medium' ? '#fbbf24' : '#f87171',
                                                border: `1px solid ${card.confidence === 'high' ? '#10b98130' : card.confidence === 'medium' ? '#fbbf2430' : '#f8717130'}`,
                                            }}>
                                                {card.confidence} confidence
                                            </div>

                                            {/* Reasoning */}
                                            <div style={{ marginTop: 12 }}>
                                                {card.reasoning.map((r, i) => (
                                                    <div key={i} style={{ fontSize: 11, color: '#64748b', marginBottom: 3, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                                        <span style={{ color: cfg.border, flexShrink: 0 }}>✓</span>
                                                        <span>{r}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Selection indicator */}
                                            {isSelected && (
                                                <div style={{
                                                    marginTop: 12, padding: '8px 0', textAlign: 'center',
                                                    background: `${cfg.border}15`, borderRadius: 8,
                                                    color: cfg.border, fontWeight: 700, fontSize: 12,
                                                }}>
                                                    ✓ Selected
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}

                            {/* Empty state */}
                            {matchResult?.matches.length === 0 && (
                                <div style={{
                                    gridColumn: '1 / -1', textAlign: 'center', padding: 40,
                                    background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16,
                                }}>
                                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No Matches Found</div>
                                    <div style={{ fontSize: 13, color: '#64748b', maxWidth: 360, margin: '0 auto' }}>
                                        No eligible operators in the candidate pool right now. Your load has been posted — we&apos;ll dispatch offers via wave matching as escorts come online.
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && <ErrorBanner message={error} />}

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => { setStep(1); setMatchResult(null); }}
                                style={{
                                    padding: '14px 24px', borderRadius: 12,
                                    border: '1px solid #334155', background: 'transparent',
                                    color: '#94a3b8', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                                }}>
                                ← Edit Load
                            </button>
                            <button
                                onClick={handleDispatchOffers}
                                disabled={loading}
                                style={{
                                    flex: 1, padding: '16px 0', borderRadius: 12, border: 'none',
                                    cursor: loading ? 'wait' : 'pointer',
                                    background: loading ? '#334155' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                                    color: '#fff', fontWeight: 800, fontSize: 15,
                                    boxShadow: loading ? 'none' : '0 6px 24px rgba(34,197,94,0.25)',
                                    transition: 'all 0.3s',
                                }}>
                                {loading ? '📡 Dispatching...' : '📡 Dispatch Offers to All Eligible Escorts'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════════
                    STEP 3: Confirmation
                   ════════════════════════════════════════════════════════════════ */}
                {step === 3 && (
                    <div style={{ animation: 'fadeIn 0.3s ease', textAlign: 'center', paddingTop: 40 }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 40, margin: '0 auto 24px',
                            boxShadow: '0 8px 32px rgba(34,197,94,0.3)',
                        }}>✓</div>

                        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, letterSpacing: -0.5 }}>Offers Dispatched!</h1>
                        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
                            Your load has been posted and {waveResult?.offers_created ?? 0} offers have been sent to top-ranked escorts in Wave 1.
                            Escorts have {Math.round((waveResult?.ttl_seconds ?? 180) / 60)} minutes to respond.
                        </p>

                        {/* Stats Grid */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
                            maxWidth: 600, margin: '0 auto 32px',
                        }}>
                            <ConfirmStat label="Offers Sent" value={String(waveResult?.offers_created ?? 0)} icon="📨" />
                            <ConfirmStat label="Wave" value={String(waveResult?.wave ?? 1)} icon="🌊" />
                            <ConfirmStat label="Pool Size" value={String(waveResult?.candidates_considered ?? 0)} icon="👥" />
                            <ConfirmStat label="TTL" value={`${Math.round((waveResult?.ttl_seconds ?? 180) / 60)}min`} icon="⏱️" />
                        </div>

                        {/* Next Actions */}
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button onClick={() => router.push(`/loads/${loadId}`)}
                                style={{
                                    padding: '14px 28px', borderRadius: 12, border: 'none',
                                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                                    color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                                    boxShadow: '0 4px 16px rgba(249,115,22,0.25)',
                                }}>
                                View Load Details →
                            </button>
                            <button onClick={() => router.push('/loads')}
                                style={{
                                    padding: '14px 28px', borderRadius: 12,
                                    border: '1px solid #334155', background: 'transparent',
                                    color: '#94a3b8', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                                }}>
                                Load Board
                            </button>
                            <button onClick={() => { setStep(1); setLoadId(null); setMatchResult(null); setWaveResult(null); setOffersSent(false); setForm(f => ({ ...f, origin_city: '', origin_state: '', origin_lat: '', origin_lng: '', dest_city: '', dest_state: '', dest_lat: '', dest_lng: '', special_notes: '' })); }}
                                style={{
                                    padding: '14px 28px', borderRadius: 12,
                                    border: '1px solid #334155', background: 'transparent',
                                    color: '#94a3b8', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                                }}>
                                + Post Another
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Global animation */}
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}

// ── Sub-Components ─────────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div style={{
            background: '#0f172a', border: '1px solid #1e293b',
            borderRadius: 14, padding: '18px 20px', marginBottom: 16,
        }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', marginBottom: subtitle ? 2 : 14, letterSpacing: 0.3 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11, color: '#475569', marginBottom: 14 }}>{subtitle}</div>}
            {children}
        </div>
    );
}

function Row({ children }: { children: React.ReactNode }) {
    return <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>{children}</div>;
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
    return (
        <div style={{ flex: 1 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
            <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
                style={{
                    width: '100%', marginTop: 5, padding: '10px 12px', borderRadius: 8,
                    border: '1px solid #1e293b', background: '#030712', color: '#e2e8f0',
                    fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#f97316'}
                onBlur={e => e.currentTarget.style.borderColor = '#1e293b'}
            />
        </div>
    );
}

function TogglePill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button onClick={onClick} style={{
            padding: '8px 16px', borderRadius: 8,
            border: `1.5px solid ${active ? '#f97316' : '#1e293b'}`,
            background: active ? 'rgba(249,115,22,0.1)' : '#0f172a',
            color: active ? '#fb923c' : '#64748b',
            fontWeight: 700, fontSize: 12, cursor: 'pointer',
            transition: 'all 0.2s',
        }}>
            {active ? '✓ ' : ''}{label}
        </button>
    );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div style={{
            padding: '8px 10px', background: '#0a0f1e', borderRadius: 8,
            border: '1px solid #1e293b',
        }}>
            <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color, fontFeatureSettings: '"tnum"' }}>{value}</div>
        </div>
    );
}

function ConfirmStat({ label, value, icon }: { label: string; value: string; icon: string }) {
    return (
        <div style={{
            padding: '20px 16px', background: '#0f172a', border: '1px solid #1e293b',
            borderRadius: 14, textAlign: 'center',
        }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#e2e8f0', fontFeatureSettings: '"tnum"' }}>{value}</div>
            <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{label}</div>
        </div>
    );
}

function ErrorBanner({ message }: { message: string }) {
    return (
        <div style={{
            color: '#f87171', padding: '12px 16px', background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, marginBottom: 16,
            fontSize: 13, fontWeight: 600,
        }}>
            ⚠️ {message}
        </div>
    );
}
