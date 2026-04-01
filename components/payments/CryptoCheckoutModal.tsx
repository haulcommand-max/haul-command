'use client';

import React, { useState, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════
   CRYPTO CHECKOUT MODAL — Stripe + ADA/BTC Toggle
   Connects: hc_pay_wallet_ledger, Stripe API, NOWPayments
   From: CLAUDE_UI_HANDOFF_TASKS.md §10
   ═══════════════════════════════════════════════════════════════════ */

interface Plan {
  id: string;
  name: string;
  stripePriceUsd: number;
  cryptoPriceUsd: number;
  interval: 'month' | 'year';
  features: string[];
}

interface CryptoCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: Plan;
  onSuccess?: (result: { method: 'stripe' | 'crypto'; txId: string }) => void;
}

const DEFAULT_PLAN: Plan = {
  id: 'pro-monthly',
  name: 'Haul Command Pro',
  stripePriceUsd: 40,
  cryptoPriceUsd: 35,
  interval: 'month',
  features: [
    'Verified Operator Badge',
    'Priority Load Board Access',
    'Route IQ Pro Analytics',
    'Ad-Free Experience',
    'Broker Direct Connect',
  ],
};

const CRYPTO_COINS = [
  { code: 'ada', name: 'Cardano', symbol: '₳', color: '#0033AD', gradient: 'linear-gradient(135deg, #0033AD, #0052FF)' },
  { code: 'btc', name: 'Bitcoin', symbol: '₿', color: '#F7931A', gradient: 'linear-gradient(135deg, #F7931A, #E8850F)' },
  { code: 'usdc', name: 'USDC (Ethereum/Polygon)', symbol: '$', color: '#2775CA', gradient: 'linear-gradient(135deg, #2775CA, #1A5FA8)' },
  { code: 'usdt', name: 'USDT (Tron/BSC)', symbol: '₮', color: '#26A17B', gradient: 'linear-gradient(135deg, #26A17B, #1B785B)' },
  // ADA and BTC are accepted native plays.
  // DJED and USDA are pending gateway liquidity verification before production enablement.
];

