'use client';

import { useState, useRef, useEffect } from 'react';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
];

const EXAMPLE_QUESTIONS = [
  'Does a 14ft wide load need a pilot car in Texas?',
  'Can I run oversize loads on Sunday in California?',
  'How many escorts does a 200,000 lb crane need in Ohio?',
  'Do autonomous trucks need escorts in Texas?',
  'What permits do I need for a rig move in the Permian Basin?',
];

export function RouteCheckTool() {
  const [query, setQuery] = useState('');
  const [state, setState] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [model, setModel] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Pre-fill from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) { setQuery(q); handleSearch(q); }
  }, []);

  async function handleSearch(q?: string) {
    const finalQ = q ?? query;
    if (!finalQ.trim()) return;
    setLoading(true);
    setAnswer('');
    setLatency(null);

    const params = new URLSearchParams({ q: finalQ });
    if (state) params.set('state', state);

    try {
      const res = await fetch(`/api/route-check?${params}`);
      const data = await res.json();
      setAnswer(data.answer ?? data.error ?? 'No answer received.');
      setLatency(data.latency_ms ?? null);
      setModel(data.model ?? '');
    } catch (err) {
      setAnswer('Failed to get answer. Please try again.');
    }
    setLoading(false);
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
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 px-3 py-1.5 focus:outline-none"
          >
            <option value="">All states</option>
            {US_STATES.map(s => <option key={s} value={s} className="bg-[#1a1a1a]">{s}</option>)}
          </select>
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Route'}
          </button>
        </div>
      </div>

      {/* Example questions */}
      {!answer && !loading && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => { setQuery(q); handleSearch(q); }}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-gray-400 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
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
        <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-amber-400 text-sm font-medium">Route Check Answer</span>
            {latency && (
              <span className="text-xs text-gray-600">{(latency / 1000).toFixed(1)}s</span>
            )}
            {model && (
              <span className="text-xs text-gray-700 ml-auto">{model}</span>
            )}
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-gray-300 prose-p:leading-relaxed prose-strong:text-white">
            <p className="whitespace-pre-wrap">{answer}</p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 flex gap-3">
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
          </div>
        </div>
      )}
    </div>
  );
}
