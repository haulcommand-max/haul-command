import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DISPATCH STATE MACHINE API — TASK 4
 * 
 * POST /api/dispatch/transition
 * Body: { dispatch_id, to_status, reason?, metadata? }
 *
 * Calls the transition_dispatch RPC which enforces:
 * - Valid state transitions (e.g., draft→searching, but NOT draft→completed)
 * - Pre-condition gates (credential verification before in_transit)
 * - Route survey clearance before transit
 * - Side-effect recording (no-show violations, trust score impacts)
 */
export async function POST(request: Request) {
  try {
    const { dispatch_id, to_status, reason, metadata } = await request.json();

    if (!dispatch_id || !to_status) {
      return NextResponse.json(
        { error: 'dispatch_id and to_status are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data, error } = await supabase.rpc('transition_dispatch', {
      p_dispatch_id: dispatch_id,
      p_to_status: to_status,
      p_user_id: user.id,
      p_reason: reason || null,
      p_metadata: metadata || {},
    });

    if (error) {
      console.error('[Dispatch Transition] RPC error:', error);
      return NextResponse.json({ error: 'Transition failed', details: error.message }, { status: 500 });
    }

    // The RPC returns a JSONB object with {success, error/dispatch_id, from, to}
    if (data && !data.success) {
      return NextResponse.json(data, { status: 422 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[Dispatch Transition] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
