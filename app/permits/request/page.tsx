'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

export default function PermitRequestPage() {
  const [form, setForm] = useState({ origin: '', destinations: [] as string[], height: '', width: '', length: '', weight: '', neededBy: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleDest = (s: string) => {
    setForm(f => ({ ...f, destinations: f.destinations.includes(s) ? f.destinations.filter(x => x !== s) : [...f.destinations, s] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/permits/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin_state: form.origin,
          destination_states: form.destinations,
          load_dimensions: { height: form.height, width: form.width, length: form.length, weight: form.weight },
          needed_by_date: form.neededBy,
          notes: form.notes,
        }),
      });
      if (res.ok) setSubmitted(true);
      else alert('Failed to submit request. Please sign in first.');
    } catch { alert('Network error'); }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white" style={{ background: '#060b12' }}>
        <div className="text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-2xl font-black mb-2">Permit Request Submitted!</h1>
          <p className="text-sm text-[#8fa3b8] mb-6">Verified permit agents will review your request and respond with quotes.</p>
          <Link href="/permits" className="text-sm font-bold text-[#C6923A] hover:underline">Back to Permits →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#060b12', fontFamily: 'var(--font-body)' }}>
      <nav className="border-b border-white/[0.06]" style={{ background: 'rgba(11,11,12,0.85)', backdropFilter: 'blur(24px)' }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="text-sm font-black text-[#C6923A]">HAUL COMMAND</Link>
          <span className="text-[#5A6577] mx-2">/</span>
          <Link href="/permits" className="text-sm text-[#8fa3b8] hover:text-white">Permits</Link>
          <span className="text-[#5A6577] mx-2">/</span>
          <span className="text-sm font-semibold text-white">Request</span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-black mb-2">Request a Permit</h1>
        <p className="text-sm text-[#8fa3b8] mb-8">Enter your route and load details. Agents covering your states will respond within 24–48 hours.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Origin */}
          <div>
            <label className="text-[10px] font-bold text-[#5A6577] uppercase tracking-wider block mb-2">Origin State</label>
            <select value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} required
              className="w-full px-4 py-3 rounded-xl text-sm bg-white/[0.04] border border-white/[0.08] text-white">
              <option value="">Select state...</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Destinations */}
          <div>
            <label className="text-[10px] font-bold text-[#5A6577] uppercase tracking-wider block mb-2">Destination States (select all that apply)</label>
            <div className="flex flex-wrap gap-1.5">
              {US_STATES.map(s => (
                <button key={s} type="button" onClick={() => toggleDest(s)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                    form.destinations.includes(s) ? 'bg-[#C6923A]/15 border-[#C6923A]/30 text-[#C6923A]' : 'bg-white/[0.02] border-white/[0.06] text-[#5A6577] hover:text-white'
                  }`}>{s}</button>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[{ k: 'height', l: 'Height (ft)' }, { k: 'width', l: 'Width (ft)' }, { k: 'length', l: 'Length (ft)' }, { k: 'weight', l: 'Weight (lbs)' }].map(d => (
              <div key={d.k}>
                <label className="text-[10px] font-bold text-[#5A6577] uppercase tracking-wider block mb-2">{d.l}</label>
                <input type="number" step="0.1" value={(form as any)[d.k]} onChange={e => setForm(f => ({ ...f, [d.k]: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-white/[0.04] border border-white/[0.08] text-white" placeholder="0" />
              </div>
            ))}
          </div>

          {/* Date */}
          <div>
            <label className="text-[10px] font-bold text-[#5A6577] uppercase tracking-wider block mb-2">Needed By Date</label>
            <input type="date" value={form.neededBy} onChange={e => setForm(f => ({ ...f, neededBy: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-sm bg-white/[0.04] border border-white/[0.08] text-white" />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-bold text-[#5A6577] uppercase tracking-wider block mb-2">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm bg-white/[0.04] border border-white/[0.08] text-white resize-none" placeholder="Any special requirements..." />
          </div>

          <button type="submit" disabled={submitting || !form.origin || form.destinations.length === 0}
            className="w-full py-4 rounded-xl font-black text-sm transition-all"
            style={{ background: 'linear-gradient(135deg,#C6923A,#E0B05C)', color: '#0a0a0f', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Submitting...' : 'Submit Permit Request →'}
          </button>
        </form>
      </main>
    </div>
  );
}
