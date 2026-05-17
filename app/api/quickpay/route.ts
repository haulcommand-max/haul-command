import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// QuickPay accepts payout requests against escrow-funded invoices.
// Funds are not marked advanced until the payout rail confirms transfer.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { job_id, invoice_amount } = await req.json();
    if (!job_id || !invoice_amount || invoice_amount <= 0) {
      return NextResponse.json({ error: 'job_id and positive invoice_amount required' }, { status: 400 });
    }

    const { data: escrow } = await supabase
      .from('escrow_holds')
      .select('status, amount')
      .eq('job_id', job_id)
      .single();

    if (!escrow || escrow.status !== 'funded') {
      return NextResponse.json({ error: 'QuickPay only available for escrow-funded jobs. Broker must pre-fund escrow.' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('quickpay_advances')
      .select('id')
      .eq('job_id', job_id)
      .eq('operator_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'QuickPay already processed for this job' }, { status: 409 });
    }

    const feePercentage = 3.00;
    const feeAmount = Number((invoice_amount * feePercentage / 100).toFixed(2));
    const advanceAmount = Number((invoice_amount - feeAmount).toFixed(2));

    const { data: advance, error } = await supabase
      .from('quickpay_advances')
      .insert({
        job_id,
        operator_id: user.id,
        invoice_amount,
        advance_amount: advanceAmount,
        fee_amount: feeAmount,
        fee_percentage: feePercentage,
        escrow_status: 'funded',
        advance_status: 'pending_payout',
        advanced_at: null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      quickpay_id: advance.id,
      invoice_amount,
      advance_amount: advanceAmount,
      fee_amount: feeAmount,
      fee_percentage: `${feePercentage}%`,
      status: 'pending_payout',
      message: `QuickPay request created for $${advanceAmount.toFixed(2)}. Funds are not advanced until Stripe Connect payout is configured and confirmed.`,
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

    const { data: advances } = await supabase
      .from('quickpay_advances')
      .select('*')
      .eq('operator_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ advances: advances || [] });
  } catch {
    return NextResponse.json({ error: 'Failed to load advances' }, { status: 500 });
  }
}
