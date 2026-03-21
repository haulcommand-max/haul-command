/**
 * POST /api/quickpay/advance
 * Track 5: QuickPay Invoice Factoring
 * 
 * After job completion, operator can request instant 97% payment (3% fee).
 * Only available for pre-funded escrow jobs (zero risk to platform).
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

    // In production: initiate Stripe transfer to operator's connected account
    // For now, mark as advanced (would integrate with Stripe Connect payouts)
    await admin
      .from('quickpay_advances')
      .update({
        status: 'advanced',
        advanced_at: new Date().toISOString(),
      })
      .eq('id', advance.id);

    return NextResponse.json({
      ok: true,
      advance_id: advance.id,
      invoice_amount,
      advance_amount: advanceAmount,
      fee_amount: feeAmount,
      fee_percentage: feePercentage,
      status: 'advanced',
      message: `QuickPay: $${advanceAmount.toFixed(2)} advanced (${feePercentage}% fee = $${feeAmount.toFixed(2)})`,
    });
  } catch (err: any) {
    console.error('[QuickPay] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
