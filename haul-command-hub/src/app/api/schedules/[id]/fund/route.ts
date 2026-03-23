/**
 * POST /api/schedules/[id]/fund
 *
 * Standing Orders — Processes pre-funding payment.
 * Called by Stripe webhook or manually after checkout completion.
 * Activates the schedule and sets escrow balance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const sb = supabaseServer();

    // Get schedule
    const { data: schedule } = await sb
      .from('recurring_schedules')
      .select('id, status, escrow_balance')
      .eq('id', id)
      .single();

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    if (schedule.status !== 'pending_funding') {
      return NextResponse.json({ error: 'Schedule already funded or inactive' }, { status: 400 });
    }

    // Get pending prefunding record
    const { data: prefunding } = await sb
      .from('schedule_prefunding')
      .select('*')
      .eq('schedule_id', id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!prefunding) {
      return NextResponse.json({ error: 'No pending prefunding found' }, { status: 400 });
    }

    // Mark prefunding as completed
    await sb
      .from('schedule_prefunding')
      .update({
        status: 'completed',
        funded_at: new Date().toISOString(),
        stripe_payment_intent_id: body.paymentIntentId ?? null,
      })
      .eq('id', prefunding.id);

    // Activate the schedule with full escrow balance
    await sb
      .from('recurring_schedules')
      .update({
        status: 'active',
        escrow_balance: prefunding.amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      scheduleId: id,
      status: 'active',
      escrowBalance: prefunding.amount,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
