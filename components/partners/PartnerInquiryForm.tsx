'use client';

import { useState } from 'react';

const INTERESTS = [
  'AV corridor escorts',
  'Oilfield moves',
  'Wind energy',
  'General oversize freight',
  'Certification for our operators',
  'Other',
];

const LOADS_OPTIONS = ['1-10', '10-50', '50-200', '200+'];

export function PartnerInquiryForm({ defaultInterest = '' }: { defaultInterest?: string }) {
  const [form, setForm] = useState({
    company: '',
    role: '',
    corridors_or_regions: '',
    loads_per_month: '',
    primary_interest: defaultInterest,
    email: '',
    phone: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/partners/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Submission failed');
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg('Something went wrong. Please email us at haulcommand@gmail.com');
    }
  }

  if (status === 'success') {
    return (
      <div className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center">
        <p className="text-3xl mb-3">\u2713</p>
        <h3 className="text-xl font-bold mb-2">Got it.</h3>
        <p className="text-gray-400">
          We\u2019ll review your operations and follow up within one business day.
          No pitch. No demo unless you want one.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Company *</label>
          <input
            type="text"
            required
            value={form.company}
            onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
            placeholder="Acme Logistics"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Your Role *</label>
          <input
            type="text"
            required
            value={form.role}
            onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
            placeholder="Director of Operations"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Primary Interest *</label>
        <select
          required
          value={form.primary_interest}
          onChange={(e) => setForm(f => ({ ...f, primary_interest: e.target.value }))}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
        >
          <option value="">Select one...</option>
          {INTERESTS.map((i) => (
            <option key={i} value={i} className="bg-[#1a1a1a]">{i}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Corridors or Regions</label>
        <textarea
          value={form.corridors_or_regions}
          onChange={(e) => setForm(f => ({ ...f, corridors_or_regions: e.target.value }))}
          rows={2}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 resize-none"
          placeholder="Permian Basin, I-45 Dallas to Houston, etc."
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Loads per Month</label>
        <select
          value={form.loads_per_month}
          onChange={(e) => setForm(f => ({ ...f, loads_per_month: e.target.value }))}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
        >
          <option value="">Select range...</option>
          {LOADS_OPTIONS.map((o) => (
            <option key={o} value={o} className="bg-[#1a1a1a]">{o}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Email *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Phone (optional)</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
            placeholder="+1 (555) 000-0000"
          />
        </div>
      </div>

      {status === 'error' && (
        <p className="text-red-400 text-sm">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors disabled:opacity-50"
      >
        {status === 'submitting' ? 'Sending...' : 'Send — No Sales Call Required'}
      </button>

      <p className="text-xs text-gray-600 text-center">
        We respond within one business day. No automatic calls or demos scheduled without your request.
      </p>
    </form>
  );
}
