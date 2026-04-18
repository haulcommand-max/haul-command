import { NextRequest, NextResponse } from 'next/server';
import { buildBrokerBrief, deliverBrokerBrief } from '@/lib/workflows/brokerBriefing';
import { buildOperatorBrief, deliverOperatorBrief } from '@/lib/workflows/operatorBriefing';
// import { runNoShowRecovery } from '@/lib/workflows/noShowRecovery';
import { createClient } from '@supabase/supabase-js';
import { sendRoutedNotification } from '@/lib/notifications/channelRouter';

// ═══════════════════════════════════════════════════════════════
// /api/cron/workflows — Scheduled workflow trigger
//
// This endpoint is designed to be called by:
//   - Vercel Cron (vercel.json "crons" config)
//   - External scheduler (e.g., Paperclip heartbeat, pg_cron via HTTP)
//   - Manual trigger from HQ dashboard
//
// Workflow schedule:
//   broker_briefing   — daily 06:00 UTC
//   operator_briefing — daily 07:00 UTC  
//   no_show_recovery  — every 4 hours
//
// Security: requires CRON_SECRET header to prevent public abuse.
// ═══════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // allow up to 60s for workflow batch

const CRON_SECRET = process.env.CRON_SECRET || '';

export async function POST(req: NextRequest) {
  // Auth check — cron endpoints must be protected
  const authHeader = req.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { workflow } = await req.json().catch(() => ({ workflow: 'all' }));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const results: Record<string, { status: string; count?: number; error?: string }> = {};

  // ── Broker Morning Briefings ──
  if (workflow === 'all' || workflow === 'broker_briefing') {
    try {
      const { data: brokers } = await supabase
        .from('broker_profiles')
        .select('id, user_id')
        .limit(50);

      let delivered = 0;
      for (const broker of brokers ?? []) {
        const brief = await buildBrokerBrief(broker.id);
        if (brief) {
          await deliverBrokerBrief(brief, broker.user_id);
          delivered++;
        }
      }
      results.broker_briefing = { status: 'ok', count: delivered };
    } catch (err: any) {
      results.broker_briefing = { status: 'error', error: err.message };
    }
  }

  // ── Operator Daily Briefings ──
  if (workflow === 'all' || workflow === 'operator_briefing') {
    try {
      const { data: operators } = await supabase
        .from('operator_profiles')
        .select('id, user_id')
        .eq('availability_status', 'online')
        .limit(100);
      let delivered = 0;
      for (const op of operators ?? []) {
        const brief = await buildOperatorBrief(op.id);
        if (brief) {
          await deliverOperatorBrief(brief, op.user_id);
          delivered++;
        }
      }
      results.operator_briefing = { status: 'ok', count: delivered };
    } catch (err: any) {
      results.operator_briefing = { status: 'error', error: err.message };
    }
  }

  // ── No-Show Recovery ──
  if (workflow === 'all' || workflow === 'no_show_recovery') {
    // Scans for jobs past departure time with no operator check-in
    try {
      const { data: staleJobs } = await supabase
        .from('hc_jobs')
        .select('id, title, broker_id, depart_at')
        .eq('status', 'assigned')
        .lt('depart_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // 30min past departure
        .limit(20);

      let recovered = 0;
      for (const job of staleJobs ?? []) {
        // Insert notification for broker about potential no-show via smart channel router
        await sendRoutedNotification(job.broker_id, {
          type: 'no_show_alert',
          urgency: 'critical',
          title: `⚠️ Possible no-show: ${job.title || job.id}`,
          body: `Operator has not checked in for job departing ${new Date(job.depart_at).toLocaleTimeString()}. Review and reassign if needed.`,
          url: `/jobs/${job.id}`
        });
        recovered++;
      }
      results.no_show_recovery = { status: 'ok', count: recovered };
    } catch (err: any) {
      results.no_show_recovery = { status: 'error', error: err.message };
    }
  }

  // Log execution
  await supabase.from('hc_workflow_runs').insert({
    workflow_name: workflow,
    results_json: results,
    executed_at: new Date().toISOString(),
  }).catch(() => { /* table may not exist yet */ });

  return NextResponse.json({
    ok: true,
    workflow,
    results,
    executed_at: new Date().toISOString(),
  });
}

// GET — health check / status 
export async function GET() {
  return NextResponse.json({
    workflows: [
      { name: 'broker_briefing', schedule: 'daily 06:00 UTC', status: 'active' },
      { name: 'operator_briefing', schedule: 'daily 07:00 UTC', status: 'active' },
      { name: 'no_show_recovery', schedule: 'every 4 hours', status: 'active' },
    ],
    trigger: 'POST /api/cron/workflows with { workflow: "broker_briefing" | "operator_briefing" | "no_show_recovery" | "all" }',
    auth: 'Bearer CRON_SECRET header required',
  });
}
