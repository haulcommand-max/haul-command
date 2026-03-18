'use client';
import { useState } from 'react';

interface AlertSignupModuleProps {
  context: string;
  title?: string;
  alertType?: string;
  contextKey?: string;
  countrySlug?: string;
  corridorSlug?: string;
  serviceSlug?: string;
  showPremiumTier?: boolean;
}

export function HCAlertSignupModule({
  context,
  title,
  alertType = 'market',
  contextKey,
  countrySlug,
  corridorSlug,
  serviceSlug,
  showPremiumTier = false,
}: AlertSignupModuleProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [tier, setTier] = useState<'free' | 'premium'>('free');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          alertType,
          contextKey: contextKey ?? context,
          countrySlug,
          corridorSlug,
          serviceSlug,
          tier,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-500/[0.04] border border-green-500/10 rounded-2xl p-6 mb-8">
        <div className="text-center">
          <p className="text-green-400 font-bold text-sm">✅ You&apos;re on the list!</p>
          <p className="text-gray-500 text-xs mt-1">We&apos;ll notify you when {context} data becomes available.</p>
          {tier === 'premium' && (
            <p className="text-accent text-xs mt-2 font-medium">🌟 Premium tier — you&apos;ll get priority notifications and intelligence reports.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-8">
      <h3 className="text-sm font-bold text-white mb-2">{title ?? `Get Alerts for ${context}`}</h3>
      <p className="text-xs text-gray-500 mb-4">Be first to know when new data, operators, or rates appear in this market.</p>

      {showPremiumTier && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTier('free')}
            className={`flex-1 text-xs font-bold py-2 rounded-lg border transition-all ${
              tier === 'free'
                ? 'border-accent/30 bg-accent/10 text-accent'
                : 'border-white/10 bg-white/[0.02] text-gray-500 hover:text-white'
            }`}
          >
            Free Alerts
          </button>
          <button
            onClick={() => setTier('premium')}
            className={`flex-1 text-xs font-bold py-2 rounded-lg border transition-all ${
              tier === 'premium'
                ? 'border-accent/30 bg-accent/10 text-accent'
                : 'border-white/10 bg-white/[0.02] text-gray-500 hover:text-white'
            }`}
          >
            🌟 Premium
          </button>
        </div>
      )}

      {tier === 'premium' && showPremiumTier && (
        <div className="bg-accent/[0.04] border border-accent/10 rounded-lg p-3 mb-4">
          <p className="text-[10px] text-accent font-medium mb-1">Premium includes:</p>
          <ul className="text-[10px] text-gray-400 space-y-0.5">
            <li>→ Priority notifications (1h ahead of free tier)</li>
            <li>→ Rate movement alerts with context</li>
            <li>→ Weekly corridor intelligence digest</li>
            <li>→ Compliance change alerts</li>
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={loading}
          className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-accent/40 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-accent text-black px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-yellow-400 transition-colors flex-shrink-0 disabled:opacity-50"
        >
          {loading ? '...' : 'Notify Me'}
        </button>
      </form>

      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </section>
  );
}
