/**
 * POST /api/escrow/create
 * Creates an escrow hold for a job. 5% platform fee.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

const ESCROW_FEE_PCT = 0.05; // 5%

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_id, payer_id, payee_id, amount_usd, description } = body;

    if (!job_id || !payer_id || !payee_id || !amount_usd) {
      return NextResponse.json({ error: 'job_id, payer_id, payee_id, and amount_usd required' }, { status: 400 });
    }

    if (amount_usd <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    const fee = Math.round(amount_usd * ESCROW_FEE_PCT * 100) / 100;
    const sb = supabaseServer();

    const { data, error } = await sb.from('escrow_holds').insert({
      job_id,
      payer_id,
      payee_id,
      amount_usd,
      fee_usd: fee,
      net_amount_usd: amount_usd - fee,
      status: 'held',
      description: description || `Escrow for job ${job_id}`,
      created_at: new Date().toISOString(),
    }).select().single();

    if (error) {
      console.error('[Escrow Create] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      escrow_id: data.id,
      status: 'held',
      amount_usd,
      fee_usd: fee,
      net_amount_usd: amount_usd - fee,
      message: `Escrow created. ${ESCROW_FEE_PCT * 100}% platform fee applied.`,
    });
  } catch (err) {
    console.error('[Escrow Create] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
