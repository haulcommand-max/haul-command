/**
 * POST /api/schedules/[id]/dispatch
 *
 * Standing Orders — Dispatch next occurrence.
 * Called by cron 24h before scheduled date.
 * Assigns preferred operator or best available on corridor.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const sb = supabaseServer();

    // Get schedule with escrow balance
    const { data: schedule } = await sb
      .from('recurring_schedules')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (!schedule) {
      return NextResponse.json({ error: 'Active schedule not found' }, { status: 404 });
    }

    // Get next undispatched occurrence
    const { data: occurrence } = await sb
      .from('schedule_occurrences')
      .select('*')
      .eq('schedule_id', id)
      .eq('status', 'scheduled')
      .order('scheduled_date', { ascending: true })
      .limit(1)
      .single();

    if (!occurrence) {
      return NextResponse.json({ message: 'No pending occurrences to dispatch' });
    }

    // Check escrow balance
    if (schedule.escrow_balance < occurrence.escrow_amount) {
      return NextResponse.json({
        error: 'Insufficient escrow balance',
        required: occurrence.escrow_amount,
        available: schedule.escrow_balance,
      }, { status: 402 });
    }

    // Determine operator: preferred first, then best available on corridor
    let assignedOperatorId = schedule.preferred_operator_id;

    if (!assignedOperatorId) {
      // Find best available operator on this corridor
      const { data: operators } = await sb
        .from('hc_places')
        .select('id, name, admin1_code')
        .eq('status', 'published')
        .ilike('admin1_code', `%${schedule.origin_jurisdiction.split('-')[1] ?? schedule.origin_jurisdiction}%`)
        .limit(10);

      if (operators?.length) {
        // Pick first available (in production: rank by trust score, proximity, availability)
        assignedOperatorId = operators[0].id;
      }
    }

    // Check for compliance flags on this occurrence
    const complianceFlags = occurrence.compliance_flags ?? [];
    const hasComplianceHold = complianceFlags.some(
      (f: { severity: string }) => f.severity === 'critical',
    );

    const newStatus = hasComplianceHold ? 'compliance_hold' : 'dispatched';

    // Update occurrence with assigned operator
    await sb
      .from('schedule_occurrences')
      .update({
        operator_id: assignedOperatorId,
        status: newStatus,
        dispatched_at: new Date().toISOString(),
      })
      .eq('id', occurrence.id);

    // Update schedule next dispatch date
    const { data: nextOcc } = await sb
      .from('schedule_occurrences')
      .select('scheduled_date')
      .eq('schedule_id', id)
      .eq('status', 'scheduled')
      .order('scheduled_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    await sb
      .from('recurring_schedules')
      .update({
        next_dispatch_date: nextOcc?.scheduled_date ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    // TODO: Send FCM push notification to assigned operator
    // "Standing Order confirmed for tomorrow — {route} {time} — ${rate} — your assignment"

    return NextResponse.json({
      success: true,
      occurrenceId: occurrence.id,
      scheduledDate: occurrence.scheduled_date,
      operatorId: assignedOperatorId,
      status: newStatus,
      complianceHold: hasComplianceHold,
      complianceFlags,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
