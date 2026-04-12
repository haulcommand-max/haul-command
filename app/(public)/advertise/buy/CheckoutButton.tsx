'use client';
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

export default function CheckoutButton({ 
  campaignId, 
  price, 
  color, 
  label, 
  href 
}: { 
  campaignId: string, 
  price: string, 
  color: string, 
  label: string,
  href: string 
}) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (campaignId === 'enterprise' || campaignId === 'territory') {
      // Keep original behavior (redirect)
      window.location.href = href;
      return;
    }

    try {
      setLoading(true);
      // Connect to the generic checkout route or stripe session creation
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: campaignId,
          priceId: campaignId === 'corridor' ? 'price_corridor_199' : 'price_cpc_deposit',
          amount: campaignId === 'corridor' ? 19900 : 5000,
          name: campaignId === 'corridor' ? 'Corridor Sponsorship' : 'CPC Campaign Deposit',
          successUrl: window.location.origin + '/dashboard/ads?success=true',
          cancelUrl: window.location.href,
        }),
      });

      if (response.ok) {
        const { sessionId } = await response.json();
        const stripe = await stripePromise;
        await stripe?.redirectToCheckout({ sessionId });
      } else {
        // Fallback or error handling
        console.error('Checkout failed');
        window.location.href = href;
      }
    } catch (e) {
       console.error(e);
       window.location.href = href;
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
        onClick={handleCheckout}
        disabled={loading}
        style={{
            display: 'block', width: '100%', textAlign: 'center', cursor: loading ? 'not-allowed' : 'pointer',
            padding: '12px 20px', borderRadius: 10,
            background: `${color}15`,
            border: `1px solid ${color}30`,
            color: color, fontWeight: 700, fontSize: 13,
            transition: 'all 0.2s',
        }}
    >
        {loading ? 'Routing to Stripe...' : `${label} â†’`}
    </button>
  );
}