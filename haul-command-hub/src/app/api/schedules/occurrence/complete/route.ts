import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/* ══════════════════════════════════════════════════════
   /api/schedules/occurrence/complete
   Marks a schedule occurrence as completed.
   The DB trigger automatically deducts from escrow.
   ══════════════════════════════════════════════════════ */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { occurrence_id } = body;

    if (!occurrence_id) {
      return NextResponse.json({ error: 'occurrence_id is required' }, { status: 400 });
    }

    // Update the occurrence status to 'completed'
    // The DB trigger `decrement_escrow_on_occurrence_completion` fires automatically
    const { data, error } = await supabase
      .from('schedule_occurrences')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', occurrence_id)
      .select()
      .single();

    if (error) {
      console.error('[occurrence/complete] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the event
    supabase.from('hc_events').insert({
      event_type: 'occurrence_completed',
      payload: { occurrence_id, completed_at: new Date().toISOString() },
    }).then(() => {}); // Non-blocking logging

    return NextResponse.json({
      success: true,
      occurrence: data,
      message: 'Occurrence marked as completed. Escrow has been deducted automatically.',
    });
  } catch (err) {
    console.error('[occurrence/complete] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
