import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

/* ═══════════════════════════════════════════════════════════════════
   /api/social/posts — Operator Posts (280-char updates)
   POST { content, corridor_slug? } — create post
   GET ?corridor_slug=xxx&limit=20 — list posts
   ═══════════════════════════════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  try {
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const content = (body.content || '').trim();
    if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 });
    if (content.length > 280) return NextResponse.json({ error: 'Max 280 characters' }, { status: 400 });

    const { data, error } = await sb.from('operator_posts').insert({
      profile_id: user.id,
      content,
      corridor_slug: body.corridor_slug || null,
    }).select('*').single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ post: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const sb = supabaseServer();
    const corridor = req.nextUrl.searchParams.get('corridor_slug');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');

    let query = sb
      .from('operator_posts')
      .select('*, profiles!inner(full_name, city, state)')
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 50));

    if (corridor) query = query.eq('corridor_slug', corridor);

    const { data, error } = await query;
    if (error) return NextResponse.json({ posts: [], error: error.message });
    return NextResponse.json({ posts: data || [] });
  } catch {
    return NextResponse.json({ posts: [] });
  }
}
