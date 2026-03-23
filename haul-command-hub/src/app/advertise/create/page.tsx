'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useState } from 'react';

/* ══════════════════════════════════════════════════════
   ADGRID — Self-Serve Campaign Creator
   4-step wizard: Ad Type → Targeting → Budget → Payment
   ══════════════════════════════════════════════════════ */

const AD_TYPES = [
  { id: 'sponsored_listing', icon: '🏢', name: 'Sponsored Operator Listing', desc: 'Boost your operator listing to the top of search results in selected corridors.' },
  { id: 'banner_ad', icon: '🖼️', name: 'Banner Ad', desc: 'Display banner ads on directory, load board, and corridor pages.' },
  { id: 'corridor_sponsor', icon: '🛤️', name: 'Corridor Sponsor', desc: 'Exclusive sponsorship of a corridor page — your brand front and center.' },
  { id: 'data_sponsor', icon: '📊', name: 'Data Sponsor', desc: 'Sponsor rate intelligence, requirements, or analytics pages.' },
];

const SAMPLE_CORRIDORS = [
  'I-10 Gulf Coast', 'I-95 East Coast', 'I-40 Southern Cross', 'I-80 Northern',
  'I-35 Central', 'I-75 Southeast', 'I-5 West Coast', 'I-20 Southern',
  'I-90 Northern Cross', 'I-70 Heartland', 'I-65 Mid-South', 'I-30 Southwest',
];

const DURATIONS = [
  { days: 7, label: '7 days', multiplier: 1 },
  { days: 30, label: '30 days', multiplier: 0.9 },
  { days: 90, label: '90 days', multiplier: 0.8 },
];

