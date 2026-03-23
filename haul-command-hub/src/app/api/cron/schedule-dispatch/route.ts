/**
 * POST /api/cron/schedule-dispatch
 *
 * Standing Orders — Daily dispatch cron (5am UTC).
 * Finds all occurrences scheduled for the next 24 hours,
 * checks escrow, dispatches to operators, flags compliance issues.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const CRON_KEY = process.env.HC_CRON_KEY ?? 'hc_cron_2026_s3cure_r4ndom_k3y_9x';

export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.includes(CRON_KEY)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sb = supabaseServer();
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const todayStr = now.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const results = {
      dispatched: 0,
      escrow_insufficient: 0,
      compliance_hold: 0,
      no_operator: 0,
      errors: 0,
      already_dispatched: 0,
    };

    // Find all occurrences scheduled for today or tomorrow that haven't been dispatched
    const { data: pendingOccurrences } = await sb
      .from('schedule_occurrences')
      .select(`
        *,
        recurring_schedules!inner(
          id, status, escrow_balance, preferred_operator_id,
          origin_jurisdiction, destination_jurisdiction, corridor_slug,
          title, rate_per_occurrence, priority_dispatch
        )
      `)
      .in('scheduled_date', [todayStr, tomorrowStr])
      .eq('status', 'scheduled');

    if (!pendingOccurrences?.length) {
      return NextResponse.json({
        message: 'No occurrences to dispatch',
        dates: { today: todayStr, tomorrow: tomorrowStr },
        ...results,
      });
    }

    for (const occ of pendingOccurrences) {
      const schedule = occ.recurring_schedules;

      // Skip if schedule isn't active
      if (schedule.status !== 'active') {
        results.already_dispatched++;
        continue;
      }

      // Check escrow balance
      if ((schedule.escrow_balance ?? 0) < (occ.escrow_amount ?? 0)) {
        results.escrow_insufficient++;

        // Flag the occurrence
        await sb
          .from('schedule_occurrences')
          .update({ notes: 'Insufficient escrow — funding required' })
          .eq('id', occ.id);

        continue;
      }

      // Check compliance flags
      const complianceFlags = occ.compliance_flags ?? [];
      const hasCritical = complianceFlags.some(
        (f: { severity: string }) => f.severity === 'critical',
      );

      if (hasCritical) {
        await sb
          .from('schedule_occurrences')
          .update({
            status: 'compliance_hold',
            notes: `Compliance hold: ${complianceFlags.map((f: { flag: string }) => f.flag).join('; ')}`,
          })
          .eq('id', occ.id);

        results.compliance_hold++;
        continue;
      }

      // Find operator: preferred first, then corridor fallback
      let operatorId = schedule.preferred_operator_id;

      if (!operatorId) {
        const originState = schedule.origin_jurisdiction.split('-')[1] ?? schedule.origin_jurisdiction;
        const { data: operators } = await sb
          .from('hc_places')
          .select('id')
          .eq('status', 'published')
          .ilike('admin1_code', `%${originState}%`)
          .limit(5);

        operatorId = operators?.[0]?.id ?? null;
      }

      if (!operatorId) {
        results.no_operator++;
        await sb
          .from('schedule_occurrences')
          .update({ notes: 'No operator available on corridor' })
          .eq('id', occ.id);
        continue;
      }

      // Dispatch!
      await sb
        .from('schedule_occurrences')
        .update({
          operator_id: operatorId,
          status: 'dispatched',
          dispatched_at: now.toISOString(),
        })
        .eq('id', occ.id);

      results.dispatched++;

      // TODO: FCM push notification
      // `Standing Order confirmed for ${occ.scheduled_date} — ${schedule.title} — $${schedule.rate_per_occurrence} — your assignment`
    }

    // Update next_dispatch_date for all affected schedules
    const scheduleIds = [...new Set(pendingOccurrences.map(o => o.schedule_id))];
    for (const schedId of scheduleIds) {
      const { data: nextOcc } = await sb
        .from('schedule_occurrences')
        .select('scheduled_date')
        .eq('schedule_id', schedId)
        .eq('status', 'scheduled')
        .order('scheduled_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      await sb
        .from('recurring_schedules')
        .update({
          next_dispatch_date: nextOcc?.scheduled_date ?? null,
          updated_at: now.toISOString(),
        })
        .eq('id', schedId);
    }

    return NextResponse.json({
      message: 'Standing Orders dispatch complete',
      dates: { today: todayStr, tomorrow: tomorrowStr },
      processed: pendingOccurrences.length,
      ...results,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    service: 'standing-orders-dispatch',
    schedule: 'daily 5am UTC',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
