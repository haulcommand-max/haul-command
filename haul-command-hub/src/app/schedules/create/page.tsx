'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useState, useMemo } from 'react';

/* ══════════════════════════════════════════════════════
   STANDING ORDERS — 4-Step Schedule Creation Wizard
   Step 1: Route Details
   Step 2: Frequency
   Step 3: Rate & Operator Preference
   Step 4: Pre-Funding Checkout
   ══════════════════════════════════════════════════════ */

const LOAD_TYPES = [
  { id: 'oversize', label: 'Oversize Load', icon: '🚛' },
  { id: 'superload', label: 'Superload', icon: '🏗️' },
  { id: 'wide_load', label: 'Wide Load', icon: '📏' },
  { id: 'tall_load', label: 'Tall Load', icon: '📐' },
  { id: 'heavy_haul', label: 'Heavy Haul', icon: '⚙️' },
  { id: 'wind_blade', label: 'Wind Blade', icon: '🌬️' },
  { id: 'modular', label: 'Modular/Prefab', icon: '🏠' },
  { id: 'military', label: 'Military Equipment', icon: '🪖' },
];

const FREQUENCY_OPTIONS = [
  { id: 'daily', label: 'Daily', desc: 'Every day', icon: '📅' },
  { id: 'weekly', label: 'Weekly', desc: 'Selected days each week', icon: '📆' },
  { id: 'biweekly', label: 'Biweekly', desc: 'Every 2 weeks', icon: '🗓️' },
  { id: 'monthly', label: 'Monthly', desc: 'Once per month', icon: '📊' },
  { id: 'custom', label: 'Custom Days', desc: 'Pick specific days', icon: '⚡' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SAMPLE_JURISDICTIONS = [
  'US-TX', 'US-CA', 'US-FL', 'US-NY', 'US-PA', 'US-OH', 'US-IL', 'US-GA',
  'US-NC', 'US-MI', 'US-WA', 'US-AZ', 'US-CO', 'US-MN', 'US-VA', 'US-IN',
  'US-LA', 'US-OK', 'US-NM', 'US-AL', 'US-SC', 'US-KY', 'US-OR', 'US-UT',
  'CA-ON', 'CA-AB', 'CA-BC', 'CA-QC', 'AU-NSW', 'AU-QLD', 'AU-VIC', 'GB-ENG',
];

const PLATFORM_FEE_PERCENT = 5;
const PRIORITY_DISPATCH_FEE = 15;

function calculateOccurrenceCount(frequency: string, daysOfWeek: number[], startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T23:59:59Z');
  if (end <= start) return 0;

  let count = 0;
  const current = new Date(start);
  while (current <= end && count < 365) {
    if (frequency === 'daily') {
      count++;
      current.setUTCDate(current.getUTCDate() + 1);
    } else if (frequency === 'weekly' || frequency === 'custom') {
      if (daysOfWeek.includes(current.getUTCDay())) count++;
      current.setUTCDate(current.getUTCDate() + 1);
    } else if (frequency === 'biweekly') {
      count++;
      current.setUTCDate(current.getUTCDate() + 14);
    } else if (frequency === 'monthly') {
      count++;
      current.setUTCMonth(current.getUTCMonth() + 1);
    } else {
      current.setUTCDate(current.getUTCDate() + 1);
    }
  }
  return count;
}

export default function CreateStandingOrderPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Route
  const [title, setTitle] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [loadType, setLoadType] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [length, setLength] = useState('');
  const [weight, setWeight] = useState('');

  // Step 2: Frequency
  const [frequency, setFrequency] = useState('weekly');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('06:00');

  // Step 3: Rate
  const [ratePerOccurrence, setRatePerOccurrence] = useState(350);
  const [priorityDispatch, setPriorityDispatch] = useState(false);

  // Derived calculations
  const occurrenceCount = useMemo(
    () => calculateOccurrenceCount(frequency, daysOfWeek, startDate, endDate),
    [frequency, daysOfWeek, startDate, endDate],
  );

  const escrow = useMemo(() => {
    const subtotal = ratePerOccurrence * occurrenceCount;
    const platformFees = Math.round(subtotal * (PLATFORM_FEE_PERCENT / 100) * 100) / 100;
    const priorityFees = priorityDispatch ? PRIORITY_DISPATCH_FEE * occurrenceCount : 0;
    const total = Math.round((subtotal + platformFees + priorityFees) * 100) / 100;
    const operatorPayout = Math.round((ratePerOccurrence - ratePerOccurrence * PLATFORM_FEE_PERCENT / 100) * 100) / 100;
    return { subtotal, platformFees, priorityFees, total, operatorPayout };
  }, [ratePerOccurrence, occurrenceCount, priorityDispatch]);

  function toggleDay(day: number) {
    setDaysOfWeek(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort());
  }

  async function handleCreateOrder() {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/schedules/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brokerId: 'demo-broker', // Will be replaced with actual auth
          title: title || `${origin} → ${destination} Standing Order`,
          originJurisdiction: origin,
          destinationJurisdiction: destination,
          loadType,
          loadDimensions: { width, height, length, weight },
          ratePerOccurrence,
          frequency,
          daysOfWeek: (frequency === 'weekly' || frequency === 'custom') ? daysOfWeek : undefined,
          startDate,
          endDate,
          priorityDispatch,
          scheduledTime,
        }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || 'Failed to create standing order');
      }
    } catch {
      alert('Failed to create standing order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const canProceedStep1 = origin && destination && loadType;
  const canProceedStep2 = startDate && endDate && occurrenceCount > 0;
  const canProceedStep3 = ratePerOccurrence >= 50;

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 overflow-x-hidden">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/schedules/dashboard" className="hover:text-accent">Standing Orders</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Create</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">⚡</span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
              New <span className="text-accent">Standing Order</span>
            </h1>
          </div>
          <p className="text-gray-500 text-sm">Pre-fund recurring escort loads. Guaranteed work, automatic execution.</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 mb-10">
          {['Route', 'Frequency', 'Rate', 'Pre-Fund'].map((label, i) => (
            <div key={label} className="flex-1 flex items-center gap-1">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                i + 1 === step ? 'bg-accent/10 text-accent border border-accent/20'
                : i + 1 < step ? 'bg-green-500/10 text-green-400'
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

        {/* ─── Step 1: Route Details ─── */}
        {step === 1 && (
          <div className="space-y-6 ag-slide-up">
            <h2 className="text-white font-bold text-lg">Route Details</h2>

            <div>
              <label className="block text-gray-400 text-xs mb-2">Standing Order Name</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Weekly I-10 Wind Blade Run" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/40" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs mb-2">Origin Jurisdiction</label>
                <select value={origin} onChange={e => setOrigin(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/40 appearance-none">
                  <option value="">Select origin...</option>
                  {SAMPLE_JURISDICTIONS.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-2">Destination Jurisdiction</label>
                <select value={destination} onChange={e => setDestination(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/40 appearance-none">
                  <option value="">Select destination...</option>
                  {SAMPLE_JURISDICTIONS.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-xs mb-2">Load Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LOAD_TYPES.map(t => (
                  <button key={t.id} onClick={() => setLoadType(t.id)} className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    loadType === t.id ? 'bg-accent/10 text-accent border border-accent/30' : 'bg-white/[0.03] text-gray-400 border border-white/[0.06] hover:border-accent/20'
                  }`}>
                    <span className="text-base mr-1">{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-xs mb-2">Dimensions (optional)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <input value={width} onChange={e => setWidth(e.target.value)} placeholder="Width (ft)" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/40" />
                <input value={height} onChange={e => setHeight(e.target.value)} placeholder="Height (ft)" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/40" />
                <input value={length} onChange={e => setLength(e.target.value)} placeholder="Length (ft)" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/40" />
                <input value={weight} onChange={e => setWeight(e.target.value)} placeholder="Weight (lbs)" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/40" />
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setStep(2)} disabled={!canProceedStep1} className="px-6 py-3 rounded-xl text-sm font-bold bg-accent text-black hover:bg-yellow-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Continue →</button>
            </div>
          </div>
        )}

        {/* ─── Step 2: Frequency ─── */}
        {step === 2 && (
          <div className="space-y-6 ag-slide-up">
            <h2 className="text-white font-bold text-lg">Frequency & Schedule</h2>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {FREQUENCY_OPTIONS.map(f => (
                <button key={f.id} onClick={() => setFrequency(f.id)} className={`text-left px-3 py-3 rounded-xl text-xs font-medium transition-all ${
                  frequency === f.id ? 'bg-accent/10 text-accent border border-accent/30' : 'bg-white/[0.03] text-gray-400 border border-white/[0.06] hover:border-accent/20'
                }`}>
                  <span className="text-lg block mb-1">{f.icon}</span>
                  <span className="font-bold block">{f.label}</span>
                  <span className="text-[10px] text-gray-500 block">{f.desc}</span>
                </button>
              ))}
            </div>

            {(frequency === 'weekly' || frequency === 'custom') && (
              <div>
                <label className="block text-gray-400 text-xs mb-2">Days of Week</label>
                <div className="flex gap-2">
                  {DAY_NAMES.map((name, i) => (
                    <button key={i} onClick={() => toggleDay(i)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      daysOfWeek.includes(i) ? 'bg-accent text-black' : 'bg-white/[0.04] text-gray-500 border border-white/[0.08] hover:border-accent/20'
                    }`}>{name}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-400 text-xs mb-2">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/40" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-2">End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/40" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-2">Departure Time</label>
                <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/40" />
              </div>
            </div>

            {occurrenceCount > 0 && (
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center justify-between">
                <span className="text-accent text-sm font-bold">📋 {occurrenceCount} occurrences</span>
                <span className="text-gray-400 text-xs">{frequency} · {startDate} → {endDate}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white border border-white/10 transition-all">← Back</button>
              <button onClick={() => setStep(3)} disabled={!canProceedStep2} className="px-6 py-3 rounded-xl text-sm font-bold bg-accent text-black hover:bg-yellow-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Continue →</button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Rate & Preferences ─── */}
        {step === 3 && (
          <div className="space-y-6 ag-slide-up">
            <h2 className="text-white font-bold text-lg">Rate & Preferences</h2>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-400 text-xs">Rate Per Occurrence</label>
                <span className="text-accent font-black text-2xl">${ratePerOccurrence}</span>
              </div>
              <input type="range" min={50} max={2000} step={10} value={ratePerOccurrence} onChange={e => setRatePerOccurrence(Number(e.target.value))} className="w-full accent-[#f59f0a] h-2 bg-white/10 rounded-full appearance-none cursor-pointer" />
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>$50</span><span>$2,000</span>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Operator payout per run</span>
                <span className="text-white font-bold">${escrow.operatorPayout}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Platform fee (5%)</span>
                <span className="text-gray-300">${Math.round(ratePerOccurrence * 0.05 * 100) / 100}</span>
              </div>
            </div>

            {/* Priority Dispatch Toggle */}
            <button onClick={() => setPriorityDispatch(!priorityDispatch)} className={`w-full text-left p-4 rounded-xl border transition-all ${
              priorityDispatch ? 'bg-accent/10 border-accent/30' : 'bg-white/[0.02] border-white/[0.06] hover:border-accent/20'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-bold text-sm flex items-center gap-2">
                    ⚡ Priority Dispatch
                    <span className="text-accent text-xs">+$15/occurrence</span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">Guaranteed top-ranked operator assignment for every occurrence</p>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors flex items-center ${priorityDispatch ? 'bg-accent justify-end' : 'bg-white/10 justify-start'}`}>
                  <div className="w-4 h-4 rounded-full bg-white mx-1" />
                </div>
              </div>
            </button>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white border border-white/10 transition-all">← Back</button>
              <button onClick={() => setStep(4)} disabled={!canProceedStep3} className="px-6 py-3 rounded-xl text-sm font-bold bg-accent text-black hover:bg-yellow-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Continue →</button>
            </div>
          </div>
        )}

        {/* ─── Step 4: Pre-Funding ─── */}
        {step === 4 && (
          <div className="space-y-6 ag-slide-up text-center">
            <h2 className="text-white font-bold text-lg">Pre-Fund Escrow</h2>
            <p className="text-gray-500 text-sm">Secure your standing order with a one-time escrow deposit. Funds are released to operators as each load completes.</p>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-left max-w-lg mx-auto space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Standing Order</span><span className="text-white font-medium">{title || `${origin} → ${destination}`}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Route</span><span className="text-white font-medium">{origin} → {destination}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Load Type</span><span className="text-white font-medium capitalize">{loadType.replace('_', ' ')}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Frequency</span><span className="text-white font-medium capitalize">{frequency}{(frequency === 'weekly' || frequency === 'custom') ? ` (${daysOfWeek.map(d => DAY_NAMES[d]).join(', ')})` : ''}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Departure Time</span><span className="text-white font-medium">{scheduledTime}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Period</span><span className="text-white font-medium">{startDate} → {endDate}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Total Occurrences</span><span className="text-accent font-bold">{occurrenceCount}</span></div>

              <div className="border-t border-white/[0.06] pt-3 space-y-2">
                <div className="flex justify-between"><span className="text-gray-400">Operator Rates</span><span className="text-white">${escrow.subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Platform Fees (5%)</span><span className="text-gray-300">${escrow.platformFees.toLocaleString()}</span></div>
                {priorityDispatch && <div className="flex justify-between"><span className="text-gray-400">Priority Dispatch</span><span className="text-gray-300">${escrow.priorityFees.toLocaleString()}</span></div>}
              </div>

              <div className="border-t border-white/[0.06] pt-3 flex justify-between">
                <span className="text-white font-bold text-lg">Total Escrow</span>
                <span className="text-accent font-black text-2xl">${escrow.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 max-w-lg mx-auto text-left">
              <h3 className="text-green-400 font-bold text-xs mb-1">🔒 Escrow Protection</h3>
              <p className="text-gray-500 text-[11px]">
                Funds are held securely. Released to operators only upon completion of each occurrence.
                Cancel any occurrence 48+ hours ahead for a full refund. Balance remains available for future occurrences.
              </p>
            </div>

            <button
              onClick={handleCreateOrder}
              disabled={isSubmitting}
              className="bg-accent text-black px-10 py-4 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : `Fund Standing Order — $${escrow.total.toLocaleString()}`}
            </button>

            <p className="text-gray-600 text-[10px] max-w-sm mx-auto">
              Secure payment via Stripe. Standing order begins after funding confirmation.
            </p>

            <button onClick={() => setStep(3)} className="text-gray-500 hover:text-white text-sm transition-colors">← Back</button>
          </div>
        )}
      </main>
    </>
  );
}
