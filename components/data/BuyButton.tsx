'use client';

import { useState } from 'react';

interface BuyButtonProps {
  productId: string;
  productName: string;
  price: string;
  purchaseType: 'one_time' | 'subscription' | 'metered';
  tierRequired?: string;
}

export default function BuyButton({ productId, productName, price, purchaseType, tierRequired }: BuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);

  const isEnterprise = tierRequired === 'enterprise';

  async function handleCheckout() {
    if (!email) {
      setShowEmailInput(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/data/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: productId,
          email,
          billing_interval: purchaseType === 'subscription' ? 'monthly' : undefined,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (isEnterprise) {
    return (
      <a
        href="/contact?ref=data-enterprise"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.625rem 1.25rem',
          borderRadius: '0.75rem',
          fontWeight: 700,
          fontSize: '0.8125rem',
          background: 'rgba(212,168,67,0.10)',
          border: '1px solid rgba(212,168,67,0.25)',
          color: '#D4A843',
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
        }}
      >
        Request Access →
      </a>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {showEmailInput && !loading && (
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCheckout()}
          autoFocus
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(0,0,0,0.4)',
            color: '#E5E7EB',
            fontSize: '0.8125rem',
            outline: 'none',
            width: '100%',
          }}
        />
      )}
      <button
        onClick={handleCheckout}
        disabled={loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.625rem 1.5rem',
          borderRadius: '0.75rem',
          fontWeight: 700,
          fontSize: '0.8125rem',
          background: loading
            ? 'rgba(59,130,246,0.3)'
            : 'linear-gradient(135deg, #3b82f6, #2563eb)',
          border: 'none',
          color: '#fff',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <span>Processing…</span>
        ) : showEmailInput && email ? (
          <span>Proceed to Checkout</span>
        ) : (
          <span>Buy Now — {price}</span>
        )}
      </button>
    </div>
  );
}
