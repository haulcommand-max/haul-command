/**
 * POST /api/training/enroll
 * Records a training enrollment after Stripe payment confirmation.
 * Called by the Stripe webhook (training_enrollment type) or directly by server actions.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { user_id, training_node_id, stripe_session_id, purchased_at } = body;

    if (!user_id || !training_node_id) {
      return NextResponse.json({ error: 'user_id and training_node_id required' }, { status: 400 });
    }

    const supabase = supabaseServer();

    // Resolve training catalog id from node_id
    const { data: catalog, error: catalogErr } = await supabase
      .from('training_catalog')
      .select('id')
      .eq('node_id', training_node_id)
      .single();

    if (catalogErr || !catalog) {
      return NextResponse.json({ error: 'Training not found' }, { status: 404 });
    }

    // Upsert enrollment
    const { error: enrollErr } = await supabase
      .from('training_enrollments')
      .upsert({
        user_id,
        training_id: catalog.id,
        status: 'enrolled',
        purchased_at: purchased_at ?? new Date().toISOString(),
        stripe_session_id: stripe_session_id ?? null,
      }, { onConflict: 'user_id,training_id' });

    if (enrollErr) {
      console.error('[Training Enroll] upsert error:', enrollErr.message);
      return NextResponse.json({ error: 'Enrollment failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, training_id: catalog.id });
  } catch (err) {
    console.error('[Training Enroll] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
