/**
 * POST /api/escrow/release
 * Releases escrowed funds to the payee after job completion.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { escrow_id, released_by } = body;

    if (!escrow_id) {
      return NextResponse.json({ error: 'escrow_id required' }, { status: 400 });
    }

    const sb = supabaseServer();

    // Get the escrow hold
    const { data: hold, error: fetchErr } = await sb
      .from('escrow_holds')
      .select('*')
      .eq('id', escrow_id)
      .single();

    if (fetchErr || !hold) {
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 });
    }

    if (hold.status !== 'held') {
      return NextResponse.json({ error: `Cannot release: status is ${hold.status}` }, { status: 400 });
    }

    // Release the funds
    const { error: updateErr } = await sb
      .from('escrow_holds')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
        released_by: released_by || 'system',
      })
      .eq('id', escrow_id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Credit the payee's HC Pay wallet
    try {
      await sb.from('hc_pay_ledger').insert({
        user_id: hold.payee_id,
        type: 'escrow_release',
        amount: hold.net_amount_usd,
        currency: 'USD',
        reference_id: escrow_id,
        description: `Escrow release for job ${hold.job_id}`,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Ledger entry is best-effort
    }

    return NextResponse.json({
      status: 'released',
      escrow_id,
      net_amount_usd: hold.net_amount_usd,
      payee_id: hold.payee_id,
    });
  } catch (err) {
    console.error('[Escrow Release] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
