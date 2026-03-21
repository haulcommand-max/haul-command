/**
 * POST /api/permits/request
 * Track 3: Create a permit request
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

    const body = await req.json();
    const { origin_state, destination_states, load_dimensions, needed_by_date, notes } = body;

    if (!origin_state || !destination_states || destination_states.length === 0) {
      return NextResponse.json({ error: 'origin_state and destination_states required' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('permit_requests')
      .insert({
        requester_id: user.id,
        origin_state,
        destination_states,
        load_dimensions: load_dimensions || {},
        needed_by_date: needed_by_date || null,
        notes: notes || null,
        status: 'open',
        platform_fee: 0, // Calculated when agent sets fee
      })
      .select()
      .single();

    if (error) {
      console.error('[Permits] Insert error:', error);
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, request_id: data.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
