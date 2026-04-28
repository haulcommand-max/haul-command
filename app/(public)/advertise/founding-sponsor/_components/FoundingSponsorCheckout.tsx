'use client';
import React, { useState } from 'react';

export default function FoundingSponsorCheckout({
    priceKey, label, color, successPath,
}: { priceKey: string; label: string; color: string; successPath: string }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClick = async () => {
        try {
            setLoading(true); setError(null);
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
            if (data.url) {
                window.location.href = data.url;
            } else if (data.error?.includes('not configured') || data.error?.includes('Price not configured')) {
                // Price not yet in Stripe — capture intent manually
                window.location.href = `/contact?subject=founding-sponsor&package=${priceKey}`;
            } else {
                throw new Error(data.error || 'Checkout unavailable');
            }
        } catch (e: any) {
            setError('Could not open checkout. Email sponsorship@haulcommand.com to proceed.');
            setLoading(false);
        }
    };

    return (
        <div>
            <button onClick={handleClick} disabled={loading} style={{
                display: 'block', width: '100%', padding: '13px 20px', borderRadius: 10,
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? 'rgba(255,255,255,0.04)' : color,
                color: '#000', fontWeight: 800, fontSize: 14,
                border: 'none', transition: 'all 0.2s', opacity: loading ? 0.7 : 1,
            }}>
                {loading ? 'Opening Stripe…' : `${label} →`}
            </button>
            {error && <p style={{ marginTop: 8, fontSize: 11, color: '#EF4444', textAlign: 'center' }}>{error}</p>}
        </div>
    );
}