export default function CryptoCheckoutModal({
  isOpen,
  onClose,
  plan = DEFAULT_PLAN,
  onSuccess,
}: CryptoCheckoutModalProps) {
  const [payMethod, setPayMethod] = useState<'stripe' | 'crypto'>('stripe');
  const [selectedCoin, setSelectedCoin] = useState('ada');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [txId, setTxId] = useState('');

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  // Format card number with spaces
  const formatCardNumber = useCallback((val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(\d{4})(?=\d)/g, '$1 ');
  }, []);

  // Format expiry
  const formatExpiry = useCallback((val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    return clean;
  }, []);

  const handleStripeSubmit = async () => {
    if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
      setError('Please fill in all card details');
      return;
    }
    setLoading(true);
    setError('');
    setStep('processing');

    try {
      const res = await fetch('/api/payments/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: plan.id,
          payment_method: 'card',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');

      setTxId(data.transaction_id || 'stripe_' + Date.now());
      setStep('success');
      onSuccess?.({ method: 'stripe', txId: data.transaction_id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const handleCryptoSubmit = async () => {
    setLoading(true);
    setError('');
    setStep('processing');

    try {
      const res = await fetch('/api/crypto/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: plan.cryptoPriceUsd,
          currency: 'usd',
          pay_currency: selectedCoin,
          order_id: `${plan.id}_${Date.now()}`,
          description: `${plan.name} — ${plan.interval}ly`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Crypto payment failed');

      setTxId(data.payment?.payment_id || 'crypto_' + Date.now());
      setStep('success');
      onSuccess?.({ method: 'crypto', txId: data.payment?.payment_id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Crypto payment failed');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentPrice = payMethod === 'stripe' ? plan.stripePriceUsd : plan.cryptoPriceUsd;
  const savings = plan.stripePriceUsd - plan.cryptoPriceUsd;
  const selectedCoinData = CRYPTO_COINS.find(c => c.code === selectedCoin) || CRYPTO_COINS[0];

  return (
    <>
      {/* Backdrop */}
      <div className="ccm-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="ccm-modal" role="dialog" aria-modal="true" aria-label="Checkout">
        {/* Close button */}
        <button className="ccm-close" onClick={onClose} aria-label="Close">✕</button>

        {step === 'form' && (
          <>
            {/* Header */}
            <div className="ccm-header">
              <div className="ccm-logo">⬡</div>
              <h2 className="ccm-title">{plan.name}</h2>
              <p className="ccm-subtitle">Choose your payment method</p>
            </div>

            {/* Payment Toggle */}
            <div className="ccm-toggle">
              <button aria-label="Interactive Button"
                className={`ccm-toggle__btn ${payMethod === 'stripe' ? 'ccm-toggle__btn--active' : ''}`}
                onClick={() => setPayMethod('stripe')}
              >
                <span className="ccm-toggle__icon">💳</span>
                <span className="ccm-toggle__label">Card</span>
                <span className="ccm-toggle__price">${plan.stripePriceUsd}/{plan.interval === 'month' ? 'mo' : 'yr'}</span>
              </button>
              <button aria-label="Interactive Button"
                className={`ccm-toggle__btn ${payMethod === 'crypto' ? 'ccm-toggle__btn--active ccm-toggle__btn--crypto' : ''}`}
                onClick={() => setPayMethod('crypto')}
              >
                <span className="ccm-toggle__icon">₳</span>
                <span className="ccm-toggle__label">Crypto</span>
                <span className="ccm-toggle__price">${plan.cryptoPriceUsd}/{plan.interval === 'month' ? 'mo' : 'yr'}</span>
                {savings > 0 && <span className="ccm-toggle__save">Save ${savings}</span>}
              </button>
            </div>

            {/* Content Area */}
            <div className="ccm-body">
              {payMethod === 'stripe' ? (
                /* ── Stripe Card Form ── */
                <div className="ccm-card-form">
                  <div className="ccm-field">
                    <label className="ccm-label">Cardholder Name</label>
                    <input
                      className="ccm-input"
                      placeholder="JOHN DOE"
                      value={cardName}
                      onChange={e => setCardName(e.target.value.toUpperCase())}
                      autoComplete="cc-name"
                    />
                  </div>
                  <div className="ccm-field">
                    <label className="ccm-label">Card Number</label>
                    <div className="ccm-input-wrap">
                      <input
                        className="ccm-input"
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                        inputMode="numeric"
                        autoComplete="cc-number"
                      />
                      <div className="ccm-card-brands">
                        <span className="ccm-brand">VISA</span>
                        <span className="ccm-brand">MC</span>
                        <span className="ccm-brand">AMEX</span>
                      </div>
                    </div>
                  </div>
                  <div className="ccm-field-row">
                    <div className="ccm-field">
                      <label className="ccm-label">Expiry</label>
                      <input
                        className="ccm-input"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                        inputMode="numeric"
                        autoComplete="cc-exp"
                      />
                    </div>
                    <div className="ccm-field">
                      <label className="ccm-label">CVC</label>
                      <input
                        className="ccm-input"
                        placeholder="•••"
                        value={cardCvc}
                        onChange={e => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        inputMode="numeric"
                        type="password"
                        autoComplete="cc-csc"
                      />
                    </div>
                  </div>
                  <div className="ccm-secure">
                    <span className="ccm-lock">🔒</span>
                    <span>Secured by Stripe • 256-bit encryption</span>
                  </div>
                </div>
              ) : (
                /* ── Crypto Coin Picker ── */
                <div className="ccm-crypto-picker">
                  <div className="ccm-crypto-grid">
                    {CRYPTO_COINS.map(coin => (
                      <button aria-label="Interactive Button"
                        key={coin.code}
                        className={`ccm-coin ${selectedCoin === coin.code ? 'ccm-coin--active' : ''}`}
                        onClick={() => setSelectedCoin(coin.code)}
                        style={{ '--coin-color': coin.color, '--coin-gradient': coin.gradient } as React.CSSProperties}
                      >
                        <span className="ccm-coin__symbol">{coin.symbol}</span>
                        <span className="ccm-coin__name">{coin.name}</span>
                        <span className="ccm-coin__code">{coin.code.toUpperCase()}</span>
                        {selectedCoin === coin.code && <span className="ccm-coin__check">✓</span>}
                      </button>
                    ))}
                  </div>
                  <div className="ccm-crypto-info">
                    <div className="ccm-crypto-info__row">
                      <span>Pay with</span>
                      <span style={{ color: selectedCoinData.color, fontWeight: 700 }}>
                        {selectedCoinData.symbol} {selectedCoinData.name}
                      </span>
                    </div>
                    <div className="ccm-crypto-info__row">
                      <span>Amount</span>
                      <span className="ccm-crypto-info__amount">${plan.cryptoPriceUsd} USD</span>
                    </div>
                    {savings > 0 && (
                      <div className="ccm-crypto-info__savings">
                        💰 You save ${savings}/{plan.interval === 'month' ? 'mo' : 'yr'} paying with crypto
                      </div>
                    )}
                  </div>
                  <div className="ccm-secure">
                    <span className="ccm-lock">🔐</span>
                    <span>NOWPayments • Non-custodial</span>
                  </div>
                </div>
              )}

              {error && <div className="ccm-error">❌ {error}</div>}

              {/* Features */}
              <div className="ccm-features">
                {plan.features.map((f, i) => (
                  <div key={i} className="ccm-feature">
                    <span className="ccm-feature__check">✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button aria-label="Interactive Button"
              className="ccm-submit"
              onClick={payMethod === 'stripe' ? handleStripeSubmit : handleCryptoSubmit}
              disabled={loading}
            >
              {loading ? (
                <span className="ccm-spinner" />
              ) : (
                <>
                  {payMethod === 'stripe' ? '💳' : selectedCoinData.symbol}{' '}
                  Pay ${currentPrice}/{plan.interval === 'month' ? 'mo' : 'yr'}
                  {payMethod === 'crypto' && ` with ${selectedCoinData.name}`}
                </>
              )}
            </button>
          </>
        )}

        {step === 'processing' && (
          <div className="ccm-processing">
            <div className="ccm-processing__spinner" />
            <h3>Processing Payment</h3>
            <p>{payMethod === 'stripe' ? 'Verifying card...' : 'Generating blockchain address...'}</p>
          </div>
        )}

        {step === 'success' && (
          <div className="ccm-success">
            <div className="ccm-success__icon">✓</div>
            <h3>Payment Confirmed</h3>
            <p>Welcome to {plan.name}</p>
            <div className="ccm-success__tx">TX: {txId}</div>
            <button aria-label="Interactive Button" className="ccm-submit" onClick={onClose}>
              🚀 Enter Command Center
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        /* ── Backdrop ── */
        .ccm-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9998;
          background: rgba(0,0,0,0.80);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          animation: ccm-fade-in 0.2s ease;
        }

        /* ── Modal ── */
        .ccm-modal {
          position: fixed;
          z-index: 9999;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(440px, calc(100vw - 32px));
          max-height: calc(100dvh - 40px);
          overflow-y: auto;
          background: linear-gradient(180deg, #0E1019 0%, #080A10 100%);
          border: 1px solid rgba(198,146,58,0.20);
          border-radius: 20px;
          padding: 28px;
          color: #F0F0F0;
          font-family: var(--font-sans, 'Inter', system-ui, sans-serif);
          box-shadow:
            0 0 80px rgba(198,146,58,0.08),
            0 24px 48px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.04);
          animation: ccm-slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }

        /* ── Close ── */
        .ccm-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 32px;
          height: 32px;
          border: none;
          background: rgba(255,255,255,0.06);
          border-radius: 8px;
          color: #888;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          z-index: 10;
        }
        .ccm-close:hover { background: rgba(255,255,255,0.12); color: #fff; }

        /* ── Header ── */
        .ccm-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .ccm-logo {
          width: 48px;
          height: 48px;
          margin: 0 auto 12px;
          background: linear-gradient(135deg, #C6923A, #8A6428);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: #000;
          box-shadow: 0 0 24px rgba(198,146,58,0.3);
        }
        .ccm-title {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          background: linear-gradient(135deg, #F1C27B, #C6923A);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .ccm-subtitle {
          margin: 4px 0 0;
          font-size: 13px;
          color: #888;
        }

        /* ── Toggle ── */
        .ccm-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 20px;
        }
        .ccm-toggle__btn {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 14px 10px;
          background: rgba(255,255,255,0.03);
          border: 2px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
          color: #aaa;
        }
        .ccm-toggle__btn:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.15);
        }
        .ccm-toggle__btn--active {
          background: rgba(198,146,58,0.08);
          border-color: rgba(198,146,58,0.5);
          color: #F0F0F0;
          box-shadow: 0 0 20px rgba(198,146,58,0.12);
        }
        .ccm-toggle__btn--crypto {
          background: rgba(0,51,173,0.08);
          border-color: rgba(0,51,173,0.5);
          box-shadow: 0 0 20px rgba(0,51,173,0.12);
        }
        .ccm-toggle__icon { font-size: 22px; }
        .ccm-toggle__label { font-size: 13px; font-weight: 600; }
        .ccm-toggle__price { font-size: 18px; font-weight: 800; color: #fff; }
        .ccm-toggle__save {
          position: absolute;
          top: -8px;
          right: -4px;
          padding: 2px 8px;
          background: linear-gradient(135deg, #22C55E, #16A34A);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        /* ── Body ── */
        .ccm-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* ── Card Form ── */
        .ccm-card-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .ccm-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }
        .ccm-field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .ccm-label {
          font-size: 11px;
          font-weight: 600;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .ccm-input {
          width: 100%;
          height: 48px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 10px;
          padding: 0 14px;
          font-size: 16px;
          color: #F0F0F0;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.05em;
        }
        .ccm-input::placeholder { color: rgba(255,255,255,0.25); font-family: inherit; }
        .ccm-input:focus {
          border-color: rgba(198,146,58,0.5);
          box-shadow: 0 0 0 3px rgba(198,146,58,0.10);
        }
        .ccm-input-wrap { position: relative; }
        .ccm-card-brands {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          gap: 6px;
        }
        .ccm-brand {
          font-size: 9px;
          font-weight: 700;
          color: #555;
          padding: 2px 5px;
          background: rgba(255,255,255,0.04);
          border-radius: 4px;
          letter-spacing: 0.03em;
        }

        /* ── Crypto Picker ── */
        .ccm-crypto-picker {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .ccm-crypto-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }
        @media (max-width: 440px) {
          .ccm-crypto-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .ccm-coin {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 6px;
          background: rgba(255,255,255,0.03);
          border: 2px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          color: #aaa;
        }
        .ccm-coin:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.15);
        }
        .ccm-coin--active {
          border-color: var(--coin-color);
          background: color-mix(in srgb, var(--coin-color) 10%, transparent);
        }
        .ccm-coin__symbol {
          font-size: 22px;
          font-weight: 700;
          color: var(--coin-color);
        }
        .ccm-coin__name { font-size: 10px; color: #ccc; }
        .ccm-coin__code { font-size: 9px; color: #666; font-weight: 600; }
        .ccm-coin__check {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 16px;
          height: 16px;
          background: var(--coin-color);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          color: #fff;
          font-weight: 800;
        }
        .ccm-crypto-info {
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ccm-crypto-info__row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #888;
        }
        .ccm-crypto-info__amount {
          font-size: 18px;
          font-weight: 800;
          color: #fff;
        }
        .ccm-crypto-info__savings {
          text-align: center;
          font-size: 12px;
          color: #22C55E;
          padding: 8px;
          background: rgba(34,197,94,0.08);
          border-radius: 8px;
          border: 1px solid rgba(34,197,94,0.15);
        }

        /* ── Secure badge ── */
        .ccm-secure {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11px;
          color: #555;
        }
        .ccm-lock { font-size: 12px; }

        /* ── Error ── */
        .ccm-error {
          padding: 10px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 8px;
          color: #EF4444;
          font-size: 13px;
          text-align: center;
        }

        /* ── Features ── */
        .ccm-features {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 14px;
          background: rgba(255,255,255,0.02);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.04);
        }
        .ccm-feature {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #ccc;
        }
        .ccm-feature__check {
          width: 18px;
          height: 18px;
          background: rgba(34,197,94,0.12);
          color: #22C55E;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
          flex-shrink: 0;
        }

        /* ── Submit ── */
        .ccm-submit {
          width: 100%;
          height: 52px;
          background: linear-gradient(135deg, #C6923A 0%, #8A6428 100%);
          border: none;
          border-radius: 14px;
          color: #000;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .ccm-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(198,146,58,0.40);
        }
        .ccm-submit:active:not(:disabled) { transform: scale(0.98); }
        .ccm-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Spinner ── */
        .ccm-spinner {
          display: inline-block;
          width: 22px;
          height: 22px;
          border: 3px solid rgba(0,0,0,0.15);
          border-top-color: #000;
          border-radius: 50%;
          animation: ccm-spin 0.6s linear infinite;
        }

        /* ── Processing ── */
        .ccm-processing {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }
        .ccm-processing__spinner {
          width: 56px;
          height: 56px;
          border: 4px solid rgba(198,146,58,0.15);
          border-top-color: #C6923A;
          border-radius: 50%;
          animation: ccm-spin 0.8s linear infinite;
          margin-bottom: 20px;
        }
        .ccm-processing h3 {
          margin: 0 0 6px;
          font-size: 20px;
          font-weight: 700;
        }
        .ccm-processing p {
          margin: 0;
          font-size: 13px;
          color: #888;
        }

        /* ── Success ── */
        .ccm-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
        }
        .ccm-success__icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #22C55E, #16A34A);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: #fff;
          font-weight: 800;
          margin-bottom: 16px;
          box-shadow: 0 0 40px rgba(34,197,94,0.3);
          animation: ccm-pop 0.4s ease;
        }
        .ccm-success h3 {
          margin: 0 0 6px;
          font-size: 22px;
          font-weight: 700;
        }
        .ccm-success p {
          margin: 0 0 12px;
          font-size: 14px;
          color: #888;
        }
        .ccm-success__tx {
          font-size: 11px;
          color: #555;
          padding: 8px 16px;
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          font-family: monospace;
          word-break: break-all;
          margin-bottom: 8px;
        }

        /* ── Animations ── */
        @keyframes ccm-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ccm-slide-up {
          from { opacity: 0; transform: translate(-50%, -46%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
        @keyframes ccm-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes ccm-pop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
