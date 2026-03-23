/**
 * GET /api/schedules/operator/[id]
 *
 * Standing Orders — Operator's recurring assignments.
 * Shows assigned occurrences, earnings forecast, and conflict detection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: operatorId } = await params;

  try {
    const sb = supabaseServer();

    // Get all occurrences assigned to this operator
    const { data: occurrences, error } = await sb
      .from('schedule_occurrences')
      .select(`
        *,
        recurring_schedules!inner(
          id, title, origin_jurisdiction, destination_jurisdiction,
          corridor_slug, load_type, rate_per_occurrence, frequency,
          broker_id, status
        )
      `)
      .or(`operator_id.eq.${operatorId},replacement_operator_id.eq.${operatorId}`)
      .order('scheduled_date', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const now = new Date();
    const upcomingOccs = (occurrences ?? []).filter(o => {
      return ['scheduled', 'dispatched', 'accepted', 'in_progress'].includes(o.status) &&
        new Date(o.scheduled_date) >= now;
    });
    const completedOccs = (occurrences ?? []).filter(o => o.status === 'completed');

    // Earnings forecast
    const earnedToDate = completedOccs.reduce((sum, o) => sum + (o.operator_payout ?? 0), 0);
    const projectedEarnings = upcomingOccs.reduce((sum, o) => sum + (o.operator_payout ?? 0), 0);

    // Conflict detection — check for overlapping dates
    const dateMap = new Map<string, typeof occurrences>();
    for (const occ of upcomingOccs) {
      const existing = dateMap.get(occ.scheduled_date) ?? [];
      existing.push(occ);
      dateMap.set(occ.scheduled_date, existing);
    }
    const conflicts = Array.from(dateMap.entries())
      .filter(([, occs]) => (occs?.length ?? 0) > 1)
      .map(([date, occs]) => ({
        date,
        scheduleIds: (occs ?? []).map(o => o.schedule_id),
        count: occs?.length ?? 0,
      }));

    return NextResponse.json({
      operatorId,
      upcoming: upcomingOccs,
      completed: completedOccs,
      earnings: {
        earnedToDate: Math.round(earnedToDate * 100) / 100,
        projectedEarnings: Math.round(projectedEarnings * 100) / 100,
        totalProjected: Math.round((earnedToDate + projectedEarnings) * 100) / 100,
        completedRuns: completedOccs.length,
        upcomingRuns: upcomingOccs.length,
      },
      conflicts,
      totalAssignments: (occurrences ?? []).length,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
