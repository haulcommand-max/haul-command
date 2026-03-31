'use client';

import { useState, useRef, useEffect } from 'react';
import RouteCheckLeadCapture from '@/components/leads/RouteCheckLeadCapture';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

const EXAMPLE_QUESTIONS = [
  'Does a 14ft wide load need a pilot car in Texas?',
  'Can I run oversize loads on Sunday in California?',
  'How many escorts does a 200,000 lb crane need in Ohio?',
  'Do autonomous trucks need escorts in Texas?',
  'What permits do I need for a rig move in the Permian Basin?',
  'Maximum legal width without permit in Florida?',
];

export function RouteCheckTool() {
  const [query, setQuery] = useState('');
  const [state, setState] = useState('');
  const [loadType, setLoadType] = useState('oversize');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [model, setModel] = useState('');
  const [queryId, setQueryId] = useState<string | undefined>();
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Pre-fill from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const s = params.get('state');
    if (s) setState(s);
    if (q) { setQuery(q); handleSearch(q, s ?? undefined); }
  }, []);

  async function handleSearch(q?: string, s?: string) {
    const finalQ = q ?? query;
    if (!finalQ.trim()) return;
    setLoading(true);
    setAnswer('');
    setLatency(null);
    setQueryId(undefined);
    setLeadCaptured(false);

    const params = new URLSearchParams({ q: finalQ, load_type: loadType });
    if (s ?? state) params.set('state', s ?? state);

    try {
      const res = await fetch(`/api/route-check?${params}`);
      const data = await res.json();
      setAnswer(data.answer ?? data.error ?? 'No answer received.');
      setLatency(data.latency_ms ?? null);
      setModel(data.model ?? '');
      setQueryId(data.query_id);

      // Update URL without reload (shareable links)
      const url = new URL(window.location.href);
      url.searchParams.set('q', finalQ);
      if (s ?? state) url.searchParams.set('state', s ?? state);
      window.history.replaceState(null, '', url.toString());
    } catch {
      setAnswer('Failed to get answer. Please try again.');
    }
    setLoading(false);
  }

  function copyShareLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Search box */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl focus-within:border-amber-500/40 transition-colors">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSearch(); } }}
          placeholder="Ask anything about oversize load regulations, pilot car requirements, or permits..."
          className="w-full bg-transparent text-white placeholder-gray-600 resize-none focus:outline-none min-h-[80px]"
          rows={3}
        />
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/5">
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 px-3 py-1.5 focus:outline-none"
          >
            <option value="">All states</option>
            {US_STATES.map(s => <option key={s} value={s} className="bg-[#1a1a1a]">{s}</option>)}
          </select>
          <select
            value={loadType}
            onChange={(e) => setLoadType(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 px-3 py-1.5 focus:outline-none"
          >
            <option value="oversize">Oversize</option>
            <option value="overweight">Overweight</option>
            <option value="superload">Superload</option>
            <option value="autonomous">AV / Autonomous</option>
            <option value="rig_move">Rig Move</option>
          </select>
          <button aria-label="Interactive Button"
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="ml-auto px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Route'}
          </button>
        </div>
      </div>

      {/* Example questions */}
      {!answer && !loading && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button aria-label="Interactive Button"
              key={q}
              onClick={() => { setQuery(q); handleSearch(q); }}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-gray-400 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full" />
            <p className="text-gray-400 text-sm">Checking live regulations with Gemini + Google Search...</p>
          </div>
        </div>
      )}

      {/* Answer */}
      {answer && !loading && (
        <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-sm font-medium">Route Check Answer</span>
            {latency && (
              <span className="text-xs text-gray-600">{(latency / 1000).toFixed(1)}s</span>
            )}
            <div className="ml-auto flex items-center gap-2">
              {model && <span className="text-xs text-gray-700">{model}</span>}
              <button aria-label="Interactive Button"
                onClick={copyShareLink}
                className="text-xs text-gray-500 hover:text-amber-400 transition-colors px-2 py-1 rounded border border-white/10 hover:border-amber-500/30"
              >
                {copied ? '✓ Copied' : '⎘ Share'}
              </button>
            </div>
          </div>

          <div className="prose prose-invert prose-sm max-w-none text-gray-300 prose-p:leading-relaxed prose-strong:text-white">
            <p className="whitespace-pre-wrap">{answer}</p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
            <a
              href="/directory"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-sm transition-colors"
            >
              Find Escort Operators
            </a>
            <a
              href="/loads/new"
              className="px-4 py-2 border border-white/20 hover:border-white/40 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              Post a Load
            </a>
            <button aria-label="Interactive Button"
              onClick={() => { setAnswer(''); setQuery(''); setQueryId(undefined); }}
              className="px-4 py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Ask another ↩
            </button>
          </div>

          {/* Lead capture — shown after answer, non-intrusive */}
          {!leadCaptured && (
            <div className="pt-2">
              <RouteCheckLeadCapture
                query={query}
                state={state || undefined}
                loadType={loadType}
                queryId={queryId}
                onSubmitted={() => setLeadCaptured(true)}
              />
            </div>
          )}

          {leadCaptured && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
              <p className="text-xs text-green-400">
                ✓ You're on the list. We'll notify you when these regulations change.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
