'use client';

import { useEffect, useState } from 'react';

type BrainStat = {
  calls: number;
  cost_cents: number;
  avg_latency: number;
  success_rate: number;
};

type FeatureStat = {
  brain: string;
  feature: string;
  total_calls: number;
  total_cost_cents: number;
  avg_latency_ms: number;
  success_rate: number;
};

type DayBucket = {
  day: string;
  claude: number;
  gemini: number;
  openai: number;
};

type CostData = {
  period_days: number;
  total_cost_cents: number;
  total_cost_usd: string;
  brain_summary: Record<string, BrainStat>;
  by_feature: FeatureStat[];
  daily_chart: DayBucket[];
};

const BRAIN_COLORS: Record<string, { bg: string; text: string; label: string; emoji: string }> = {
  claude: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Claude (THINK)', emoji: '\uD83E\uDDE0' },
  gemini: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Gemini (SEE)', emoji: '\uD83D\uDC41\uFE0F' },
  openai: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'OpenAI (ACT)', emoji: '\u2699\uFE0F' },
};

function fmtCost(cents: number) {
  if (cents < 1) return `$${(cents / 100).toFixed(4)}`;
  if (cents < 100) return `$${(cents / 100).toFixed(3)}`;
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtMs(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function AICostDashboard() {
  const [data, setData] = useState<CostData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/ai-costs?days=${days}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, [days]);

  if (loading) return (
    <div className=" bg-[#0a0a0a] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!data) return null;

  // Compute cost share per brain
  const totalCost = Object.values(data.brain_summary).reduce((s, b) => s + b.cost_cents, 0);

  // Find most expensive feature
  const topFeature = data.by_feature[0];

  return (
    <div className=" bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">AI Command Center</h1>
            <p className="text-gray-500 text-sm mt-1">
              3-Brain usage: \uD83E\uDDE0 Claude THINK + \uD83D\uDC41\uFE0F Gemini SEE + \u2699\uFE0F OpenAI ACT
            </p>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map(d => (
              <button aria-label="Interactive Button"
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  days === d ? 'bg-amber-500 text-white font-bold' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Total cost banner */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total AI Spend ({days}d)</p>
              <p className="text-3xl font-bold text-amber-400">${data.total_cost_usd}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Daily Average</p>
              <p className="text-3xl font-bold text-white">
                {fmtCost(data.total_cost_cents / days)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Top Cost Feature</p>
              <p className="text-lg font-bold text-white">{topFeature?.feature ?? '—'}</p>
              <p className="text-xs text-gray-600">{fmtCost(topFeature?.total_cost_cents ?? 0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Calls</p>
              <p className="text-3xl font-bold text-white">
                {Object.values(data.brain_summary).reduce((s, b) => s + b.calls, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Brain cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {Object.entries(data.brain_summary).map(([brain, stats]) => {
            const style = BRAIN_COLORS[brain];
            const share = totalCost > 0 ? Math.round((stats.cost_cents / totalCost) * 100) : 0;
            return (
              <div key={brain} className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{style?.emoji}</span>
                    <span className={`text-sm font-bold ${style?.text}`}>{style?.label}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${style?.bg} ${style?.text}`}>
                    {share}% of spend
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total spend</span>
                    <span className="font-mono text-white">{fmtCost(stats.cost_cents)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Calls</span>
                    <span className="font-mono text-white">{stats.calls.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Avg latency</span>
                    <span className={`font-mono ${
                      stats.avg_latency < 500 ? 'text-green-400' :
                      stats.avg_latency < 2000 ? 'text-amber-400' : 'text-red-400'
                    }`}>{fmtMs(stats.avg_latency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Success rate</span>
                    <span className={`font-mono ${
                      stats.success_rate > 98 ? 'text-green-400' :
                      stats.success_rate > 95 ? 'text-amber-400' : 'text-red-400'
                    }`}>{stats.success_rate}%</span>
                  </div>
                  {/* Cost per call */}
                  <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                    <span className="text-gray-500">Cost/call</span>
                    <span className="font-mono text-gray-300">
                      {stats.calls > 0 ? fmtCost(stats.cost_cents / stats.calls) : '—'}
                    </span>
                  </div>
                </div>
                {/* Bar */}
                <div className="mt-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${brain === 'claude' ? 'bg-purple-500' : brain === 'gemini' ? 'bg-blue-500' : 'bg-green-500'} rounded-full transition-all`}
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Cost by feature */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Cost by Feature</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-white/10">
                  <th className="pb-2 pr-4">Feature</th>
                  <th className="pb-2 pr-4">Brain</th>
                  <th className="pb-2 pr-4">Calls</th>
                  <th className="pb-2 pr-4">Total Cost</th>
                  <th className="pb-2 pr-4">Avg Latency</th>
                  <th className="pb-2">Success</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.by_feature.map((f) => {
                  const style = BRAIN_COLORS[f.brain];
                  return (
                    <tr key={`${f.brain}-${f.feature}`}>
                      <td className="py-2.5 pr-4 font-mono text-xs text-white">{f.feature}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${style?.bg} ${style?.text}`}>
                          {style?.emoji} {f.brain}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-gray-400">{f.total_calls.toLocaleString()}</td>
                      <td className="py-2.5 pr-4 font-mono text-amber-400">{fmtCost(f.total_cost_cents)}</td>
                      <td className="py-2.5 pr-4 font-mono text-gray-400">{fmtMs(f.avg_latency_ms)}</td>
                      <td className="py-2.5">
                        <span className={f.success_rate > 98 ? 'text-green-400' : 'text-amber-400'}>
                          {f.success_rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily chart (text-based) */}
        {data.daily_chart.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4">Daily Cost Trend</h2>
            <div className="space-y-2">
              {data.daily_chart.slice(-14).map((d) => {
                const total = d.claude + d.gemini + d.openai;
                const maxCost = Math.max(...data.daily_chart.map(x => x.claude + x.gemini + x.openai));
                const pct = maxCost > 0 ? (total / maxCost * 100) : 0;
                return (
                  <div key={d.day} className="flex items-center gap-3">
                    <p className="text-xs text-gray-600 w-20 flex-shrink-0">{d.day.slice(5)}</p>
                    <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden flex">
                      <div className="h-full bg-purple-500/60" style={{ width: `${maxCost > 0 ? d.claude / maxCost * 100 : 0}%` }} />
                      <div className="h-full bg-blue-500/60" style={{ width: `${maxCost > 0 ? d.gemini / maxCost * 100 : 0}%` }} />
                      <div className="h-full bg-green-500/60" style={{ width: `${maxCost > 0 ? d.openai / maxCost * 100 : 0}%` }} />
                    </div>
                    <p className="text-xs font-mono text-gray-400 w-16 text-right flex-shrink-0">{fmtCost(total)}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-gray-600">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />Claude</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Gemini</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />OpenAI</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}