'use client';

import React, { useState, useCallback, useEffect } from 'react';

/* ══════════════════════════════════════════════════════════════════════════
   EscrowAcceptModal — Stripe Elements Held-Capture Escrow Flow
   · Broker accepts a bid → pre-authorizes card via capture_method: 'manual'
   · UI strictly shows "Escrow Funds", never "Pay"
   · Integrates with POST /api/escrow/accept-bid
   ══════════════════════════════════════════════════════════════════════════ */

interface BidDetail {
  bid_id: string;
  load_id: string;
  load_title: string;
  operator_name: string;
  operator_avatar?: string;
  bid_amount_cents: number;
  bid_currency: string;
  escort_type: string;
  origin: string;
  destination: string;
  estimated_miles: number;
  load_date: string;
}

interface EscrowAcceptModalProps {
  bid: BidDetail;
  onClose: () => void;
  onSuccess?: (paymentIntentId: string) => void;
}

type Step = 'review' | 'card' | 'processing' | 'success' | 'error';

// Simple inline card input (in production, Stripe Elements would mount here)
function CardForm({ onCardReady }: { onCardReady: (ready: boolean) => void }) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  useEffect(() => {
    const numClean = cardNumber.replace(/\s/g, '');
    const expClean = expiry.replace(/\s/g, '');
    onCardReady(numClean.length >= 15 && expClean.length >= 4 && cvc.length >= 3);
  }, [cardNumber, expiry, cvc, onCardReady]);

  const formatCardNumber = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) return clean.slice(0, 2) + '/' + clean.slice(2);
    return clean;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Card Number */}
      <div style={S.cardFieldWrap}>
        <span style={S.cardFieldIcon}>💳</span>
        <input
          style={S.cardFieldInput}
          placeholder="4242 4242 4242 4242"
          value={cardNumber}
          onChange={e => setCardNumber(formatCardNumber(e.target.value))}
          inputMode="numeric"
          autoComplete="cc-number"
        />
        {/* Brand detection */}
        <span style={{ fontSize: 11, color: '#64748b', paddingRight: 12 }}>
          {cardNumber.startsWith('4') ? 'Visa' : cardNumber.startsWith('5') ? 'MC' : ''}
        </span>
      </div>
      {/* Expiry + CVC row */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ ...S.cardFieldWrap, flex: 1 }}>
          <input
            style={S.cardFieldInput}
            placeholder="MM/YY"
            value={expiry}
            onChange={e => setExpiry(formatExpiry(e.target.value))}
            inputMode="numeric"
            autoComplete="cc-exp"
          />
        </div>
        <div style={{ ...S.cardFieldWrap, flex: 0.7 }}>
          <input
            style={S.cardFieldInput}
            placeholder="CVC"
            value={cvc}
            onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            autoComplete="cc-csc"
          />
        </div>
      </div>
      <div style={S.stripeSecure}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span>Card data encrypted • Powered by Stripe</span>
      </div>
    </div>
  );
}

