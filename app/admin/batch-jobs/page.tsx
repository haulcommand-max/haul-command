'use client';

import { Metadata } from 'next';
import { useState } from 'react';

const BATCH_JOBS = [
  {
    id: 'meta',
    name: 'Meta Descriptions (7,745 listings)',
    description: 'Generate unique SEO meta descriptions for all directory listings. One-time batch. Run repeatedly until all listings covered.',
    endpoint: '/api/admin/batch/meta-descriptions',
    method: 'POST',
    body: { type: 'meta', limit: 100 },
    brain: 'gemini',
    model: 'gemini-2.0-flash-lite',
    cost: '~$0.70 total',
    time: '~8 min (100/batch)',
    priority: 1,
    badge: 'SEO',
  },
  {
    id: 'enrich',
    name: 'Operator Profile Enrichment',
    description: 'Fill missing bios and service tags from raw listing data. Increases match rate & claimed conversions.',
    endpoint: '/api/admin/batch/meta-descriptions',
    method: 'POST',
    body: { type: 'enrich', limit: 50 },
    brain: 'gemini',
    model: 'gemini-2.0-flash-lite',
    cost: '~$0.70 total',
    time: '~5 min (50/batch)',
    priority: 2,
    badge: 'Quality',
  },
  {
    id: 'claim_analyze',
    name: 'ðŸ”¥ Claim Sweep — Analyze (7,745 listings)',
    description: 'Gemini writes email/SMS copy + Claude scores steal risk for every unclaimed listing. Run repeatedly until all analyzed.',
    endpoint: '/api/admin/claim-analysis',
    method: 'POST',
    body: { batch_limit: 100 },
    brain: 'hybrid',
    model: 'Gemini nano + Claude nano (parallel)',
    cost: '~$3.87 total for all 7,745',
    time: '~45 sec per 100 listings',
    priority: 3,
    badge: 'Revenue',
  },
  {
    id: 'claim_preview',
    name: 'ðŸ‘€ Claim Sweep — Preview Outreach (risk >= 7)',
    description: 'Dry-run: preview which high-risk unclaimed listings would receive outreach emails.',
    endpoint: '/api/admin/batch/claim-sweep',
    method: 'POST',
    body: { analyze_limit: 0, send_outreach: true, min_risk: 7, dry_run: true },
    brain: 'hybrid',
    model: 'Resend (dry run)',
    cost: 'Free preview',
    time: '~5 sec',
    priority: 4,
    badge: 'Revenue',
  },
  {
    id: 'claim_send',
    name: 'ðŸ“§ Claim Sweep — SEND Outreach (risk >= 7)',
    description: 'LIVE: Send personalized claim invite emails to high-risk unclaimed listings. Only sends to listings with email on file.',
    endpoint: '/api/admin/batch/claim-sweep',
    method: 'POST',
    body: { analyze_limit: 0, send_outreach: true, min_risk: 7, dry_run: false },
    brain: 'resend',
    model: 'Resend (live send)',
    cost: 'Resend pricing',
    time: '~10 sec per 50 emails',
    priority: 5,
    badge: 'ðŸ”´ LIVE',
  },
  {
    id: 'regulations',
    name: '57-Country Regulation Summaries',
    description: 'Gemini + Google Search generates accurate oversize load regulation pages for all 120 countries.',
    endpoint: '/api/admin/batch/corridors',
    method: 'POST',
    body: { type: 'regulations', limit: 20 },
    brain: 'gemini',
    model: 'gemini-2.0-flash-lite + grounding',
    cost: '~$0.017 total',
    time: '~2 min',
    priority: 6,
    badge: 'SEO',
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
    priority: 7,
    badge: 'SEO',
  },
  {
    id: 'mega_analysis',
    name: 'Market Intelligence (1M Context)',
    description: 'Feed ALL listings to Gemini 2.5 Pro. Supply gaps, price intel, competitor moat analysis.',
    endpoint: '/api/admin/corridor-mega-analysis',
    method: 'POST',
    body: { limit: 500 },
    brain: 'gemini',
    model: 'gemini-2.5-pro (1M context)',
    cost: '~$0.04 per analysis',
    time: '~30-60 sec',
    priority: 8,
    badge: 'Intel',
  },
  {
    id: 'youtube_intel',
    name: 'YouTube Competitor Analysis',
    description: 'Analyze competitor YT content, find keyword gaps, generate 10 video ideas + script outline.',
    endpoint: '/api/admin/youtube-intel',
    method: 'POST',
    body: { topic: 'heavy haul escort trucking regulations' },
    brain: 'gemini',
    model: 'gemini-2.5-flash + grounding',
    cost: '~$0.005 per analysis',
    time: '~15 sec',
    priority: 9,
    badge: 'Content',
  },
];

