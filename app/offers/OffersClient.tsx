'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Offer {
  offer_id: string;
  request_id: string;
  rate_offered: number | null;
  currency: string;
  status: string;
  cascade_round: number;
  accept_deadline_at: string;
  sent_at: string;
  load_request?: {
    origin_lat: number;
    origin_lon: number;
    destination_lat: number;
    destination_lon: number;
    admin1_code: string | null;
    load_type_tags: string[];
    required_escort_count: number;
    special_requirements: string[];
    pickup_time_window: { start: string; end: string };
    dimensions?: { length?: number; width?: number; height?: number; weight?: number };
  };
}

export default function OffersClient() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineFor, setShowDeclineFor] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ id: string; type: 'success' | 'error'; msg: string } | null>(null);

  const supabase = createClient();

  const loadOffers = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('offers')
      .select(`
        offer_id, request_id, rate_offered, currency, status,
        cascade_round, accept_deadline_at, sent_at,
        load_requests!inner (
          origin_lat, origin_lon, destination_lat, destination_lon,
          admin1_code, load_type_tags, required_escort_count,
          special_requirements, pickup_time_window, dimensions
        )
      `)
      .eq('operator_id', user.id)
      .in('status', ['sent', 'accepted', 'declined', 'expired'])
      .order('sent_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setOffers(data.map((o: any) => ({
        ...o,
        load_request: o.load_requests,
      })));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  // Realtime subscription for new offers
  useEffect(() => {
    const channel = supabase
      .channel('operator-offers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => {
        loadOffers();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, loadOffers]);

  const respond = async (offerId: string, action: 'accept' | 'decline') => {
    setResponding(offerId);
    try {
      const res = await fetch(`/api/v1/marketplace/offers/${offerId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ...(action === 'decline' ? { decline_reason: declineReason || undefined } : {}),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setFlash({ id: offerId, type: 'success', msg: action === 'accept' ? '✅ Offer accepted!' : '❌ Offer declined' });
        if (data.booking?.all_escorts_filled) {
          setFlash({ id: offerId, type: 'success', msg: `✅ Booking confirmed! Job: ${data.booking.job_id?.slice(0, 8)}` });
        }
        loadOffers();
      } else {
        setFlash({ id: offerId, type: 'error', msg: data.error || 'Response failed' });
      }
    } catch (err) {
      setFlash({ id: offerId, type: 'error', msg: 'Network error' });
    }
    setResponding(null);
    setShowDeclineFor(null);
    setDeclineReason('');
    setTimeout(() => setFlash(null), 4000);
  };

  const getTimeRemaining = (deadline: string) => {
    const ms = new Date(deadline).getTime() - Date.now();
    if (ms <= 0) return 'Expired';
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      sent: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'PENDING' },
      accepted: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', label: 'ACCEPTED' },
      declined: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'DECLINED' },
      expired: { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', label: 'EXPIRED' },
    };
    const s = map[status] || map.expired;
    return (
      <span style={{ padding: '4px 10px', borderRadius: 6, background: s.bg, color: s.color, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em' }}>
        {s.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0f19', color: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔔</div>
          <div style={{ color: '#F1A91B', fontWeight: 700 }}>Loading offers...</div>
        </div>
      </div>
    );
  }

  const pendingOffers = offers.filter(o => o.status === 'sent');
  const pastOffers = offers.filter(o => o.status !== 'sent');

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f19', color: '#f5f5f5' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#F1A91B', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>DISPATCH CENTER</div>
          <h1 style={{ fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 900, margin: 0 }}>Your Offers</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
            {pendingOffers.length > 0 ? `${pendingOffers.length} offer${pendingOffers.length > 1 ? 's' : ''} waiting for response` : 'No pending offers right now'}
          </p>
        </div>

        {/* Pending Offers */}
        {pendingOffers.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>⏳ PENDING RESPONSE</div>
            {pendingOffers.map(offer => (
              <OfferCard key={offer.offer_id} offer={offer} isPending
                flash={flash?.id === offer.offer_id ? flash : null}
                responding={responding === offer.offer_id}
                showDecline={showDeclineFor === offer.offer_id}
                declineReason={declineReason}
                onAccept={() => respond(offer.offer_id, 'accept')}
                onDeclineStart={() => setShowDeclineFor(offer.offer_id)}
                onDeclineConfirm={() => respond(offer.offer_id, 'decline')}
                onDeclineCancel={() => { setShowDeclineFor(null); setDeclineReason(''); }}
                onDeclineReasonChange={setDeclineReason}
                getTimeRemaining={getTimeRemaining}
                statusBadge={statusBadge}
              />
            ))}
          </div>
        )}

        {/* Past Offers */}
        {pastOffers.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>HISTORY</div>
            {pastOffers.slice(0, 20).map(offer => (
              <OfferCard key={offer.offer_id} offer={offer} isPending={false}
                flash={null} responding={false} showDecline={false}
                declineReason="" onAccept={() => {}} onDeclineStart={() => {}}
                onDeclineConfirm={() => {}} onDeclineCancel={() => {}}
                onDeclineReasonChange={() => {}}
                getTimeRemaining={getTimeRemaining}
                statusBadge={statusBadge}
              />
            ))}
          </div>
        )}

        {offers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <p style={{ fontWeight: 700 }}>No offers yet</p>
            <p style={{ fontSize: 13 }}>Set your status to "Available" to start receiving offers.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Offer Card Component ──

function OfferCard({
  offer, isPending, flash, responding, showDecline,
  declineReason, onAccept, onDeclineStart, onDeclineConfirm,
  onDeclineCancel, onDeclineReasonChange, getTimeRemaining, statusBadge,
}: {
  offer: Offer;
  isPending: boolean;
  flash: { type: 'success' | 'error'; msg: string } | null;
  responding: boolean;
  showDecline: boolean;
  declineReason: string;
  onAccept: () => void;
  onDeclineStart: () => void;
  onDeclineConfirm: () => void;
  onDeclineCancel: () => void;
  onDeclineReasonChange: (v: string) => void;
  getTimeRemaining: (d: string) => string;
  statusBadge: (s: string) => JSX.Element;
}) {
  const lr = offer.load_request;
  const deadlineStr = getTimeRemaining(offer.accept_deadline_at);
  const isExpiringSoon = isPending && deadlineStr !== 'Expired' && !deadlineStr.includes('m');

  return (
    <div style={{
      background: isPending ? 'rgba(59,130,246,0.03)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${isPending ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 14, padding: '16px 18px', marginBottom: 10,
      transition: 'all 0.2s',
    }}>
      {/* Flash message */}
      {flash && (
        <div style={{
          padding: '8px 14px', borderRadius: 8, marginBottom: 10,
          background: flash.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color: flash.type === 'success' ? '#22c55e' : '#ef4444',
          fontSize: 12, fontWeight: 700,
        }}>
          {flash.msg}
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {statusBadge(offer.status)}
          {isPending && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: isExpiringSoon ? '#ef4444' : '#f59e0b',
              animation: isExpiringSoon ? 'pulse 1s infinite' : undefined,
            }}>
              ⏱ {deadlineStr}
            </span>
          )}
        </div>
        {offer.rate_offered && (
          <div style={{ fontSize: 18, fontWeight: 900, color: '#F1A91B', fontFeatureSettings: '"tnum"' }}>
            ${offer.rate_offered.toLocaleString()} <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{offer.currency}</span>
          </div>
        )}
      </div>

      {/* Load details */}
      {lr && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <Detail label="Region" value={lr.admin1_code || '—'} />
          <Detail label="Escorts Needed" value={String(lr.required_escort_count)} />
          <Detail label="Load Type" value={lr.load_type_tags?.join(', ') || 'General'} />
          <Detail label="Pickup" value={lr.pickup_time_window?.start ? new Date(lr.pickup_time_window.start).toLocaleDateString() : '—'} />
          {lr.dimensions?.width && <Detail label="Width" value={`${lr.dimensions.width}m`} />}
          {lr.dimensions?.height && <Detail label="Height" value={`${lr.dimensions.height}m`} />}
          {lr.special_requirements?.length > 0 && (
            <Detail label="Special" value={lr.special_requirements.join(', ')} />
          )}
        </div>
      )}

      {/* Action buttons */}
      {isPending && !showDecline && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onAccept}
            disabled={responding}
            aria-label="Accept Offer"
            style={{
              flex: 1, padding: '12px', borderRadius: 10,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff', fontWeight: 900, fontSize: 14, border: 'none',
              cursor: responding ? 'wait' : 'pointer', opacity: responding ? 0.5 : 1,
            }}
          >
            {responding ? '...' : '✅ Accept'}
          </button>
          <button
            onClick={onDeclineStart}
            disabled={responding}
            aria-label="Decline Offer"
            style={{
              flex: 1, padding: '12px', borderRadius: 10,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444', fontWeight: 700, fontSize: 14,
              cursor: responding ? 'wait' : 'pointer',
            }}
          >
            ❌ Decline
          </button>
        </div>
      )}

      {/* Decline confirmation */}
      {showDecline && (
        <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>Optional: Why are you declining?</div>
          <input
            value={declineReason}
            onChange={e => onDeclineReasonChange(e.target.value)}
            placeholder="Too far, wrong timing, etc."
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5f5f5', outline: 'none', marginBottom: 8 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onDeclineConfirm} disabled={responding} aria-label="Confirm Decline"
              style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
              {responding ? '...' : 'Confirm Decline'}
            </button>
            <button onClick={onDeclineCancel} aria-label="Cancel Decline"
              style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{value}</div>
    </div>
  );
}
