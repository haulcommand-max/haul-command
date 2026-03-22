/**
 * POST /api/quickpay/factor
 * QuickPay Factoring — 3% fee, instant payment from escrowed funds.
 * Operator gets paid immediately; HC collects when job completes.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

const QUICKPAY_FEE_PCT = 0.03; // 3%

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { escrow_id, operator_id } = body;

    if (!escrow_id || !operator_id) {
      return NextResponse.json({ error: 'escrow_id and operator_id required' }, { status: 400 });
    }

    const sb = supabaseServer();

    // Get escrow
    const { data: hold, error: fetchErr } = await sb
      .from('escrow_holds')
      .select('*')
      .eq('id', escrow_id)
      .single();

    if (fetchErr || !hold) {
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 });
    }

    if (hold.status !== 'held') {
      return NextResponse.json({ error: `Cannot factor: status is ${hold.status}` }, { status: 400 });
    }

    if (hold.payee_id !== operator_id) {
      return NextResponse.json({ error: 'Only the payee can request QuickPay' }, { status: 403 });
    }

    const factorFee = Math.round(hold.net_amount_usd * QUICKPAY_FEE_PCT * 100) / 100;
    const instantPayout = hold.net_amount_usd - factorFee;

    // Mark escrow as factored
    await sb.from('escrow_holds').update({
      status: 'factored',
      factored_at: new Date().toISOString(),
      quickpay_fee_usd: factorFee,
      quickpay_payout_usd: instantPayout,
    }).eq('id', escrow_id);

    // Credit operator's wallet immediately
    await sb.from('hc_pay_ledger').insert({
      user_id: operator_id,
      type: 'quickpay_advance',
      amount: instantPayout,
      currency: 'USD',
      reference_id: escrow_id,
      description: `QuickPay advance for job ${hold.job_id} (${QUICKPAY_FEE_PCT * 100}% fee)`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      status: 'factored',
      escrow_id,
      original_amount: hold.net_amount_usd,
      quickpay_fee_usd: factorFee,
      instant_payout_usd: instantPayout,
      message: `QuickPay complete. $${instantPayout.toFixed(2)} credited instantly. ${QUICKPAY_FEE_PCT * 100}% factoring fee applied.`,
    });
  } catch (err) {
    console.error('[QuickPay Factor] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