const BRAIN_COLORS: Record<string, string> = {
  claude: 'bg-purple-500/20 text-purple-400',
  gemini: 'bg-blue-500/20 text-blue-400',
  openai: 'bg-green-500/20 text-green-400',
  hybrid: 'bg-amber-500/20 text-amber-400',
  resend: 'bg-pink-500/20 text-pink-400',
};

const BADGE_COLORS: Record<string, string> = {
  SEO: 'bg-blue-500/20 text-blue-300',
  Revenue: 'bg-green-500/20 text-green-300',
  Quality: 'bg-purple-500/20 text-purple-300',
  Intel: 'bg-amber-500/20 text-amber-300',
  Content: 'bg-pink-500/20 text-pink-300',
  'ðŸ”´ LIVE': 'bg-red-500/20 text-red-400 animate-pulse',
};

export default function BatchJobsPage() {
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [csvUrl, setCsvUrl] = useState<string | null>(null);

  async function runJob(job: typeof BATCH_JOBS[0]) {
    setRunning(r => ({ ...r, [job.id]: true }));
    setErrors(e => { const n = { ...e }; delete n[job.id]; return n; });
    setResults(r => { const n = { ...r }; delete n[job.id]; return n; });
    setCsvUrl(null);

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

  async function downloadClaimCSV() {
    const url = '/api/admin/claim-analysis?format=csv&min_risk=7&limit=500';
    window.open(url, '_blank');
  }

  return (
    <div className=" bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Batch AI Jobs</h1>
          <p className="text-gray-500 text-sm mt-1">
            Run in order. Total estimated cost: <span className="text-amber-400 font-mono">~$5.50</span> for full platform coverage.
          </p>
        </div>

        {/* Claim export shortcut */}
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-green-400">ðŸ“„ Export Claim Outreach CSV</p>
            <p className="text-xs text-gray-500 mt-0.5">Download all analyzed high-risk listings (score â‰¥ 7) as CSV for email campaigns.</p>
          </div>
          <button aria-label="Interactive Button"
            onClick={downloadClaimCSV}
            className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white font-bold text-sm rounded-xl transition-colors flex-shrink-0"
          >
            Download CSV
          </button>
        </div>

        <div className="space-y-3">
          {BATCH_JOBS.map((job) => {
            const isRunning = running[job.id];
            const result = results[job.id];
            const error = errors[job.id];
            const isLive = job.badge === 'ðŸ”´ LIVE';

            return (
              <div
                key={job.id}
                className={`p-5 border rounded-2xl transition-colors ${
                  isLive
                    ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {job.priority}
                      </span>
                      <h2 className="font-bold text-sm">{job.name}</h2>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${BADGE_COLORS[job.badge] ?? 'bg-white/10 text-gray-400'}`}>
                        {job.badge}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{job.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                      <span className={`px-2 py-0.5 rounded text-xs ${BRAIN_COLORS[job.brain] ?? 'bg-white/10 text-gray-400'}`}>{job.model}</span>
                      <span>Cost: <span className="text-amber-400">{job.cost}</span></span>
                      <span>Time: {job.time}</span>
                    </div>
                  </div>
                  <button aria-label="Interactive Button"
                    onClick={() => runJob(job)}
                    disabled={isRunning}
                    className={`px-4 py-2 font-bold text-sm rounded-xl transition-colors disabled:opacity-50 flex-shrink-0 ${
                      isLive
                        ? 'bg-red-500 hover:bg-red-400 text-white'
                        : 'bg-amber-500 hover:bg-amber-400 text-white'
                    }`}
                  >
                    {isRunning ? 'Running...' : isLive ? 'ðŸ“§ Send' : 'Run'}
                  </button>
                </div>

                {result && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <p className="text-xs text-green-400 font-bold mb-1">âœ“ Completed</p>
                    <pre className="text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(result, null, 2).slice(0, 600)}
                      {JSON.stringify(result).length > 600 ? '\n...' : ''}
                    </pre>
                  </div>
                )}
                {error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-xs text-red-400">âœ— {error}</p>
                  </div>
                )}
                {isRunning && (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="animate-spin w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full" />
                    <p className="text-xs text-gray-500">Running"¦</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-white/3 border border-white/5 rounded-xl">
          <p className="text-xs text-gray-600">
            ðŸ§  Claude THINK · ðŸ‘ï¸ Gemini SEE · âš™ï¸ OpenAI ACT &mdash; monitor spend at{' '}
            <a href="/admin/ai-costs" className="text-amber-400 hover:underline">/admin/ai-costs</a>.
            Run 20 in Supabase SQL editor:{' '}
            <code className="text-amber-300 text-xs">SELECT * FROM get_ai_cost_summary(7);</code>
          </p>
        </div>
      </div>
    </div>
  );
}