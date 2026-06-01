'use client';

import React, { useState } from 'react';

const CAMPAIGN_TO_PRICE_KEY: Record<string, string> = {
    corridor: 'corridor_sponsor_monthly',
    territory: 'territory_sponsor_monthly',
    cpc: 'cpc_deposit',
    founding_bronze: 'founding_sponsor_bronze',
    founding_silver: 'founding_sponsor_silver',
    founding_gold: 'founding_sponsor_gold',
};

function shouldFallbackToContact(data: { error?: string; reason?: string } | null): boolean {
    const error = data?.error ?? '';
    const reason = data?.reason ?? '';
    return (
        error.includes('not configured') ||
        error.includes('Price not configured') ||
        error.includes('temporarily unavailable') ||
        reason === 'payments_disabled' ||
        reason === 'production_test_keys_blocked' ||
        reason === 'stripe_keys_missing' ||
        reason === 'stripe_misconfigured'
    );
}

export default function CheckoutButton({
    campaignId,
    color,
    label,
    href,
    context,
    priceKeyOverride,
    successPath = '/dashboard/ads?success=true',
}: {
    campaignId: string;
    price: string;
    color: string;
    label: string;
    href: string;
    context?: Record<string, string | undefined>;
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
                    sponsorContext: context,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.url) {
                if (shouldFallbackToContact(data)) {
                    const params = new URLSearchParams({
                        subject: 'campaign-inquiry',
                        type: campaignId,
                        priceKey,
                    });
                    if (data.reason) params.set('reason', data.reason);
                    window.location.href = `/contact?${params.toString()}`;
                    return;
                }
                throw new Error(data.error || 'Checkout failed');
            }

            window.location.href = data.url;
        } catch (e: unknown) {
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
                    display: 'block',
                    width: '100%',
                    textAlign: 'center',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    padding: '12px 20px',
                    borderRadius: 8,
                    background: loading ? 'rgba(255,255,255,0.04)' : `${color}18`,
                    border: `1px solid ${color}45`,
                    color: loading ? '#6B7280' : color,
                    fontWeight: 800,
                    fontSize: 13,
                    transition: 'all 0.2s',
                    opacity: loading ? 0.7 : 1,
                }}
            >
                {loading ? 'Opening Stripe...' : `${label} ->`}
            </button>
            {error && (
                <p style={{ marginTop: 8, fontSize: 11, color: '#EF4444', textAlign: 'center' }}>
                    {error}
                </p>
            )}
        </div>
    );
}
