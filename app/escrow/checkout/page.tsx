'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

interface EscrowState {
    escrow_required: boolean;
    pay_score: number;
    credit_limit: number;
    velocity_score: number;
    deposit_percent: number;
}

interface FormState {
    escort_id: string;
    booking_id: string;
    subtotal_usd: number;
    description: string;
}

const supabase = createClient();

const GRADIENT_BG = 'radial-gradient(ellipse at 15% 50%, rgba(245,158,11,0.08) 0%, transparent 60%), radial-gradient(ellipse at 85% 20%, rgba(16,185,129,0.06) 0%, transparent 50%), #0a0a0f';

export default function EscrowCheckoutPage() {
    const [form, setForm] = useState<FormState>({ escort_id: '', booking_id: '', subtotal_usd: 500, description: '' });
    const [escrow, setEscrow] = useState<EscrowState | null>(null);
    const [loadingCheck, setLoadingCheck] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ payment_id: string; hold_id?: string; status: string; deposit_usd: number; platform_fee_usd: number } | null>(null);
    const [error, setError] = useState('');

    const checkEscrowRequirement = useCallback(async () => {
        if (!form.subtotal_usd || form.subtotal_usd <= 0) return;
        setLoadingCheck(true);
        setError('');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { setError('Not authenticated'); return; }

            const { data: vel } = await supabase.from('pay_broker_velocity').select('payment_velocity_score').eq('broker_id', session.user.id).maybeSingle();
            const { data: credit } = await supabase.from('pay_broker_credit').select('pay_score_cached,credit_limit_usd').eq('broker_id', session.user.id).maybeSingle();
            const vel_score = vel?.payment_velocity_score ?? 0.5;
            const escrow_required = vel_score < 0.60 || form.subtotal_usd >= 1500;
            setEscrow({
                escrow_required,
                pay_score: credit?.pay_score_cached ?? 50,
                credit_limit: credit?.credit_limit_usd ?? 0,
                velocity_score: vel_score,
                deposit_percent: 35,
            });
        } finally {
            setLoadingCheck(false);
        }
    }, [form.subtotal_usd]);

    useEffect(() => { if (form.subtotal_usd > 0) checkEscrowRequirement(); }, [form.subtotal_usd, checkEscrowRequirement]);

    const handleSubmit = async () => {
        if (!form.escort_id || !form.subtotal_usd) { setError('Fill all required fields'); return; }
        setSubmitting(true); setError(''); setResult(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const resp = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/pay-escrow-fund`, {
                method: 'POST',
                headers: { 'authorization': `Bearer ${session?.access_token}`, 'content-type': 'application/json' },
                body: JSON.stringify({ escort_id: form.escort_id, booking_id: form.booking_id || undefined, subtotal_usd: form.subtotal_usd, idempotency_key: `${session?.user.id}-${Date.now()}` }),
            });
            const data = await resp.json();
            if (!resp.ok) { setError(data.error ?? 'Payment initiation failed'); return; }
            setResult(data);
        } catch (e) { setError(String(e)); }
        finally { setSubmitting(false); }
    };

    const payScore = escrow?.pay_score ?? 50;
    const scoreColor = payScore >= 75 ? '#10b981' : payScore >= 60 ? '#f59e0b' : '#ef4444';
    const depositAmt = escrow ? (form.subtotal_usd * (escrow.deposit_percent / 100)) : 0;
    const platformFee = Math.max(15, form.subtotal_usd * 0.02);

    return (
        <div style={{ minHeight: '100vh', background: GRADIENT_BG, color: '#e5e7eb', fontFamily: "'Inter', system-ui, sans-serif", padding: '2rem 1rem' }}>
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💳</div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f9fafb' }}>Escrow Checkout</h1>
                            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Secure payment initiation for escort services</p>
                        </div>
                    </div>
                </div>

                {/* PAY Score Panel */}
                {escrow && (
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(${payScore >= 75 ? '16,185,129' : payScore >= 60 ? '245,158,11' : '239,68,68'},0.3)`, borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{payScore}</div>
                            <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>PAY Score</div>
                        </div>
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {[
                                { label: 'Velocity Score', val: `${Math.round(escrow.velocity_score * 100)}%` },
                                { label: 'Credit Limit', val: `$${escrow.credit_limit.toLocaleString()}` },
                                { label: 'Escrow Required', val: escrow.escrow_required ? 'YES' : 'Optional', highlight: escrow.escrow_required },
                                { label: 'Deposit Required', val: escrow.escrow_required ? `${escrow.deposit_percent}%` : 'None' },
                            ].map(item => (
                                <div key={item.label}>
                                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{item.label}</div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: item.highlight ? '#f59e0b' : '#f9fafb' }}>{item.val}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Form */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: '0 0 1.25rem', fontSize: 15, fontWeight: 600, color: '#d1d5db' }}>Payment Details</h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {[
                            { label: 'Escort User ID *', key: 'escort_id', type: 'text', placeholder: 'uuid of escort...' },
                            { label: 'Booking ID (optional)', key: 'booking_id', type: 'text', placeholder: 'link to booking...' },
                            { label: 'Service Amount (USD) *', key: 'subtotal_usd', type: 'number', placeholder: '500' },
                            { label: 'Description / Notes', key: 'description', type: 'text', placeholder: 'e.g. I-10 escort, 42 miles...' },
                        ].map(f => (
                            <div key={f.key}>
                                <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</label>
                                <input
                                    type={f.type}
                                    placeholder={f.placeholder}
                                    value={(form as any)[f.key] as string}
                                    onChange={e => setForm(p => ({ ...p, [f.key]: f.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.6rem 0.85rem', color: '#f9fafb', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cost Summary */}
                {form.subtotal_usd > 0 && (
                    <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: 14, fontWeight: 600, color: '#f59e0b' }}>💰 Cost Breakdown</h3>
                        {[
                            { label: 'Service Subtotal', val: `$${form.subtotal_usd.toFixed(2)}` },
                            { label: 'Platform Fee (2%)', val: `$${platformFee.toFixed(2)}`, sub: true },
                            ...(escrow?.escrow_required ? [{ label: `Deposit Now (${escrow.deposit_percent}%)`, val: `$${depositAmt.toFixed(2)}`, highlight: true }] : []),
                            { label: 'Remaining at Release', val: `$${(form.subtotal_usd - (escrow?.escrow_required ? depositAmt : 0)).toFixed(2)}`, sub: true },
                        ].map((row, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                <span style={{ fontSize: 13, color: '#9ca3af' }}>{row.label}</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: (row as any)['highlight'] ? '#f59e0b' : '#f9fafb' }}>{row.val}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Auto-release conditions */}
                <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
                    <p style={{ margin: '0 0 0.5rem', fontSize: 12, fontWeight: 600, color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.5 }}>Auto-Release Conditions</p>
                    {['GPS check-in verified at pickup', 'Arrival photo uploaded', '10+ minutes elapsed since check-in', 'No open dispute on this payment'].map(c => (
                        <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.3rem 0', fontSize: 13, color: '#6b7280' }}>
                            <span style={{ color: '#10b981', fontSize: 11 }}>✓</span> {c}
                        </div>
                    ))}
                </div>

                {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: 13, color: '#f87171' }}>⚠ {error}</div>}
                {result && (
                    <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#10b981', marginBottom: 8 }}>✅ Payment Initiated</div>
                        {[['Payment ID', result.payment_id], ['Status', result.status], ['Deposit Held', `$${result.deposit_usd?.toFixed(2) ?? 0}`], ['Platform Fee', `$${result.platform_fee_usd?.toFixed(2) ?? 0}`]].map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', padding: '0.2rem 0' }}>
                                <span>{k}</span><span style={{ color: '#d1d5db', fontFamily: 'monospace' }}>{v}</span>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={submitting || !form.escort_id || form.subtotal_usd <= 0}
                    style={{ width: '100%', padding: '0.9rem', borderRadius: 10, border: 'none', background: submitting || !form.escort_id ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#f59e0b,#d97706)', color: submitting || !form.escort_id ? '#4b5563' : '#000', fontSize: 15, fontWeight: 700, cursor: submitting || !form.escort_id ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                >
                    {submitting ? '⏳ Processing...' : escrow?.escrow_required ? `🔒 Fund Escrow · $${depositAmt.toFixed(2)} deposit` : `💳 Initiate Payment · $${form.subtotal_usd.toFixed(2)}`}
                </button>
                <p style={{ textAlign: 'center', fontSize: 11, color: '#4b5563', marginTop: '0.75rem' }}>Funds are secured via HC Escrow. Release triggers automatically when proof conditions are met.</p>
            </div>
        </div>
    );
}
