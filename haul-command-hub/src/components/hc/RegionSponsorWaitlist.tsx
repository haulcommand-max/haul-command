'use client';
import { useState, useEffect } from 'react';

interface RowSponsorWaitlistProps {
  country: string;
  regionName: string;
}

export function RegionSponsorWaitlist({ country, regionName }: RowSponsorWaitlistProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Storage key as requested: include country and regionName
  const storageKey = `hc-sponsor-waitlist-${country.toLowerCase()}-${regionName.replace(/\s+/g, '-').toLowerCase()}`;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'submitted' || stored === 'dismissed') {
        setDismissed(true);
      }
    }
  }, [storageKey]);

  if (dismissed || submitted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    try {
      // In a real implementation this would hit /api/alerts or /api/sponsor
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          alertType: 'sponsor_waitlist',
          contextKey: `sponsor-${country}-${regionName}`,
          countrySlug: country,
          tier: 'premium',
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        localStorage.setItem(storageKey, 'submitted');
        // Auto-dismiss after a few seconds
        setTimeout(() => setDismissed(true), 4000);
      }
    } catch {
      // Handle error gracefully
    } finally {
      setLoading(false);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem(storageKey, 'dismissed');
  }

  return (
    <div className="bg-gradient-to-r from-accent/[0.05] to-blue-500/[0.05] border border-accent/20 rounded-2xl p-6 relative overflow-hidden group">
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        ✕
      </button>

      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1">
          <div className="inline-block px-2 py-1 bg-accent/10 border border-accent/20 rounded text-[10px] font-bold text-accent uppercase tracking-widest mb-3">
            Sponsorship Available
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Dominate the {regionName} Market
          </h3>
          <p className="text-sm text-slate-400">
            Secure exclusive top-of-page placement for all {regionName} heavy haul queries.  
            Only 3 sponsor slots will be issued per region.
          </p>
        </div>

        <div className="w-full md:w-auto">
          {submitted ? (
            <div className="px-6 py-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 font-medium text-sm text-center min-w-[280px]">
              ✅ Added to Priority Waitlist
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 min-w-[280px]">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-accent/40 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-black px-5 py-3 rounded-xl font-bold text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join Sponsor Waitlist'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
