import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildOperatorBrief, deliverOperatorBrief } from '@/lib/workflows/operatorBriefing';

/**
 * POST /api/cron/operator-briefing
 * Generates and delivers daily Operator Opportunity Briefings to all active operators.
 *
 * Processes operators in batches of 20 to avoid Vercel function timeout.
 * Secured with CRON_SECRET.
 * Called daily at 07:00 via Vercel cron.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const body = await req.json().catch(() => ({}));
  const { batch_offset = 0, batch_size = 20 } = body;

  // Log workflow run
  const { data: run } = await supabase
    .from('hc_workflow_runs')
    .insert({
      workflow_key: 'operator_opportunity_briefing',
      trigger_type: 'cron',
      trigger_key: 'daily_operator_briefing',
      input_json: { batch_offset, batch_size },
      status: 'running',
    })
    .select('id')
    .single();

  try {
    // Fetch active operators — only those with push tokens or dashboard active
    const { data: operators, error: opErr } = await supabase
      .from('operator_profiles')
      .select('id, user_id, availability_status')
      .in('availability_status', ['online', 'offline', 'away'])
      .not('user_id', 'is', null)
      .range(batch_offset, batch_offset + batch_size - 1);

    if (opErr) throw new Error(`operator fetch error: ${opErr.message}`);
    if (!operators?.length) {
      return NextResponse.json({ ok: true, processed: 0, skipped: 0 });
    }

    let delivered = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const op of operators) {
      try {
        const brief = await buildOperatorBrief(op.id);
        if (!brief) { skipped++; continue; }

        // Only deliver if there's something worth sending
        if (brief.job_cards.length > 0 || brief.urgent_count > 0 || brief.credential_nudges.some((n) => n.urgency !== 'info')) {
          await deliverOperatorBrief(brief, op.user_id);
          delivered++;
        } else {
          // Write to briefings table without push (silent log)
          await supabase.from('hc_briefings').upsert({
            entity_id: op.id,
            briefing_type: 'operator_opportunity',
            date: new Date().toISOString().split('T')[0],
            summary_text: brief.summary,
            urgent_count: 0,
            job_cards_count: 0,
          }, { onConflict: 'entity_id,briefing_type,date' });
          skipped++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        errors.push(`${op.id}: ${msg}`);
      }
    }

    if (run?.id) {
      await supabase
        .from('hc_workflow_runs')
        .update({
          status: errors.length > delivered ? 'failed' : 'completed',
          output_json: { delivered, skipped, errors, batch_offset, batch_size },
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id);
    }

    return NextResponse.json({ ok: true, delivered, skipped, errors, workflow_run_id: run?.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (run?.id) {
      await supabase
        .from('hc_workflow_runs')
        .update({ status: 'failed', error_json: { message: msg }, completed_at: new Date().toISOString() })
        .eq('id', run.id);
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
