/**
 * POST /api/emergency/breakdown/accept
 * Track 4: Accept breakdown replacement
 * 
 * First operator to accept gets the job.
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

    const { breakdown_id } = await req.json();
    if (!breakdown_id) return NextResponse.json({ error: 'breakdown_id required' }, { status: 400 });

    const admin = getSupabaseAdmin();

    // Check breakdown is still available
    const { data: bd } = await admin
      .from('breakdown_replacements')
      .select('*')
      .eq('id', breakdown_id)
      .single();

    if (!bd) return NextResponse.json({ error: 'Breakdown not found' }, { status: 404 });
    if (bd.status === 'accepted' || bd.status === 'en_route') {
      return NextResponse.json({ error: 'Already accepted by another operator' }, { status: 409 });
    }

    // Accept the job
    const { error: updateErr } = await admin
      .from('breakdown_replacements')
      .update({
        replacement_operator_id: user.id,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        broker_notified: true,
        replacement_eta_minutes: 45, // Default ETA — would calculate from GPS
        updated_at: new Date().toISOString(),
      })
      .eq('id', breakdown_id)
      .eq('status', 'notified'); // Race condition protection

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to accept — may have been taken' }, { status: 409 });
    }

    // Block acceptance date on operator calendar
    const today = new Date().toISOString().split('T')[0];
    try {
      await admin.from('operator_availability').upsert({
        operator_id: user.id,
        date: today,
        status: 'booked',
        job_id: bd.original_job_id,
      }, { onConflict: 'operator_id,date' });
    } catch (e) { /* non-fatal */ }

    return NextResponse.json({
      ok: true,
      breakdown_id,
      premium_rate: bd.premium_rate,
      miles_remaining: bd.miles_remaining,
      corridor: bd.corridor,
      status: 'accepted',
    });
  } catch (err: any) {
    console.error('[Breakdown Accept] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
