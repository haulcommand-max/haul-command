import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { runEnrichmentAgent } from '@/lib/engines/enrichment-agent';

/**
 * GET /api/cron/enrich-operators
 * 
 * Scheduled cron — runs enrichment agent to process all unenriched operators.
 * Should be triggered hourly via Vercel Cron.
 * also retrains model performance weights based on historical runs.
 */

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = supabaseServer();
  const results: Record<string, unknown> = {};

  // 1. Run enrichment agent — process up to 200 operators per cycle
  try {
    const enrichResult = await runEnrichmentAgent(200);
    results.enrichment = enrichResult;

    await sb.from('cron_audit').insert({
      job_name: 'enrich-operators',
      status: 'completed',
      rows_affected: enrichResult.enriched,
    });
  } catch (err: any) {
    results.enrichment = { error: err.message };
    await sb.from('cron_audit').insert({ job_name: 'enrich-operators', status: 'failed', error_msg: err.message });
  }

  // 2. Retrain model weights based on last 100 AI runs
  try {
    const { data: runs } = await sb
      .from('ai_orchestration_runs')
      .select('model_used, confidence_score, cost_usd, latency_ms')
      .order('created_at', { ascending: false })
      .limit(100);

    if (runs && runs.length > 0) {
      // Aggregate by model
      const stats: Record<string, { scores: number[]; costs: number[]; latencies: number[] }> = {};
      for (const run of runs) {
        const model = run.model_used.split(' → ')[0]; // base model only
        if (!stats[model]) stats[model] = { scores: [], costs: [], latencies: [] };
        if (run.confidence_score) stats[model].scores.push(run.confidence_score);
        if (run.cost_usd) stats[model].costs.push(run.cost_usd);
        if (run.latency_ms) stats[model].latencies.push(run.latency_ms);
      }

      const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

      for (const [model, data] of Object.entries(stats)) {
        const avgScore = avg(data.scores);
        const avgCost = avg(data.costs);
        const avgLatency = avg(data.latencies);
        // Dynamic weight: high score + low cost + low latency = higher weight
        const weight = Math.max(0.1, (avgScore * 2) + (1 / (avgCost + 0.001) * 0.001) + (1 / (avgLatency + 1) * 100));

        await sb.from('ai_model_performance')
          .upsert({
            model_name: model,
            task_intent: null,
            avg_score: avgScore,
            total_runs: data.scores.length,
            avg_latency: Math.round(avgLatency),
            weight: Math.min(2.0, weight),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'model_name, task_intent' });
      }

      results.model_retraining = { models_updated: Object.keys(stats).length };
    }
  } catch (err: any) {
    results.model_retraining = { error: err.message };
  }

  // 3. Prune old events (older than 7 days)
  try {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    await sb.from('events').delete().lt('created_at', cutoff);
    results.event_cleanup = { pruned: 'completed' };
  } catch (err: any) {
    results.event_cleanup = { error: err.message };
  }

  return NextResponse.json({ success: true, ...results });
}
