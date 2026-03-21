import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Accept emergency replacement job
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { replacement_id } = await req.json();
    if (!replacement_id) return NextResponse.json({ error: 'replacement_id required' }, { status: 400 });

    // Check if already accepted
    const { data: existing } = await supabase.from('emergency_replacements').select('status').eq('id', replacement_id).single();
    if (!existing) return NextResponse.json({ error: 'Replacement not found' }, { status: 404 });
    if (existing.status === 'accepted') return NextResponse.json({ error: 'Already accepted by another operator' }, { status: 409 });

    // Accept the replacement
    const { data, error } = await supabase.from('emergency_replacements').update({
      replacement_operator_id: user.id,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    }).eq('id', replacement_id).eq('status', 'notified').select().single();

    if (error || !data) return NextResponse.json({ error: 'Failed to accept — may have been claimed' }, { status: 409 });

    // Block this date on the accepting operator's calendar
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('operator_availability').upsert({
      operator_id: user.id,
      available_date: today,
      status: 'booked',
      job_id: data.original_job_id,
    }, { onConflict: 'operator_id,available_date' });

    return NextResponse.json({
      accepted: true,
      replacement_id: data.id,
      premium_rate: data.premium_rate,
      miles_remaining: data.miles_remaining,
    });
  } catch {
    return NextResponse.json({ error: 'Accept failed' }, { status: 500 });
  }
}
