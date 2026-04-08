import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runClaimSniper } from '@/lib/workflows/claimSniper';

/**
 * POST /api/cron/claim-sniper
 * Runs the Claim Sniper workflow — finds high-value unclaimed listings,
 * scores candidates, and queues personalized claim packets.
 *
 * Secured with CRON_SECRET header.
 * Called daily at 07:00 via Vercel cron or GitHub Actions.
 */
export async function POST(req: NextRequest) {
  // Auth guard
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  const body = await req.json().catch(() => ({}));
  const {
    market_scope,
    min_score = 55,
    max_candidates = 50,
    dry_run = false,
  } = body;

  // Log workflow run start
  const { data: run, error: runErr } = await supabase
    .from('hc_workflow_runs')
    .insert({
      workflow_key: 'claim_sniper',
      trigger_type: body.trigger_type ?? 'cron',
      trigger_key: 'daily_claim_candidate_scan',
      input_json: { market_scope, min_score, max_candidates, dry_run },
      status: 'running',
    })
    .select('id')
    .single();

  if (runErr) {
    console.error('[claim-sniper cron] workflow run error', runErr);
    // Continue anyway — don't block on logging
  }

  try {
    const result = await runClaimSniper({
      marketScope: market_scope,
      minScore: min_score,
      maxCandidates: max_candidates,
      dryRun: dry_run,
    });

    // Update workflow run with result
    if (run?.id) {
      await supabase
        .from('hc_workflow_runs')
        .update({
          status: 'completed',
          output_json: {
            processed: result.processed,
            hot: result.hot,
            warm: result.warm,
            cold: result.cold,
          },
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id);

      // Update queue items with workflow_run_id
      if (!dry_run && result.processed > 0) {
        await supabase
          .from('hc_workflow_queues')
          .update({ workflow_run_id: run.id })
          .eq('queue_name', 'claim.create_packet')
          .is('workflow_run_id', null);
      }
    }

    return NextResponse.json({
      ok: true,
      workflow_run_id: run?.id,
      processed: result.processed,
      hot: result.hot,
      warm: result.warm,
      cold: result.cold,
      dry_run,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[claim-sniper cron]', err);

    if (run?.id) {
      await supabase
        .from('hc_workflow_runs')
        .update({
          status: 'failed',
          error_json: { message: msg },
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id);
    }

    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
