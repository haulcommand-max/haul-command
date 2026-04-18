/**
 * POST /api/training/badge-refresh
 * Refreshes a user's badge status — called on renewal, expiry check, or admin review.
 * Also handles expiry state propagation from cron checks.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secret = process.env.INTERNAL_API_SECRET;
    if (secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { user_id, badge_slug, action } = body;
    // action: 'expire' | 'review_due' | 'reactivate'

    if (!user_id || !badge_slug || !action) {
      return NextResponse.json({ error: 'user_id, badge_slug, and action required' }, { status: 400 });
    }

    const supabase = supabaseServer();

    let newStatus: string;
    switch (action) {
      case 'expire':      newStatus = 'expired'; break;
      case 'review_due':  newStatus = 'review_due'; break;
      case 'reactivate':  newStatus = 'active'; break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { error } = await supabase
      .from('training_user_badges')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('user_id', user_id)
      .eq('badge_slug', badge_slug);

    if (error) {
      console.error('[Badge Refresh] error:', error.message);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, badge_slug, new_status: newStatus });
  } catch (err) {
    console.error('[Badge Refresh] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * GET /api/training/badge-refresh?user_id=xxx
 * Returns current badge status for a user. Used by broker-side verification.
 */
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('user_id');
  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }

  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('training_user_badges')
      .select('badge_slug, status, issued_at, expires_at, review_due_at')
      .eq('user_id', userId)
      .order('issued_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Query failed' }, { status: 500 });
    }

    return NextResponse.json({ badges: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
