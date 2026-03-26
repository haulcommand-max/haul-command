'use client';

import React, { useState, useCallback } from 'react';
import {
  Elements, CardElement, useStripe, useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface BidSummary {
  bidId: string; loadId: string; operatorName: string;
  operatorStripeAccountId: string; bidAmountUsd: number;
  regionCode: string; loadDescription?: string;
}

interface Props { bid: BidSummary; onSuccess: (id: string) => void; onClose: () => void; }

const CARD_STYLE = {
  style: { base: { color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: '15px', '::placeholder': { color: '#555' } }, invalid: { color: '#f55' } },
};

function EscrowForm({ bid, onSuccess, onClose }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const platformFee = +(bid.bidAmountUsd * 0.15).toFixed(2);
  const operatorPayout = +(bid.bidAmountUsd * 0.85).toFixed(2);

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true); setErr(null);
    try {
      const res = await fetch('/api/escrow/accept-bid', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId: bid.bidId, loadId: bid.loadId, escortStripeAccountId: bid.operatorStripeAccountId, basePriceUsd: bid.bidAmountUsd, regionCode: bid.regionCode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      if (json.clientSecret) {
        const card = elements.getElement(CardElement);
        if (!card) throw new Error('Card missing');
        const result = await stripe.confirmCardSetup(json.clientSecret, { payment_method: { card } });
        if (result.error) throw new Error(result.error.message);
      }
      setDone(true); onSuccess(json.sessionId);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }, [stripe, elements, bid, onSuccess]);

  if (done) return (
    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔐</div>
      <h3 style={{ color: '#00c864', fontWeight: 700, fontSize: '22px', margin: '0 0 10px' }}>Funds Escrowed!</h3>
      <p style={{ color: '#aaa', fontSize: '14px', lineHeight: 1.6, marginBottom: '28px' }}>
        ${bid.bidAmountUsd.toFixed(2)} is held. Releases automatically on load completion.
      </p>
      <button onClick={onClose} style={{ padding: '14px 32px', background: 'linear-gradient(135deg,#00c864,#00a050)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>View Load</button>
    </div>
  );

  return (
    <form onSubmit={submit}>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '18px', marginBottom: '24px' }}>
        <div style={{ color: '#888', fontSize: '11px', fontWeight: 600, letterSpacing: '.05em', marginBottom: '12px' }}>ESCROW SUMMARY</div>
        {[['Operator', bid.operatorName], ['Bid Amount', `$${bid.bidAmountUsd.toFixed(2)}`]].map(([l, v]) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#aaa', fontSize: '14px' }}>{l}</span>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{v}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', marginTop: '8px' }}>
          {[['Platform fee (15%)', `$${platformFee.toFixed(2)}`], ['Operator payout (85%)', `$${operatorPayout.toFixed(2)}`]].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ color: '#555', fontSize: '12px' }}>{l}</span>
              <span style={{ color: '#555', fontSize: '12px' }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', background: 'rgba(255,140,0,0.08)', border: '1px solid rgba(255,140,0,0.2)', display: 'flex', gap: '8px' }}>
          <span>⚠️</span>
          <span style={{ color: '#ff8c00', fontSize: '12px' }}>Funds HELD — not charged until load is confirmed complete.</span>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: '#888', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '10px', letterSpacing: '.05em' }}>PAYMENT METHOD (Pre-Authorization Only)</label>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '14px' }}>
          <CardElement options={CARD_STYLE} />
        </div>
        <p style={{ color: '#555', fontSize: '11px', marginTop: '8px' }}>🔒 Pre-authorized via Stripe. No charge until load completes.</p>
      </div>

      {err && <div style={{ background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', color: '#f66', fontSize: '13px' }}>⚠️ {err}</div>}

      <button type="submit" disabled={!stripe || loading} style={{ width: '100%', padding: '16px', background: loading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#ff8c00,#ff6b00)', border: 'none', borderRadius: '14px', color: '#fff', fontWeight: 700, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: !loading ? '0 4px 20px rgba(255,140,0,0.3)' : 'none' }}>
        {loading ? <><div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin .7s linear infinite' }} />Securing Escrow...</> : <>🔐 Escrow Funds — ${bid.bidAmountUsd.toFixed(2)}</>}
      </button>
      <button type="button" onClick={onClose} style={{ width: '100%', padding: '12px', marginTop: '10px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#666', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </form>
  );
}

export default function StripeEscrowModal({ bid, onSuccess, onClose }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'linear-gradient(180deg,#111118,#0d0d15)', border: '1px solid rgba(255,255,255,0.08)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '28px 24px', width: '100%', maxWidth: '480px', maxHeight: '92vh', overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '20px', margin: 0 }}>🔐 Escrow Funds</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: '#888', cursor: 'pointer' }}>✕</button>
        </div>
        <Elements stripe={stripePromise}><EscrowForm bid={bid} onSuccess={onSuccess} onClose={onClose} /></Elements>
      </div>
    </div>
  );
}
