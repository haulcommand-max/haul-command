import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    const body = await req.json();
    const { origin_state, destination_states, load_dimensions, needed_by_date, notes } = body;
    if (!origin_state || !destination_states?.length) {
      return NextResponse.json({ error: 'Origin and destination states required' }, { status: 400 });
    }

    const { data, error } = await supabase.from('permit_requests').insert({
      requester_id: user.id,
      origin_state,
      destination_states,
      load_dimensions: load_dimensions || {},
      needed_by_date: needed_by_date || null,
      notes: notes || null,
      status: 'open',
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data.id, status: 'open' });
  } catch {
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}
