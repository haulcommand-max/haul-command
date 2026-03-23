/**
 * POST /api/schedules/[id]/occurrences/[occurrenceId]/complete
 *
 * Standing Orders — Marks occurrence as completed.
 * Releases escrow to operator minus platform fee.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; occurrenceId: string }> },
) {
  const { id, occurrenceId } = await params;

  try {
    const sb = supabaseServer();

    const { data: occurrence } = await sb
      .from('schedule_occurrences')
      .select('*')
      .eq('id', occurrenceId)
      .eq('schedule_id', id)
      .single();

    if (!occurrence) {
      return NextResponse.json({ error: 'Occurrence not found' }, { status: 404 });
    }

    if (!['dispatched', 'accepted', 'in_progress'].includes(occurrence.status)) {
      return NextResponse.json({ error: `Cannot complete occurrence in status: ${occurrence.status}` }, { status: 400 });
    }

    // Mark as completed
    await sb
      .from('schedule_occurrences')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', occurrenceId);

    // Deduct from escrow balance and increment completed count
    const { data: schedule } = await sb
      .from('recurring_schedules')
      .select('escrow_balance, completed_occurrences, total_occurrences')
      .eq('id', id)
      .single();

    if (schedule) {
      const newBalance = Math.max(0, (schedule.escrow_balance ?? 0) - (occurrence.escrow_amount ?? 0));
      const newCompleted = (schedule.completed_occurrences ?? 0) + 1;
      const isComplete = newCompleted >= (schedule.total_occurrences ?? 0);

      await sb
        .from('recurring_schedules')
        .update({
          escrow_balance: newBalance,
          completed_occurrences: newCompleted,
          status: isComplete ? 'completed' : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    return NextResponse.json({
      success: true,
      occurrenceId,
      operatorPayout: occurrence.operator_payout,
      platformFee: occurrence.platform_fee,
      status: 'completed',
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
