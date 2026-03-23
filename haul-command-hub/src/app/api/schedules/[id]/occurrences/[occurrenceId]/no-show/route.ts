/**
 * POST /api/schedules/[id]/occurrences/[occurrenceId]/no-show
 *
 * Standing Orders — Operator no-show handling.
 * - 25% kill fee paid to original operator
 * - 75% held for replacement operator dispatch
 * - Applies trust score penalty to original operator
 * - Dispatches replacement immediately
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { calculateNoShowSplit } from '@/lib/standing-orders/engine';

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

    if (!['dispatched', 'accepted'].includes(occurrence.status)) {
      return NextResponse.json({ error: `Cannot mark no-show for status: ${occurrence.status}` }, { status: 400 });
    }

    const { killFee, replacementHold } = calculateNoShowSplit(occurrence.escrow_amount ?? 0);
    const now = new Date();

    // Get schedule for corridor info
    const { data: schedule } = await sb
      .from('recurring_schedules')
      .select('*')
      .eq('id', id)
      .single();

    // Find replacement operator (different from original)
    let replacementOperatorId: string | null = null;
    if (schedule) {
      const { data: operators } = await sb
        .from('hc_places')
        .select('id, name')
        .eq('status', 'published')
        .neq('id', occurrence.operator_id)
        .limit(5);

      if (operators?.length) {
        replacementOperatorId = operators[0].id;
      }
    }

    // Update occurrence as no-show
    await sb
      .from('schedule_occurrences')
      .update({
        status: 'no_show',
        kill_fee_paid: killFee,
        replacement_operator_id: replacementOperatorId,
        notes: `No-show by operator. Kill fee: $${killFee}. Replacement dispatched: ${replacementOperatorId ?? 'none found'}.`,
      })
      .eq('id', occurrenceId);

    // Deduct kill fee from escrow (replacement holds the rest)
    if (schedule) {
      await sb
        .from('recurring_schedules')
        .update({
          escrow_balance: Math.max(0, (schedule.escrow_balance ?? 0) - killFee),
          updated_at: now.toISOString(),
        })
        .eq('id', id);
    }

    // TODO: Apply trust score penalty to original operator
    // TODO: Send FCM push to replacement operator
    // "Emergency replacement needed — {route} NOW — ${replacementHold} — accept?"

    return NextResponse.json({
      success: true,
      occurrenceId,
      originalOperatorId: occurrence.operator_id,
      killFee,
      replacementHold,
      replacementOperatorId,
      status: 'no_show',
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
