import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

/* ═══════════════════════════════════════════════════════════════════
   /api/social/follow — Follow/Unfollow operators
   POST { following_id } — toggle follow
   GET ?following_id=xxx — check follow status
   ═══════════════════════════════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  try {
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { following_id } = await req.json();
    if (!following_id) return NextResponse.json({ error: 'following_id required' }, { status: 400 });

    // Check if already following
    const { data: existing } = await sb
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', following_id)
      .single();

    if (existing) {
      // Unfollow
      await sb.from('follows').delete().eq('id', existing.id);
      return NextResponse.json({ following: false });
    } else {
      // Follow
      await sb.from('follows').insert({
        follower_id: user.id,
        following_id,
      });
      return NextResponse.json({ following: true });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ following: false });

    const following_id = req.nextUrl.searchParams.get('following_id');
    if (!following_id) return NextResponse.json({ following: false });

    const { data } = await sb
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', following_id)
      .single();

    return NextResponse.json({ following: !!data });
  } catch {
    return NextResponse.json({ following: false });
  }
}
