import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = createClient();

  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '30');

  const [summaryRes, timelineRes, brainRes] = await Promise.all([
    // Cost by brain + feature
    supabase.rpc('get_ai_cost_summary', { days_back: days }),
    // Daily total cost trend
    supabase
      .from('ai_usage_log')
      .select('created_at, brain, cost_cents, latency_ms, success')
      .gte('created_at', new Date(Date.now() - days * 86400000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1000),
    // Brain-level rollup
    supabase
      .from('ai_usage_log')
      .select('brain, cost_cents, latency_ms, success')
      .gte('created_at', new Date(Date.now() - days * 86400000).toISOString()),
  ]);

  // Compute brain-level summary
  const brainSummary: Record<string, { calls: number; cost_cents: number; avg_latency: number; success_rate: number }> = {};
  for (const row of (brainRes.data ?? [])) {
    if (!brainSummary[row.brain]) brainSummary[row.brain] = { calls: 0, cost_cents: 0, avg_latency: 0, success_rate: 0 };
    brainSummary[row.brain].calls++;
    brainSummary[row.brain].cost_cents += row.cost_cents ?? 0;
    brainSummary[row.brain].avg_latency += row.latency_ms ?? 0;
    if (row.success) brainSummary[row.brain].success_rate++;
  }
  for (const brain of Object.keys(brainSummary)) {
    const b = brainSummary[brain];
    b.avg_latency = b.calls ? Math.round(b.avg_latency / b.calls) : 0;
    b.success_rate = b.calls ? Math.round((b.success_rate / b.calls) * 100) : 0;
  }

  // Compute daily cost buckets
  const dailyBuckets: Record<string, { claude: number; gemini: number; openai: number }> = {};
  for (const row of (timelineRes.data ?? [])) {
    const day = new Date(row.created_at).toISOString().split('T')[0];
    if (!dailyBuckets[day]) dailyBuckets[day] = { claude: 0, gemini: 0, openai: 0 };
    if (row.brain in dailyBuckets[day]) {
      (dailyBuckets[day] as any)[row.brain] += row.cost_cents ?? 0;
    }
  }

  const totalCostCents = (summaryRes.data ?? []).reduce((s: number, r: any) => s + (r.total_cost_cents ?? 0), 0);

  return NextResponse.json({
    period_days: days,
    total_cost_cents: totalCostCents,
    total_cost_usd: (totalCostCents / 100).toFixed(4),
    brain_summary: brainSummary,
    by_feature: summaryRes.data ?? [],
    daily_chart: Object.entries(dailyBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, costs]) => ({ day, ...costs })),
  });
}
