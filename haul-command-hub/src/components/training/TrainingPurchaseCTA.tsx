'use client';

import { useState } from 'react';
import { ShoppingCart, Loader2 } from 'lucide-react';

interface TrainingPurchaseCTAProps {
  levelSlug: string;
  levelName: string;
  priceUsd: number;
  priceLabel: string;
  variant?: 'primary' | 'secondary';
}

export default function TrainingPurchaseCTA({
  levelSlug,
  levelName,
  priceUsd,
  priceLabel,
  variant = 'primary',
}: TrainingPurchaseCTAProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/training-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: levelSlug,
          course_name: `${levelName} Certification`,
          price_usd: priceUsd,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Checkout failed');
      if (data.url) window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed
          ${variant === 'primary'
            ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/20'
            : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
          }`}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <ShoppingCart size={16} />
        )}
        {loading ? 'Redirecting to checkout…' : `Enroll — ${priceLabel}`}
      </button>
      {error && (
        <p className="text-xs text-red-400 text-center">{error}</p>
      )}
      <p className="text-[10px] text-gray-600 text-center">
        Secure checkout via Stripe. Haul Command on-platform credential.
      </p>
    </div>
  );
}
