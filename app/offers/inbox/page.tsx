'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Offer {
    id: string;
    load_id: string;
    offered_rate: number;
    surge_percent: number;
    status: 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
    expires_at: string;
    loads?: {
        urgency: string;
        origin_lat: number; origin_lng: number;
        dest_lat: number; dest_lng: number;
        load_height: number; load_width: number;
        pickup_start: string;
    };
}

function useCountdown(expiresAt: string | null) {
    const [secs, setSecs] = useState<number | null>(null);
    useEffect(() => {
        if (!expiresAt) return;
        const tick = () => setSecs(Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);
    return secs;
}

function OfferCard({ offer, onAccept, onDecline, accepting }: {
    offer: Offer; onAccept: (id: string) => void; onDecline: (id: string) => void; accepting: string | null;
}) {
    const countdown = useCountdown(offer.status === 'sent' || offer.status === 'viewed' ? offer.expires_at : null);
    const isExpired = offer.status === 'expired' || (countdown !== null && countdown <= 0);
    const urgencyColor = offer.loads?.urgency === 'now' ? '#ef4444' : offer.loads?.urgency === 'soon' ? '#f97316' : '#22c55e';
    const effectiveRate = offer.offered_rate * (1 + (offer.surge_percent || 0) / 100);

    return (
        <div style={{
            background: isExpired ? '#0c0f1a' : '#0f172a',
            border: `1px solid ${isExpired ? '#1e293b' : urgencyColor + '44'}`,
            borderRadius: 14, padding: 20, marginBottom: 14,
            opacity: isExpired ? 0.5 : 1,
            transition: 'all 0.2s',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{
                            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                            background: `${urgencyColor}20`, color: urgencyColor, textTransform: 'uppercase', letterSpacing: 0.6
                        }}>
                            {offer.loads?.urgency ?? 'STANDARD'}
                        </span>
                        {offer.surge_percent > 0 && (
                            <span style={{
                                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                                background: '#f97316' + '20', color: '#f97316'
                            }}>
                                +{offer.surge_percent.toFixed(0)}% SURGE
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{offer.load_id.slice(0, 12)}…</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#22c55e', letterSpacing: -1 }}>
                        ${effectiveRate.toFixed(0)}
                    </div>
                    {offer.surge_percent > 0 && (
                        <div style={{ fontSize: 11, color: '#64748b', textDecoration: 'line-through' }}>${offer.offered_rate.toFixed(0)}</div>
                    )}
                </div>
            </div>

            {/* Route info */}
            {offer.loads && (
                <div style={{ background: '#080d18', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#94a3b8' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ color: '#22c55e' }}>📍</span>
                        <span>{offer.loads.origin_lat?.toFixed(3)}, {offer.loads.origin_lng?.toFixed(3)}</span>
                        <span style={{ color: '#475569' }}>→</span>
                        <span>{offer.loads.dest_lat?.toFixed(3)}, {offer.loads.dest_lng?.toFixed(3)}</span>
                    </div>
                    {offer.loads.pickup_start && (
                        <div style={{ marginTop: 6, color: '#475569' }}>
                            🕒 {new Date(offer.loads.pickup_start).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                    )}
                    {offer.loads.load_height && (
                        <div style={{ marginTop: 4, color: '#475569' }}>
                            📐 {offer.loads.load_height}ft H × {offer.loads.load_width}ft W
                        </div>
                    )}
                </div>
            )}

            {/* Expiry countdown */}
            {!isExpired && countdown !== null && (
                <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, color: '#64748b' }}>
                        <span>Offer expires</span>
                        <span style={{ color: countdown < 60 ? '#ef4444' : '#94a3b8', fontWeight: 700 }}>
                            {countdown < 60 ? `${countdown}s` : `${Math.ceil(countdown / 60)}m`}
                        </span>
                    </div>
                    <div style={{ height: 4, background: '#1e293b', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', borderRadius: 2, transition: 'width 1s linear',
                            width: `${Math.min(100, (countdown / 300) * 100)}%`,
                            background: countdown < 60 ? '#ef4444' : '#f97316',
                        }} />
                    </div>
                </div>
            )}

            {/* Actions */}
            {!isExpired && offer.status !== 'accepted' && offer.status !== 'declined' && (
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => onDecline(offer.id)}
                        style={{
                            flex: 1, padding: '11px 0', borderRadius: 8, border: '1px solid #334155',
                            background: 'transparent', color: '#94a3b8', fontWeight: 600, fontSize: 14, cursor: 'pointer'
                        }}>
                        Decline
                    </button>
                    <button onClick={() => onAccept(offer.id)} disabled={accepting === offer.id}
                        style={{
                            flex: 2, padding: '11px 0', borderRadius: 8, border: 'none', cursor: accepting === offer.id ? 'wait' : 'pointer',
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', fontWeight: 700, fontSize: 14,
                            opacity: accepting === offer.id ? 0.7 : 1
                        }}>
                        {accepting === offer.id ? '⏳ Reserving...' : '✅ Accept & Reserve'}
                    </button>
                </div>
            )}

            {offer.status === 'accepted' && (
                <div style={{
                    padding: '11px 0', borderRadius: 8, background: '#052e16',
                    color: '#22c55e', textAlign: 'center', fontWeight: 700, fontSize: 14
                }}>
                    ✅ Reserved — waiting for broker confirmation
                </div>
            )}

            {isExpired && (
                <div style={{ padding: '11px 0', textAlign: 'center', color: '#475569', fontSize: 13 }}>Offer expired</div>
            )}
        </div>
    );
}

export default function DriverOfferInboxPage() {
    const supabase = createClient();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [accepting, setAccepting] = useState<string | null>(null);
    const [availability, setAvailability] = useState<'available' | 'near_ready' | 'unavailable'>('unavailable');
    const [updatingAvail, setUpdatingAvail] = useState(false);

    const loadOffers = useCallback(async (uid: string) => {
        const { data } = await supabase
            .from('offers')
            .select('*, loads(urgency, origin_lat, origin_lng, dest_lat, dest_lng, load_height, load_width, pickup_start)')
            .eq('driver_id', uid)
            .in('status', ['sent', 'viewed', 'accepted'])
            .order('created_at', { ascending: false })
            .limit(20);
        if (data) setOffers(data as Offer[]);
    }, [supabase]);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return;
            setUserId(user.id);
            loadOffers(user.id);

            // Real-time subscription
            const channel = supabase
                .channel('driver-offers')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'offers', filter: `driver_id=eq.${user.id}` },
                    () => loadOffers(user.id))
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        });
    }, [supabase, loadOffers]);

    async function handleAccept(offerId: string) {
        setAccepting(offerId);
        const { data: { session } } = await supabase.auth.getSession();
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const res = await fetch(`${SUPABASE_URL}/functions/v1/offer-accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
            body: JSON.stringify({ offer_id: offerId }),
        });
        if (res.ok) {
            setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'accepted' } : o));
        }
        setAccepting(null);
    }

    async function handleDecline(offerId: string) {
        await supabase.from('offers').update({ status: 'declined' }).eq('id', offerId);
        setOffers(prev => prev.filter(o => o.id !== offerId));
    }

    async function toggleAvailability(newStatus: typeof availability) {
        if (!userId) return;
        setUpdatingAvail(true);
        await supabase.from('driver_heartbeat').upsert({
            driver_id: userId, availability_status: newStatus, last_seen_at: new Date().toISOString(),
            lat: 0, lng: 0, // real GPS would come from device
        });
        setAvailability(newStatus);
        setUpdatingAvail(false);
    }

    const activeOffers = offers.filter(o => ['sent', 'viewed'].includes(o.status));
    const acceptedOffers = offers.filter(o => o.status === 'accepted');

    return (
        <div style={{ minHeight: '100vh', background: '#0a0f1e', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <div style={{ borderBottom: '1px solid #1e293b', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>Offer Inbox</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{activeOffers.length} active offer{activeOffers.length !== 1 ? 's' : ''}</div>
                </div>
                {/* Availability toggle */}
                <div style={{ display: 'flex', gap: 8, background: '#0f172a', borderRadius: 10, padding: 4 }}>
                    {(['available', 'near_ready', 'unavailable'] as const).map(s => (
                        <button key={s} onClick={() => toggleAvailability(s)} disabled={updatingAvail}
                            style={{
                                padding: '8px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12,
                                background: availability === s
                                    ? s === 'available' ? '#22c55e' : s === 'near_ready' ? '#f97316' : '#475569'
                                    : 'transparent',
                                color: availability === s ? '#fff' : '#64748b',
                                transition: 'all 0.2s'
                            }}>
                            {s === 'available' ? '🟢 Available' : s === 'near_ready' ? '🟡 Near-Ready' : '⚫ Off'}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 20px' }}>
                {/* Accepted reservations */}
                {acceptedOffers.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                            ✅ Soft Reserved — Awaiting Broker Confirmation
                        </div>
                        {acceptedOffers.map(o => (
                            <OfferCard key={o.id} offer={o} onAccept={handleAccept} onDecline={handleDecline} accepting={accepting} />
                        ))}
                    </div>
                )}

                {/* Active offers */}
                {activeOffers.length > 0 ? (
                    <>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#f97316', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                            ⚡ Active Offers
                        </div>
                        {activeOffers.map(o => (
                            <OfferCard key={o.id} offer={o} onAccept={handleAccept} onDecline={handleDecline} accepting={accepting} />
                        ))}
                    </>
                ) : acceptedOffers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#334155', marginBottom: 8 }}>No active offers</div>
                        <div style={{ fontSize: 14, color: '#475569' }}>
                            {availability === 'unavailable'
                                ? 'Set your status to Available to start receiving offers'
                                : 'You\'re visible — offers will appear here in real time'}
                        </div>
                    </div>
                ) : null}

                {/* Compliance wallet link */}
                <a href="/profile/compliance"
                    style={{
                        display: 'flex', marginTop: 24, padding: '14px 20px', borderRadius: 12,
                        border: '1px solid #334155', background: '#0f172a', textDecoration: 'none', color: '#94a3b8',
                        justifyContent: 'space-between', alignItems: 'center'
                    }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>📄 Compliance Wallet</div>
                        <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Manage documents, certs &amp; renewals</div>
                    </div>
                    <div style={{ fontSize: 18, color: '#475569' }}>›</div>
                </a>
            </div>
        </div>
    );
}
