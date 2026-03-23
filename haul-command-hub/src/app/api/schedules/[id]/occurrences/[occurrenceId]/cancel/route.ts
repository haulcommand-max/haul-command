/**
 * POST /api/schedules/[id]/occurrences/[occurrenceId]/cancel
 *
 * Standing Orders — Cancel a single occurrence.
 * Applies tiered cancellation fee based on notice period:
 *   <24h: 10% fee
 *   24-48h: 5% fee
 *   48h+: free cancellation
 * Refunds remainder to schedule escrow balance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { calculateCancellationFee } from '@/lib/standing-orders/engine';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; occurrenceId: string }> },
) {
  const { id, occurrenceId } = await params;

  try {
    const body = await request.json().catch(() => ({}));
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

    if (['completed', 'cancelled', 'no_show'].includes(occurrence.status)) {
      return NextResponse.json({ error: `Cannot cancel occurrence in status: ${occurrence.status}` }, { status: 400 });
    }

    const now = new Date();
    const { feePercent, feeAmount, refundAmount } = calculateCancellationFee(
      occurrence.escrow_amount ?? 0,
      occurrence.scheduled_date,
      occurrence.scheduled_time ?? '06:00',
      now,
    );

    // Update occurrence
    await sb
      .from('schedule_occurrences')
      .update({
        status: 'cancelled',
        cancelled_at: now.toISOString(),
        cancellation_reason: body.reason ?? 'Broker cancelled',
        cancellation_fee: feeAmount,
      })
      .eq('id', occurrenceId);

    // Refund the non-fee portion back to escrow balance
    if (refundAmount > 0) {
      const { data: schedule } = await sb
        .from('recurring_schedules')
        .select('escrow_balance')
        .eq('id', id)
        .single();

      if (schedule) {
        // Since we never deducted the escrow for uncompleted runs,
        // we only need to deduct the cancellation fee from the balance
        const newBalance = Math.max(0, (schedule.escrow_balance ?? 0) - feeAmount);

        await sb
          .from('recurring_schedules')
          .update({
            escrow_balance: newBalance,
            updated_at: now.toISOString(),
          })
          .eq('id', id);
      }
    }

    return NextResponse.json({
      success: true,
      occurrenceId,
      scheduledDate: occurrence.scheduled_date,
      feePercent,
      feeAmount,
      refundAmount,
      status: 'cancelled',
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
