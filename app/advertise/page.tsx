'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const SURFACES = [
  { value: 'corridor', label: 'Corridor Sponsor', desc: 'Appear on a specific heavy haul route page', price: '$149/mo' },
  { value: 'country', label: 'Country Takeover', desc: 'Own all pages for a specific country', price: '$499/mo' },
  { value: 'leaderboard', label: 'Leaderboard Sponsor', desc: 'Top slot on the global corridor leaderboard', price: '$299/mo' },
  { value: 'tool', label: 'Tool Sponsor', desc: 'Sponsor a high-traffic calculator or tool page', price: '$199/mo' },
  { value: 'glossary', label: 'Glossary Sponsor', desc: 'Sponsor a glossary term or term family', price: '$99/mo' },
  { value: 'data_product', label: 'Data Product Slot', desc: 'Promote your service alongside intelligence data', price: '$249/mo' },
];

const DURATION_OPTIONS = [
  { value: '30', label: '1 month', multiplier: 1 },
  { value: '90', label: '3 months', multiplier: 2.7, badge: 'Save 10%' },
  { value: '180', label: '6 months', multiplier: 5.0, badge: 'Save 17%' },
];

function parseBasePrice(price: string): number {
  return parseInt(price.replace(/[^0-9]/g, ''), 10);
}

export default function AdvertisePage() {
  const params = useSearchParams();
  const router = useRouter();

  const [surface, setSurface] = useState(params.get('surface') ?? 'corridor');
  const [corridorSlug, setCorridorSlug] = useState(params.get('corridor') ?? '');
  const [countryCode, setCountryCode] = useState(params.get('country') ?? '');
  const [headline, setHeadline] = useState('');
  const [subline, setSubline] = useState('');
  const [ctaLabel, setCtaLabel] = useState('Learn More');
  const [ctaHref, setCtaHref] = useState('');
  const [duration, setDuration] = useState('30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedSurface = SURFACES.find(s => s.value === surface) ?? SURFACES[0];
  const selectedDuration = DURATION_OPTIONS.find(d => d.value === duration) ?? DURATION_OPTIONS[0];
  const basePrice = parseBasePrice(selectedSurface.price);
  const totalPrice = Math.round(basePrice * selectedDuration.multiplier);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/adgrid/book-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surface,
          corridor_slug: corridorSlug || null,
          country_code: countryCode || null,
          headline,
          subline,
          cta_label: ctaLabel,
          cta_href: ctaHref,
          duration_days: parseInt(duration, 10),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Booking failed');

      // Redirect to Stripe checkout
      if (json.checkout_url) {
        window.location.href = json.checkout_url;
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0d14] px-4">
        <div className="max-w-md text-center">
          <div className="text-5xl">✅</div>
          <h1 className="mt-4 text-2xl font-black text-white">Booking received!</h1>
          <p className="mt-2 text-sm text-white/50">You’ll receive a confirmation email once your ad is live.</p>
          <Link href="/corridors" className="mt-6 inline-flex rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-black hover:bg-amber-400 transition-colors">
            Browse Corridors
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <section className="border-b border-white/8 bg-gradient-to-b from-[#0f1420] to-[#0a0d14] px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-400">
            📢 AdGrid — Self-Serve Advertising
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight">
            Reach Heavy Haul Professionals
            <span className="block bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Where They Research</span>
          </h1>
          <p className="mt-3 text-white/60">Place your ad on corridor pages, country hubs, leaderboards, tools, and glossary surfaces across 120 countries.</p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Surface picker */}
          <div>
            <h2 className="mb-4 text-lg font-bold text-white">1. Choose ad surface</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {SURFACES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSurface(s.value)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    surface === s.value
                      ? 'border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/30'
                      : 'border-white/10 bg-white/4 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-white text-sm">{s.label}</p>
                    <span className="shrink-0 text-xs font-bold text-amber-400">{s.price}</span>
                  </div>
                  <p className="mt-1 text-xs text-white/40">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Geo targeting */}
          {(surface === 'corridor' || surface === 'country') && (
            <div>
              <h2 className="mb-4 text-lg font-bold text-white">2. Targeting</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {surface === 'corridor' && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-white/50">Corridor slug (optional)</label>
                    <input
                      type="text"
                      value={corridorSlug}
                      onChange={e => setCorridorSlug(e.target.value)}
                      placeholder="e.g. ksa-riyadh-to-neom"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-white/50">Country code (optional)</label>
                  <input
                    type="text"
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value.toUpperCase())}
                    placeholder="e.g. US, AU, DE"
                    maxLength={2}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Creative */}
          <div>
            <h2 className="mb-4 text-lg font-bold text-white">3. Ad creative</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-white/50">Headline <span className="text-red-400">*</span></label>
                <input
                  required
                  type="text"
                  maxLength={80}
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  placeholder="Find trusted pilot car operators in 24 hours"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-amber-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-white/50">Subline</label>
                <input
                  type="text"
                  maxLength={120}
                  value={subline}
                  onChange={e => setSubline(e.target.value)}
                  placeholder="Quick short sentence about your service"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-amber-500/50 focus:outline-none"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-white/50">CTA button label <span className="text-red-400">*</span></label>
                  <input
                    required
                    type="text"
                    maxLength={40}
                    value={ctaLabel}
                    onChange={e => setCtaLabel(e.target.value)}
                    placeholder="Get a Quote"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-white/50">Destination URL <span className="text-red-400">*</span></label>
                  <input
                    required
                    type="url"
                    value={ctaHref}
                    onChange={e => setCtaHref(e.target.value)}
                    placeholder="https://yoursite.com"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Duration + price */}
          <div>
            <h2 className="mb-4 text-lg font-bold text-white">4. Duration</h2>
            <div className="flex flex-wrap gap-3">
              {DURATION_OPTIONS.map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDuration(d.value)}
                  className={`relative rounded-xl border px-5 py-3 text-sm font-semibold transition-all ${
                    duration === d.value
                      ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                      : 'border-white/10 bg-white/4 text-white/60 hover:border-white/20'
                  }`}
                >
                  {d.label}
                  {d.badge && (
                    <span className="absolute -top-2 right-2 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {d.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/4 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">Total</span>
                <span className="text-2xl font-black text-white">${totalPrice.toLocaleString()}</span>
              </div>
              <p className="mt-1 text-xs text-white/30">
                {selectedSurface.label} · {selectedDuration.label} · {selectedSurface.price} base rate
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-500 py-4 text-base font-black text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Processing…' : `Book Ad — $${totalPrice.toLocaleString()}`}
          </button>

          <p className="text-center text-xs text-white/30">
            You’ll be redirected to secure Stripe checkout. Cancel anytime before the next billing period.
          </p>
        </form>
      </div>
    </main>
  );
}
