/**
 * POST /api/escrow/dispute
 * Opens a dispute on an escrowed job. Freezes funds until resolution.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { escrow_id, disputant_id, reason, evidence_urls } = body;

    if (!escrow_id || !disputant_id || !reason) {
      return NextResponse.json({ error: 'escrow_id, disputant_id, and reason required' }, { status: 400 });
    }

    const sb = supabaseServer();

    const { data: hold, error: fetchErr } = await sb
      .from('escrow_holds')
      .select('*')
      .eq('id', escrow_id)
      .single();

    if (fetchErr || !hold) {
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 });
    }

    if (hold.status !== 'held') {
      return NextResponse.json({ error: `Cannot dispute: status is ${hold.status}` }, { status: 400 });
    }

    // Update escrow status to disputed
    await sb.from('escrow_holds').update({
      status: 'disputed',
      disputed_at: new Date().toISOString(),
    }).eq('id', escrow_id);

    // Create dispute record
    const { data: dispute, error: insertErr } = await sb.from('escrow_disputes').insert({
      escrow_id,
      disputant_id,
      reason,
      evidence_urls: evidence_urls || [],
      status: 'open',
      created_at: new Date().toISOString(),
    }).select().single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      dispute_id: dispute?.id,
      escrow_id,
      status: 'disputed',
      message: 'Dispute opened. Funds are frozen until resolution. Our team will review within 48 hours.',
    });
  } catch (err) {
    console.error('[Escrow Dispute] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
