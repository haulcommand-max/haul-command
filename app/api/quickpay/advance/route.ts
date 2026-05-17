/**
 * POST /api/quickpay/advance
 * Track 5: QuickPay Invoice Factoring
 * 
 * After job completion, operator can request 97% payment (3% fee).
 * The request stays pending until a payout rail confirms transfer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { job_id, invoice_amount } = await req.json();

    if (!job_id || !invoice_amount || invoice_amount <= 0) {
      return NextResponse.json({ error: 'job_id and positive invoice_amount required' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const feePercentage = 3.00;
    const feeAmount = Math.round(invoice_amount * (feePercentage / 100) * 100) / 100;
    const advanceAmount = Math.round((invoice_amount - feeAmount) * 100) / 100;

    // Check for duplicate advance on same job
    const { data: existing } = await admin
      .from('quickpay_advances')
      .select('id')
      .eq('job_id', job_id)
      .eq('operator_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'QuickPay already requested for this job' }, { status: 409 });
    }

    // Create advance record
    const { data: advance, error: advanceErr } = await admin
      .from('quickpay_advances')
      .insert({
        job_id,
        operator_id: user.id,
        invoice_amount,
        advance_amount: advanceAmount,
        fee_amount: feeAmount,
        fee_percentage: feePercentage,
        status: 'pending',
      })
      .select()
      .single();

    if (advanceErr) {
      console.error('[QuickPay] Insert error:', advanceErr);
      return NextResponse.json({ error: 'Failed to create advance' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      advance_id: advance.id,
      invoice_amount,
      advance_amount: advanceAmount,
      fee_amount: feeAmount,
      fee_percentage: feePercentage,
      status: 'pending_payout',
      message: `QuickPay request created for $${advanceAmount.toFixed(2)} (${feePercentage}% fee = $${feeAmount.toFixed(2)}). Funds are not advanced until Stripe Connect payout is configured and confirmed.`,
    });
  } catch (err: any) {
    console.error('[QuickPay] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
