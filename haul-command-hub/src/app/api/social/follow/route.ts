/**
 * POST /api/social/follow
 * POST /api/social/follow?action=unfollow
 *
 * Follow/unfollow an operator.
 * Body: { follower_id, following_id }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const sb = supabaseServer();
    const body = await request.json();
    const { follower_id, following_id } = body;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'follow';

    if (!follower_id || !following_id) {
      return NextResponse.json({ error: 'Missing follower_id or following_id' }, { status: 400 });
    }

    if (follower_id === following_id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    if (action === 'unfollow') {
      const { error } = await sb
        .from('follows')
        .delete()
        .eq('follower_id', follower_id)
        .eq('following_id', following_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ status: 'unfollowed' });
    }

    // Follow
    const { error } = await sb
      .from('follows')
      .upsert({ follower_id, following_id }, { onConflict: 'follower_id,following_id' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: 'following' });
  } catch (err) {
    console.error('[Social Follow] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
