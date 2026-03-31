'use client';

import { useState } from 'react';

interface RouteCheckLeadCaptureProps {
  query: string;
  state?: string;
  loadType?: string;
  queryId?: string;
  onSubmitted?: () => void;
}

/**
 * Inline lead capture shown after a Route Check answer.
 * Low friction: email only required. Name/company optional.
 * Enrolled in AI-personalized email sequence automatically.
 */
export default function RouteCheckLeadCapture({
  query,
  state,
  loadType,
  queryId,
  onSubmitted,
}: RouteCheckLeadCaptureProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/leads/route-check-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, company, query, state, load_type: loadType, query_id: queryId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');

      setDone(true);
      onSubmitted?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
        <p className="text-sm text-green-400 font-medium">✔ Got it. We’ll send you updates on this and related regulations.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
      <p className="text-sm font-medium text-white mb-1">
        Get regulation updates for this corridor
      </p>
      <p className="text-xs text-gray-500 mb-3">
        We’ll notify you when rules change in {state ?? 'your state'}. No spam.
      </p>

      <form onSubmit={submit} className="space-y-2">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 text-sm px-3 py-2 focus:outline-none focus:border-amber-500/40"
        />

        {expanded && (
          <>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 text-sm px-3 py-2 focus:outline-none"
            />
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Company (optional)"
              className="w-full bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 text-sm px-3 py-2 focus:outline-none"
            />
          </>
        )}

        <div className="flex gap-2">
          <button aria-label="Interactive Button"
            type="submit"
            disabled={loading || !email}
            className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Get Updates'}
          </button>
          {!expanded && (
            <button aria-label="Interactive Button"
              type="button"
              onClick={() => setExpanded(true)}
              className="px-3 py-2 border border-white/10 text-gray-400 text-xs rounded-lg hover:border-white/20 transition-colors"
            >
              + Name
            </button>
          )}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </div>
  );
}
