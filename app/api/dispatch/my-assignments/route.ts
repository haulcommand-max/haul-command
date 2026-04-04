import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/**
 * GET /api/dispatch/my-assignments
 *
 * Operator dashboard: fetch all assignments for the authenticated operator.
 * 
 * Includes combined data from hc_loads to show origin/destination and load_id details.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'active'; // can be 'active', 'completed', 'all'

    const admin = getSupabaseAdmin();
    let query = admin
      .from('dispatch_assignments')
      .select(`
        id,
        dispatch_request_id,
        load_id,
        origin,
        destination,
        load_type,
        date_needed,
        agreed_rate_per_day,
        positions,
        status,
        accepted_at,
        started_at,
        completed_at,
        cancelled_at,
        platform_fee_pct,
        platform_fee_usd,
        broker_user_id
      `)
      .eq('operator_user_id', user.id)
      .order('accepted_at', { ascending: false });

    if (statusFilter === 'active') {
      query = query.in('status', ['active', 'in_transit']);
    } else if (statusFilter === 'completed') {
      query = query.in('status', ['completed', 'cancelled', 'disputed']);
    }

    const { data: assignments, error } = await query;

    if (error) {
      console.error('[my-assignments] error fetching assignments:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      operator_id: user.id,
      assignments: assignments || [],
      count: assignments?.length || 0,
    });
  } catch (err: any) {
    console.error('[my-assignments] fatal err:', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