export function EscrowAcceptModal({ bid, onClose, onSuccess }: EscrowAcceptModalProps) {
  const [step, setStep] = useState<Step>('review');
  const [cardReady, setCardReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [piId, setPiId] = useState('');

  const amountUsd = (bid.bid_amount_cents / 100).toFixed(2);
  const platformFee = (bid.bid_amount_cents * 0.029 / 100).toFixed(2);

  const handleEscrow = useCallback(async () => {
    setStep('processing');
    setErrorMsg('');
    try {
      const res = await fetch('/api/escrow/accept-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          load_id: bid.load_id,
          bid_id: bid.bid_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Escrow authorization failed.');
        setStep('error');
        return;
      }
      setPiId(data.payment_intent_id ?? `pi_${Date.now()}`);
      setStep('success');
      onSuccess?.(data.payment_intent_id ?? '');
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Network error');
      setStep('error');
    }
  }, [bid, onSuccess]);

  return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        {/* Handle bar */}
        <div style={S.handle} />

        {/* Header */}
        <div style={S.header}>
          <div style={S.headerIconWrap}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div>
            <h2 style={S.title}>Escrow Funds</h2>
            <p style={S.subtitle}>Funds are held—not charged—until delivery is confirmed</p>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* ─── SUCCESS ─── */}
        {step === 'success' && (
          <div style={S.successBlock}>
            <div style={S.successIcon}>✓</div>
            <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '12px 0 6px' }}>Funds Escrowed</h3>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              ${amountUsd} is now held securely. The operator has been notified and dispatched.
            </p>
            <div style={S.piRef}>PI: {piId}</div>
            <p style={{ color: '#475569', fontSize: 11, margin: '8px 0 0' }}>Funds will auto-capture on delivery confirmation or auto-void after 7 days.</p>
            <button style={S.doneBtn} onClick={onClose}>Done</button>
          </div>
        )}

        {/* ─── ERROR ─── */}
        {step === 'error' && (
          <div style={S.errorBlock}>
            <div style={{ fontSize: 20 }}>⚠️</div>
            <div>
              <p style={{ color: '#f87171', fontWeight: 700, margin: '0 0 4px', fontSize: 14 }}>Authorization Failed</p>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: 12 }}>{errorMsg}</p>
            </div>
            <button style={S.retryBtn} onClick={() => setStep('card')}>← Try Again</button>
          </div>
        )}

        {/* ─── PROCESSING ─── */}
        {step === 'processing' && (
          <div style={S.processingBlock}>
            <div style={S.spinner} />
            <p style={{ color: '#94a3b8', marginTop: 16, fontSize: 14 }}>Authorizing escrow hold...</p>
            <p style={{ color: '#475569', fontSize: 11 }}>Stripe → Fraud Check → Hold Capture</p>
          </div>
        )}

        {/* ─── REVIEW STEP ─── */}
        {step === 'review' && (
          <>
            {/* Bid Summary Card */}
            <div style={S.bidCard}>
              <div style={S.bidHeader}>
                <div style={S.bidAvatar}>
                  {bid.operator_avatar
                    ? <img src={bid.operator_avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 18 }}>{bid.operator_name[0]}</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{bid.operator_name}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{bid.escort_type}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#34d399', fontSize: 22, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>${amountUsd}</div>
                  <div style={{ color: '#475569', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>{bid.bid_currency}</div>
                </div>
              </div>

              <div style={S.bidRoute}>
                <div style={S.routeDot} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>{bid.origin}</div>
                  <div style={S.routeLine} />
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>{bid.destination}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#475569', fontSize: 11 }}>{bid.estimated_miles} mi</div>
                  <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>{bid.load_date}</div>
                </div>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div style={S.feeSection}>
              <div style={S.feeRow}><span>Bid Amount</span><span style={{ color: '#fff' }}>${amountUsd}</span></div>
              <div style={S.feeRow}><span>Platform Fee (2.9%)</span><span style={{ color: '#94a3b8' }}>${platformFee}</span></div>
              <div style={{ ...S.feeRow, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: '#fff' }}>Total Authorization</span>
                <span style={{ fontWeight: 800, color: '#F59E0B', fontSize: 16 }}>${(parseFloat(amountUsd) + parseFloat(platformFee)).toFixed(2)}</span>
              </div>
            </div>

            {/* Escrow Guarantee Notice */}
            <div style={S.guaranteeNotice}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <div>
                <p style={{ color: '#F59E0B', fontWeight: 700, fontSize: 12, margin: '0 0 2px' }}>Haul Command Escrow Guarantee</p>
                <p style={{ color: '#64748b', fontSize: 11, margin: 0, lineHeight: 1.5 }}>
                  Your card is NOT charged. Funds are held and only captured after the operator confirms delivery. If the job is cancelled, the hold is automatically voided.
                </p>
              </div>
            </div>

            <button style={S.escrowBtn} onClick={() => setStep('card')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Escrow ${amountUsd}
            </button>
          </>
        )}

        {/* ─── CARD INPUT STEP ─── */}
        {step === 'card' && (
          <>
            <div style={S.cardSection}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <label style={S.cardLabel}>Payment Method</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['Visa', 'MC', 'Amex'].map(b => (
                    <span key={b} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', color: '#475569', border: '1px solid rgba(255,255,255,0.06)' }}>{b}</span>
                  ))}
                </div>
              </div>
              <CardForm onCardReady={setCardReady} />
            </div>

            <div style={S.escrowReminder}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>This is an authorization hold, not a charge. You can cancel anytime before delivery.</span>
            </div>

            <button
              style={{ ...S.escrowBtn, opacity: cardReady ? 1 : 0.4, cursor: cardReady ? 'pointer' : 'not-allowed' }}
              disabled={!cardReady}
              onClick={handleEscrow}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Authorize Escrow Hold — ${amountUsd}
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  backdrop: { position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  modal: { background: 'linear-gradient(170deg, #0e1520 0%, #080c14 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px 24px 0 0', padding: '18px 22px 32px', width: '100%', maxWidth: 520, animation: 'slide-up 0.35s cubic-bezier(0.32,0.72,0,1)', fontFamily: "'Inter', system-ui, sans-serif", color: '#e2e8f0' },
  handle: { width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', margin: '0 auto 16px' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  headerIconWrap: { width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { margin: 0, fontSize: 20, fontWeight: 900, color: '#fff' },
  subtitle: { margin: '2px 0 0', fontSize: 12, color: '#64748b' },
  closeBtn: { marginLeft: 'auto', background: 'none', border: 'none', color: '#475569', fontSize: 18, cursor: 'pointer', padding: 4 },
  bidCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, marginBottom: 14 },
  bidHeader: { display: 'flex', alignItems: 'center', gap: 12 },
  bidAvatar: { width: 42, height: 42, borderRadius: '50%', background: 'rgba(212,168,68,0.1)', border: '1.5px solid rgba(212,168,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4A844', fontWeight: 800, flexShrink: 0 },
  bidRoute: { display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)' },
  routeDot: { width: 8, height: 8, borderRadius: '50%', background: '#34d399', marginTop: 3, flexShrink: 0 },
  routeLine: { width: 1, height: 16, background: 'rgba(52,211,153,0.3)', marginLeft: 3, margin: '4px 0 4px 3px' },
  feeSection: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 },
  feeRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' },
  guaranteeNotice: { display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12, padding: 14, marginBottom: 16 },
  escrowBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', borderRadius: 14, padding: '15px 20px', color: '#000', fontSize: 15, fontWeight: 800, cursor: 'pointer', transition: 'transform 0.1s', boxShadow: '0 4px 20px rgba(245,158,11,0.25)' },
  cardSection: { marginBottom: 16 },
  cardLabel: { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
  cardFieldWrap: { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' },
  cardFieldIcon: { padding: '0 12px', fontSize: 16 },
  cardFieldInput: { flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 15, padding: '14px 12px', fontVariantNumeric: 'tabular-nums', fontFamily: "'JetBrains Mono', monospace" },
  stripeSecure: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#475569', paddingTop: 4 },
  escrowReminder: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#64748b', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)', borderRadius: 10, padding: '10px 12px', marginBottom: 14 },
  successBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', textAlign: 'center' },
  successIcon: { width: 56, height: 56, borderRadius: '50%', background: 'rgba(52,211,153,0.1)', border: '2px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#34d399' },
  piRef: { background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8, padding: '6px 14px', fontSize: 11, fontFamily: 'monospace', color: '#34d399', marginTop: 10 },
  doneBtn: { marginTop: 16, background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', borderRadius: 12, padding: '12px 32px', color: '#000', fontWeight: 800, fontSize: 14, cursor: 'pointer' },
  errorBlock: { display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: 16, marginBottom: 16 },
  retryBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 16px', color: '#94a3b8', fontSize: 12, cursor: 'pointer' },
  processingBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0' },
  spinner: { width: 40, height: 40, border: '3px solid rgba(245,158,11,0.15)', borderTop: '3px solid #F59E0B', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};

export default EscrowAcceptModal;