export default function AdGridCreatePage() {
  const [step, setStep] = useState(1);
  const [adType, setAdType] = useState('');
  const [corridors, setCorridors] = useState<string[]>([]);
  const [audience, setAudience] = useState('both');
  const [dailyBudget, setDailyBudget] = useState(50);
  const [duration, setDuration] = useState(30);

  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const durationConfig = DURATIONS.find(d => d.days === duration) ?? DURATIONS[1];
  const totalSpend = Math.round(dailyBudget * duration * durationConfig.multiplier);
  const estImpressions = Math.round(dailyBudget * 12 * duration);

  function toggleCorridor(c: string) {
    setCorridors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }

  async function handlePayment() {
    if (!companyName || !contactEmail) {
      alert('Please enter your company name and email.');
      return;
    }
    try {
      const res = await fetch('/api/adgrid/campaign-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          contactEmail,
          adType,
          durationDays: duration,
          targetCorridors: corridors,
          targetCountries: [],
          targetAudience: audience,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || 'Failed to create checkout session.');
    } catch {
      alert('Failed to create checkout session. Please try again.');
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/advertise/dashboard" className="hover:text-accent">Advertise</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Create Campaign</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-2">
          Create <span className="text-accent">Campaign</span>
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          Reach pilot car operators and brokers across the Haul Command network.
        </p>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 mb-10">
          {['Ad Type', 'Targeting', 'Budget', 'Payment'].map((label, i) => (
            <div key={label} className="flex-1 flex items-center gap-1">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                i + 1 === step
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : i + 1 < step
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-white/[0.02] text-gray-600'
              }`}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">
                  {i + 1 < step ? '✓' : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < 3 && <div className="flex-grow h-px bg-white/5 mx-1" />}
            </div>
          ))}
        </div>

        {/* Step 1: Ad Type */}
        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-white font-bold text-lg mb-4">Select Ad Type</h2>
            {AD_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => { setAdType(type.id); setStep(2); }}
                className={`w-full text-left bg-white/[0.02] border rounded-xl p-5 hover:border-accent/30 hover:bg-accent/[0.02] transition-all group ${
                  adType === type.id ? 'border-accent/40 bg-accent/[0.03]' : 'border-white/[0.06]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <h3 className="text-white font-semibold text-sm group-hover:text-accent transition-colors">{type.name}</h3>
                    <p className="text-gray-500 text-xs mt-1">{type.desc}</p>
                  </div>
                  <span className="ml-auto text-gray-600 group-hover:text-accent text-xl">→</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Targeting */}
        {step === 2 && (
          <div>
            <h2 className="text-white font-bold text-lg mb-4">Select Targeting</h2>

            <div className="mb-6">
              <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-3">Corridors</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SAMPLE_CORRIDORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleCorridor(c)}
                    className={`text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      corridors.includes(c)
                        ? 'bg-accent/10 text-accent border border-accent/30'
                        : 'bg-white/[0.03] text-gray-400 border border-white/[0.06] hover:border-accent/20'
                    }`}
                  >
                    {corridors.includes(c) && '✓ '}{c}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-3">Audience</h3>
              <div className="flex gap-2">
                {['operators', 'brokers', 'both'].map((a) => (
                  <button
                    key={a}
                    onClick={() => setAudience(a)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                      audience === a
                        ? 'bg-accent text-black'
                        : 'bg-white/[0.04] text-gray-400 border border-white/[0.08] hover:border-accent/20'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white border border-white/10 transition-all">← Back</button>
              <button onClick={() => setStep(3)} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-accent text-black hover:bg-yellow-500 transition-colors">Continue →</button>
            </div>
          </div>
        )}

        {/* Step 3: Budget & Duration */}
        {step === 3 && (
          <div>
            <h2 className="text-white font-bold text-lg mb-6">Budget & Duration</h2>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-400 text-xs uppercase tracking-widest">Daily Budget</h3>
                <span className="text-accent font-bold text-lg">${dailyBudget}/day</span>
              </div>
              <input
                type="range"
                min={10}
                max={500}
                step={10}
                value={dailyBudget}
                onChange={(e) => setDailyBudget(Number(e.target.value))}
                className="w-full accent-[#f59f0a] h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>$10</span><span>$500</span>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-3">Duration</h3>
              <div className="flex gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.days}
                    onClick={() => setDuration(d.days)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                      duration === d.days
                        ? 'bg-accent text-black font-bold'
                        : 'bg-white/[0.04] text-gray-400 border border-white/[0.08] hover:border-accent/20'
                    }`}
                  >
                    {d.label}
                    {d.multiplier < 1 && (
                      <span className={`block text-[10px] mt-0.5 ${duration === d.days ? 'text-black/60' : 'text-green-400'}`}>
                        {Math.round((1 - d.multiplier) * 100)}% off
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-400 text-sm">Total Spend</span>
                <span className="text-white font-black text-2xl">${totalSpend.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-400 text-sm">Est. Impressions</span>
                <span className="text-accent font-bold">{estImpressions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Est. CPM</span>
                <span className="text-gray-300">${(totalSpend / estImpressions * 1000).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white border border-white/10 transition-all">← Back</button>
              <button onClick={() => setStep(4)} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-accent text-black hover:bg-yellow-500 transition-colors">Continue to Payment →</button>
            </div>
          </div>
        )}

        {/* Step 4: Payment */}
        {step === 4 && (
          <div className="text-center">
            <h2 className="text-white font-bold text-lg mb-6">Review & Pay</h2>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 mb-6 text-left max-w-md mx-auto">
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-gray-500 text-[10px] mb-1.5">Company Name</label>
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your Company" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50" />
                </div>
                <div>
                  <label className="block text-gray-500 text-[10px] mb-1.5">Email</label>
                  <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} type="email" placeholder="you@company.com" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50" />
                </div>
              </div>
              <div className="space-y-3 text-sm border-t border-white/[0.06] pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Ad Type</span>
                  <span className="text-white font-medium">{AD_TYPES.find(t => t.id === adType)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Corridors</span>
                  <span className="text-white font-medium">{corridors.length || 'All'} selected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Audience</span>
                  <span className="text-white font-medium capitalize">{audience}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-white font-medium">{duration} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Daily Budget</span>
                  <span className="text-white font-medium">${dailyBudget}/day</span>
                </div>
                <div className="border-t border-white/[0.06] pt-3 flex justify-between">
                  <span className="text-white font-bold">Total</span>
                  <span className="text-accent font-black text-xl">${totalSpend.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={!companyName || !contactEmail}
              className="bg-accent text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors shadow-lg shadow-accent/20 mb-4 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Pay ${totalSpend.toLocaleString()} via Stripe →
            </button>

            <p className="text-gray-600 text-[10px] max-w-sm mx-auto">
              Campaign goes under review after payment. Approved campaigns go live within 24 hours.
              Secure payment via Stripe.
            </p>

            <button onClick={() => setStep(3)} className="mt-4 text-gray-500 hover:text-white text-sm transition-colors">← Back</button>
          </div>
        )}
      </main>
    </>
  );
}
