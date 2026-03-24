'use client';

import { Metadata } from 'next';
import { useState } from 'react';

// ── Batch Jobs Configuration ───────────────────────────────────────────
const BATCH_JOBS = [
  {
    id: 'meta',
    name: 'Meta Descriptions (7,745 listings)',
    description: 'Generate unique SEO meta descriptions for all directory listings. One-time batch.',
    endpoint: '/api/admin/batch/meta-descriptions',
    method: 'POST',
    body: { type: 'meta', limit: 100 },
    brain: 'gemini',
    model: 'gemini-2.0-flash-lite',
    cost: '~$0.70 total',
    time: '~8 min (100/batch)',
    priority: 1,
  },
  {
    id: 'enrich',
    name: 'Operator Profile Enrichment',
    description: 'Fill missing bios, services, equipment from raw listing data.',
    endpoint: '/api/admin/batch/meta-descriptions',
    method: 'POST',
    body: { type: 'enrich', limit: 50 },
    brain: 'gemini',
    model: 'gemini-2.0-flash-lite',
    cost: '~$0.70 total',
    time: '~5 min (50/batch)',
    priority: 2,
  },
  {
    id: 'regulations',
    name: '57-Country Regulation Summaries',
    description: 'Gemini + Google Search generates accurate oversize load regulation pages.',
    endpoint: '/api/admin/batch/corridors',
    method: 'POST',
    body: { type: 'regulations', limit: 20 },
    brain: 'gemini',
    model: 'gemini-2.0-flash-lite + grounding',
    cost: '~$0.017 total',
    time: '~2 min',
    priority: 3,
  },
  {
    id: 'corridors',
    name: 'Corridor Intel Pages (219 corridors)',
    description: 'Generate heavy haul intelligence briefings for every active corridor.',
    endpoint: '/api/admin/batch/corridors',
    method: 'POST',
    body: { type: 'corridors', limit: 20 },
    brain: 'gemini',
    model: 'gemini-2.5-flash',
    cost: '~$0.11 total',
    time: '~10 min (20/batch)',
    priority: 4,
  },
  {
    id: 'av_briefings',
    name: 'AV Corridor Briefings',
    description: 'Generate AV truck corridor briefings. Auto-runs weekly via cron.',
    endpoint: '/api/admin/batch/corridors',
    method: 'POST',
    body: { type: 'av_briefings' },
    brain: 'gemini',
    model: 'gemini-2.5-flash + grounding',
    cost: '~$0.01 per run',
    time: '~30 sec',
    priority: 5,
  },
  {
    id: 'mega_analysis',
    name: 'Market Intelligence (1M Context)',
    description: 'Feed ALL listings to Gemini 2.5 Pro. Supply gaps, price intel, growth opportunities.',
    endpoint: '/api/admin/corridor-mega-analysis',
    method: 'POST',
    body: { limit: 500 },
    brain: 'gemini',
    model: 'gemini-2.5-pro (1M context)',
    cost: '~$0.04 per analysis',
    time: '~30-60 sec',
    priority: 6,
  },
  {
    id: 'youtube_intel',
    name: 'YouTube Competitor Analysis',
    description: 'Analyze competitor YT content, find keyword gaps, generate 10 video ideas + script.',
    endpoint: '/api/admin/youtube-intel',
    method: 'POST',
    body: { topic: 'heavy haul escort trucking regulations' },
    brain: 'gemini',
    model: 'gemini-2.5-flash + grounding',
    cost: '~$0.005 per analysis',
    time: '~15 sec',
    priority: 7,
  },
];

const BRAIN_COLORS: Record<string, string> = {
  claude: 'bg-purple-500/20 text-purple-400',
  gemini: 'bg-blue-500/20 text-blue-400',
  openai: 'bg-green-500/20 text-green-400',
};

const BRAIN_EMOJIS: Record<string, string> = {
  claude: '\uD83E\uDDE0',
  gemini: '\uD83D\uDC41\uFE0F',
  openai: '\u2699\uFE0F',
};

export default function BatchJobsPage() {
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function runJob(job: typeof BATCH_JOBS[0]) {
    setRunning(r => ({ ...r, [job.id]: true }));
    setErrors(e => { const n = { ...e }; delete n[job.id]; return n; });
    setResults(r => { const n = { ...r }; delete n[job.id]; return n; });

    try {
      const res = await fetch(job.endpoint, {
        method: job.method,
        headers: { 'Content-Type': 'application/json' },
        body: job.method === 'POST' ? JSON.stringify(job.body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setResults(r => ({ ...r, [job.id]: data }));
    } catch (err: any) {
      setErrors(e => ({ ...e, [job.id]: err.message }));
    } finally {
      setRunning(r => ({ ...r, [job.id]: false }));
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Batch AI Jobs</h1>
          <p className="text-gray-500 text-sm mt-1">
            One-time and on-demand jobs. Run in order for maximum SEO + data quality lift.
          </p>
        </div>

        <div className="space-y-4">
          {BATCH_JOBS.map((job) => {
            const isRunning = running[job.id];
            const result = results[job.id];
            const error = errors[job.id];

            return (
              <div key={job.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {job.priority}
                      </span>
                      <h2 className="font-bold">{job.name}</h2>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${BRAIN_COLORS[job.brain]}`}>
                        {BRAIN_EMOJIS[job.brain]} {job.model}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{job.description}</p>
                    <div className="flex gap-4 text-xs text-gray-600">
                      <span>Cost: <span className="text-amber-400">{job.cost}</span></span>
                      <span>Time: {job.time}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => runJob(job)}
                    disabled={isRunning}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {isRunning ? 'Running...' : 'Run'}
                  </button>
                </div>

                {/* Result */}
                {result && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <p className="text-xs text-green-400 font-mono font-bold mb-1">✓ Completed</p>
                    <pre className="text-xs text-gray-400 overflow-x-auto">
                      {JSON.stringify(result, null, 2).slice(0, 800)}{JSON.stringify(result).length > 800 ? '\n...' : ''}
                    </pre>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-xs text-red-400 font-mono">✗ Error: {error}</p>
                  </div>
                )}

                {/* Loading */}
                {isRunning && (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="animate-spin w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full" />
                    <p className="text-xs text-gray-500">Running... check console for progress</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-white/3 border border-white/5 rounded-xl">
          <p className="text-xs text-gray-600">
            All jobs use the 3-Brain system: 🧠 Claude THINK + 👁️ Gemini SEE + ⚙️ OpenAI ACT.
            Monitor spend at <a href="/admin/ai-costs" className="text-amber-400 hover:underline">/admin/ai-costs</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
