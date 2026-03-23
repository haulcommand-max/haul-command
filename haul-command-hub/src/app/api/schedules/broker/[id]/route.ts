/**
 * GET /api/schedules/broker/[id]
 *
 * Standing Orders — Broker's recurring schedules with occurrence history.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: brokerId } = await params;

  try {
    const sb = supabaseServer();

    // Get all schedules for this broker
    const { data: schedules, error } = await sb
      .from('recurring_schedules')
      .select('*')
      .eq('broker_id', brokerId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get occurrence counts per schedule
    const scheduleIds = (schedules ?? []).map(s => s.id);
    const { data: occurrences } = await sb
      .from('schedule_occurrences')
      .select('schedule_id, status, scheduled_date, operator_id, escrow_amount')
      .in('schedule_id', scheduleIds.length ? scheduleIds : ['none'])
      .order('scheduled_date', { ascending: true });

    // Group occurrences by schedule
    const occurrenceMap = new Map<string, typeof occurrences>();
    for (const occ of occurrences ?? []) {
      const existing = occurrenceMap.get(occ.schedule_id) ?? [];
      existing.push(occ);
      occurrenceMap.set(occ.schedule_id, existing);
    }

    const result = (schedules ?? []).map(schedule => {
      const occs = occurrenceMap.get(schedule.id) ?? [];
      const statusCounts: Record<string, number> = {};
      for (const o of occs) {
        statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
      }

      return {
        ...schedule,
        occurrences: occs,
        stats: {
          total: occs.length,
          ...statusCounts,
          upcoming: occs.filter(o => ['scheduled', 'dispatched', 'accepted'].includes(o.status)).length,
        },
      };
    });

    return NextResponse.json({ schedules: result });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
