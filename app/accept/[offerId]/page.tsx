'use client';

/**
 * One-Tap Accept Flow
 * Push → Deep link → Full-screen accept → Done in ≤ 2 taps
 * 
 * Route: /accept/[offerId]
 * Deep link: haulcommand://accept/[offerId]
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface OfferDetails {
    id: string;
    load_id: string;
    status: string;
    price_offer_cents: number | null;
    sent_at: string;
    load: {
        title: string | null;
        origin_text: string | null;
        dest_text: string | null;
        origin_lat: number | null;
        origin_lng: number | null;
        dest_lat: number | null;
        dest_lng: number | null;
        pickup_at: string | null;
        dims: any;
        route_states: string[] | null;
        urgency: string | null;
        broker: {
            display_name: string | null;
        } | null;
    } | null;
}

type AcceptState = 'loading' | 'ready' | 'accepting' | 'accepted' | 'expired' | 'error';

export default function AcceptOfferPage() {
    const params = useParams();
    const router = useRouter();
    const offerId = params.offerId as string;
    const supabase = createClient();

    const [offer, setOffer] = useState<OfferDetails | null>(null);
    const [state, setState] = useState<AcceptState>('loading');
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [pulseAnim, setPulseAnim] = useState(true);

    // Fetch offer details
    useEffect(() => {
        async function loadOffer() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    setError('Sign in to accept this offer.');
                    setState('error');
                    return;
                }

                const { data, error: err } = await supabase
                    .from('offers')
                    .select(`
                        id, load_id, status, price_offer_cents, sent_at,
                        loads!inner (
                            title, origin_text, dest_text,
                            origin_lat, origin_lng, dest_lat, dest_lng,
                            pickup_at, dims, route_states,
                            broker:broker_id ( display_name )
                        )
                    `)
                    .eq('id', offerId)
                    .eq('driver_id', session.user.id)
                    .single();

                if (err || !data) {
                    setError('Offer not found or not assigned to you.');
                    setState('error');
                    return;
                }

                const offerData = data as any;
                setOffer({
                    ...offerData,
                    load: offerData.loads,
                });

                if (offerData.status === 'accepted') {
                    setState('accepted');
                } else if (offerData.status === 'expired' || offerData.status === 'cancelled') {
                    setState('expired');
                } else {
                    setState('ready');
                    // Calculate countdown from sent_at (3 min TTL default)
                    const sentTime = new Date(offerData.sent_at).getTime();
                    const ttlMs = 180_000; // 3 minutes
                    const remaining = Math.max(0, Math.ceil((sentTime + ttlMs - Date.now()) / 1000));
                    setCountdown(remaining);
                }
            } catch (e) {
                setError(String(e));
                setState('error');
            }
        }
        loadOffer();
    }, [offerId, supabase]);

    // Live countdown timer
    useEffect(() => {
        if (countdown === null || countdown <= 0 || state !== 'ready') return;
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) {
                    setState('expired');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown, state]);

    // Accept handler — ONE TAP
    const handleAccept = useCallback(async () => {
        if (state !== 'ready') return;
        setState('accepting');
        setPulseAnim(false);

        try {
            const res = await fetch('/api/offers/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ offer_id: offerId }),
            });

            if (res.ok) {
                setState('accepted');
                // Haptic feedback on Capacitor (if available)
                try {
                    const { Haptics } = await import('@capacitor/haptics');
                    await Haptics.notification({ type: 'SUCCESS' as any });
                } catch { /* not native */ }
            } else {
                const body = await res.json().catch(() => ({}));
                setError(body?.error ?? 'Failed to accept offer.');
                setState('error');
            }
        } catch (e) {
            setError(String(e));
            setState('error');
        }
    }, [state, offerId]);

    // Decline handler
    const handleDecline = useCallback(async () => {
        try {
            await fetch('/api/offers/decline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ offer_id: offerId }),
            });
        } catch { }
        router.push('/dashboard');
    }, [offerId, router]);

    const formatRate = (cents: number | null) => {
        if (!cents) return '—';
        return `$${(cents / 100).toFixed(0)}`;
    };

    const formatTime = (iso: string | null) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleString('en-US', {
            month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit',
        });
    };

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <div style={{
            minHeight: '100vh',
            background: state === 'accepted'
                ? 'linear-gradient(160deg, #030712 0%, #052e16 50%, #030712 100%)'
                : 'linear-gradient(160deg, #030712 0%, #0c1222 50%, #030712 100%)',
            color: '#e2e8f0',
            fontFamily: "'Inter', system-ui, sans-serif",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            transition: 'background 0.6s ease',
        }}>

            {/* ── LOADING ── */}
            {state === 'loading' && (
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        border: '3px solid #1e293b',
                        borderTopColor: '#f97316',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 24px',
                    }} />
                    <p style={{ fontSize: 14, color: '#64748b' }}>Loading offer details...</p>
                </div>
            )}

            {/* ── READY (main accept screen) ── */}
            {state === 'ready' && offer && (
                <div style={{
                    width: '100%', maxWidth: 420,
                    animation: 'slideUp 0.4s ease',
                }}>
                    {/* Urgency header */}
                    <div style={{
                        textAlign: 'center', marginBottom: 24,
                    }}>
                        <div style={{
                            fontSize: 14, fontWeight: 800,
                            color: '#f97316', letterSpacing: '0.1em',
                            textTransform: 'uppercase', marginBottom: 8,
                        }}>
                            🚛 INCOMING OFFER
                        </div>
                        {countdown !== null && countdown > 0 && (
                            <div style={{
                                fontSize: 36, fontWeight: 900,
                                color: countdown < 30 ? '#ef4444' : countdown < 60 ? '#fbbf24' : '#22c55e',
                                fontFeatureSettings: '"tnum"',
                                transition: 'color 0.3s',
                            }}>
                                {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                            </div>
                        )}
                    </div>

                    {/* Load details card */}
                    <div style={{
                        background: '#0f172a',
                        border: '1px solid #1e293b',
                        borderRadius: 20,
                        padding: '24px',
                        marginBottom: 20,
                    }}>
                        <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontWeight: 700 }}>
                            From: {offer.load?.broker?.display_name ?? 'Broker'}
                        </div>

                        {/* Route */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{ width: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                                <div style={{ width: 2, height: 24, background: '#1e293b' }} />
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                                    {offer.load?.origin_text ?? 'Origin'}
                                </div>
                                <div style={{ fontSize: 15, fontWeight: 700 }}>
                                    {offer.load?.dest_text ?? 'Destination'}
                                </div>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                            <DetailBlock label="Rate" value={formatRate(offer.price_offer_cents)} highlight />
                            <DetailBlock label="Pickup" value={formatTime(offer.load?.pickup_at ?? null)} />
                            <DetailBlock label="States" value={offer.load?.route_states?.join(' → ') ?? '—'} />
                        </div>
                    </div>

                    {/* ── THE BUTTON — Big, full-screen, one tap ── */}
                    <button aria-label="Interactive Button"
                        onClick={handleAccept}
                        style={{
                            width: '100%',
                            padding: '28px 0',
                            borderRadius: 20,
                            border: 'none',
                            cursor: 'pointer',
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                            color: '#fff',
                            fontSize: 24,
                            fontWeight: 900,
                            letterSpacing: -0.5,
                            boxShadow: '0 8px 40px rgba(34, 197, 94, 0.35)',
                            transition: 'all 0.2s',
                            animation: pulseAnim ? 'acceptPulse 2s ease-in-out infinite' : 'none',
                        }}
                    >
                        ✓ ACCEPT
                    </button>

                    {/* Decline */}
                    <button aria-label="Interactive Button"
                        onClick={handleDecline}
                        style={{
                            width: '100%',
                            padding: '14px 0',
                            marginTop: 12,
                            borderRadius: 14,
                            border: '1px solid #334155',
                            background: 'transparent',
                            color: '#64748b',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Decline
                    </button>
                </div>
            )}

            {/* ── ACCEPTING (spinner) ── */}
            {state === 'accepting' && (
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%',
                        border: '4px solid #1e293b',
                        borderTopColor: '#22c55e',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 24px',
                    }} />
                    <p style={{ fontSize: 18, fontWeight: 700 }}>Locking your spot...</p>
                </div>
            )}

            {/* ── ACCEPTED (celebration) ── */}
            {state === 'accepted' && (
                <div style={{
                    textAlign: 'center',
                    animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}>
                    <div style={{
                        width: 100, height: 100, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 50, margin: '0 auto 24px',
                        boxShadow: '0 12px 48px rgba(34, 197, 94, 0.4)',
                    }}>✓</div>

                    <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: -1 }}>
                        You&apos;re Booked!
                    </h1>
                    <p style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>
                        {offer?.load?.origin_text} → {offer?.load?.dest_text}
                    </p>
                    <p style={{ fontSize: 12, color: '#475569', marginBottom: 32 }}>
                        The broker has been notified. Check your Jobs tab for details.
                    </p>

                    <button aria-label="Interactive Button"
                        onClick={() => router.push('/dashboard/jobs')}
                        style={{
                            padding: '16px 40px', borderRadius: 14, border: 'none',
                            background: 'linear-gradient(135deg, #f97316, #ea580c)',
                            color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer',
                            boxShadow: '0 6px 24px rgba(249,115,22,0.3)',
                        }}
                    >
                        View My Jobs →
                    </button>
                </div>
            )}

            {/* ── EXPIRED ── */}
            {state === 'expired' && (
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>⏰</div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Offer Expired</h2>
                    <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
                        This offer is no longer available. Stay online to receive new offers faster.
                    </p>
                    <button aria-label="Interactive Button"
                        onClick={() => router.push('/dashboard')}
                        style={{
                            padding: '14px 32px', borderRadius: 12, border: '1px solid #334155',
                            background: 'transparent', color: '#94a3b8', fontWeight: 600,
                            fontSize: 14, cursor: 'pointer',
                        }}
                    >
                        Back to Dashboard
                    </button>
                </div>
            )}

            {/* ── ERROR ── */}
            {state === 'error' && (
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Something went wrong</h2>
                    <p style={{ fontSize: 13, color: '#f87171', marginBottom: 24 }}>{error}</p>
                    <button aria-label="Interactive Button"
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '14px 32px', borderRadius: 12, border: '1px solid #334155',
                            background: 'transparent', color: '#94a3b8', fontWeight: 600,
                            fontSize: 14, cursor: 'pointer',
                        }}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Animations */}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
                @keyframes acceptPulse {
                    0%, 100% { box-shadow: 0 8px 40px rgba(34,197,94,0.35); transform: scale(1); }
                    50% { box-shadow: 0 12px 60px rgba(34,197,94,0.5); transform: scale(1.02); }
                }
            `}</style>
        </div>
    );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function DetailBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div style={{
            padding: '12px', background: '#0a0f1e', borderRadius: 12,
            border: '1px solid #1e293b',
        }}>
            <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontWeight: 700 }}>{label}</div>
            <div style={{
                fontSize: highlight ? 22 : 13,
                fontWeight: highlight ? 900 : 700,
                color: highlight ? '#22c55e' : '#e2e8f0',
                fontFeatureSettings: '"tnum"',
            }}>{value}</div>
        </div>
    );
}
