'use client';
import React, { useState } from 'react';

/**
 * CheckoutButton — wired to /api/stripe/checkout
 *
 * Route expects: { priceKey, mode?, successUrl?, cancelUrl? }
 * Route returns:  { url }  — redirect to Stripe-hosted checkout
 *
 * FIXED: Previous version sent { planId, priceId, amount, name } — contract mismatch.
 * Now sends correct { priceKey } and redirects via window.location.href = data.url
 */

const CAMPAIGN_TO_PRICE_KEY: Record<string, string> = {
    corridor:        'corridor_sponsor_monthly',
    territory:       'territory_sponsor_monthly',
    cpc:             'cpc_deposit',
    founding_bronze: 'founding_sponsor_bronze',
    founding_silver: 'founding_sponsor_silver',
    founding_gold:   'founding_sponsor_gold',
};

export default function CheckoutButton({
    campaignId,
    price,
    color,
    label,
    href,
    priceKeyOverride,
    successPath = '/dashboard/ads?success=true',
}: {
    campaignId: string;
    price: string;
    color: string;
    label: string;
    href: string;
    priceKeyOverride?: string;
    successPath?: string;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckout = async () => {
        if (campaignId === 'enterprise') {
            window.location.href = href;
            return;
        }

        const priceKey = priceKeyOverride || CAMPAIGN_TO_PRICE_KEY[campaignId];

        if (!priceKey) {
            window.location.href = href;
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceKey,
                    successUrl: window.location.origin + successPath,
                    cancelUrl: window.location.href,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.url) {
                if (data.error?.includes('not configured') || data.error?.includes('Price not configured')) {
                    window.location.href = '/contact?subject=campaign-inquiry&type=' + campaignId;
                    return;
                }
                throw new Error(data.error || 'Checkout failed');
            }

            window.location.href = data.url;
        } catch (e: any) {
            console.error('[CheckoutButton]', e);
            setError('Could not open checkout. Please try again or contact us.');
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                onClick={handleCheckout}
                disabled={loading}
                style={{
                    display: 'block', width: '100%', textAlign: 'center',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    padding: '12px 20px', borderRadius: 10,
                    background: loading ? 'rgba(255,255,255,0.04)' : `${color}15`,
                    border: `1px solid ${color}30`,
                    color: loading ? '#6B7280' : color,
                    fontWeight: 700, fontSize: 13,
                    transition: 'all 0.2s',
                    opacity: loading ? 0.7 : 1,
                }}
            >
                {loading ? 'Opening Stripe…' : `${label} →`}
            </button>
            {error && (
                <p style={{ marginTop: 8, fontSize: 11, color: '#EF4444', textAlign: 'center' }}>
                    {error}
                </p>
            )}
        </div>
    );
}
