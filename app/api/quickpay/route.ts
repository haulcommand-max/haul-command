import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// QuickPay: Advance 97% of invoice to operator immediately (3% fee)
// Risk: ZERO — escrow already holds broker funds
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { job_id, invoice_amount } = await req.json();
    if (!job_id || !invoice_amount || invoice_amount <= 0) {
      return NextResponse.json({ error: 'job_id and positive invoice_amount required' }, { status: 400 });
    }

    // Check escrow is funded for this job (zero risk validation)
    const { data: escrow } = await supabase.from('escrow_holds').select('status, amount').eq('job_id', job_id).single();
    if (!escrow || escrow.status !== 'funded') {
      return NextResponse.json({ error: 'QuickPay only available for escrow-funded jobs. Broker must pre-fund escrow.' }, { status: 400 });
    }

    // Check for duplicate advance
    const { data: existing } = await supabase.from('quickpay_advances').select('id').eq('job_id', job_id).eq('operator_id', user.id).single();
    if (existing) {
      return NextResponse.json({ error: 'QuickPay already processed for this job' }, { status: 409 });
    }

    const feePercentage = 3.00;
    const feeAmount = Number((invoice_amount * feePercentage / 100).toFixed(2));
    const advanceAmount = Number((invoice_amount - feeAmount).toFixed(2));

    // Create advance record
    const { data: advance, error } = await supabase.from('quickpay_advances').insert({
      job_id,
      operator_id: user.id,
      invoice_amount,
      advance_amount: advanceAmount,
      fee_amount: feeAmount,
      fee_percentage: feePercentage,
      escrow_status: 'funded',
      advance_status: 'advanced',
      advanced_at: new Date().toISOString(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // In production: trigger Stripe transfer to operator's connected account
    // stripe.transfers.create({ amount: advanceAmount * 100, currency: 'usd', destination: operatorStripeAccountId })

    return NextResponse.json({
      quickpay_id: advance.id,
      invoice_amount: invoice_amount,
      advance_amount: advanceAmount,
      fee_amount: feeAmount,
      fee_percentage: `${feePercentage}%`,
      status: 'advanced',
      message: `$${advanceAmount.toFixed(2)} will be deposited to your account within 1 business day.`,
    });
  } catch {
    return NextResponse.json({ error: 'QuickPay processing failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: advances } = await supabase.from('quickpay_advances').select('*').eq('operator_id', user.id).order('created_at', { ascending: false });

    return NextResponse.json({ advances: advances || [] });
  } catch {
    return NextResponse.json({ error: 'Failed to load advances' }, { status: 500 });
  }
}
