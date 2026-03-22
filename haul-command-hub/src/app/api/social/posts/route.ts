/**
 * GET  /api/social/posts?corridor=...&limit=20
 * POST /api/social/posts
 *
 * Operator posts / corridor community feed.
 * Max 280 characters per post.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const sb = supabaseServer();
    const { searchParams } = new URL(request.url);
    const corridor = searchParams.get('corridor');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const operatorId = searchParams.get('operator_id');

    let query = sb
      .from('operator_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 50));

    if (corridor) {
      query = query.eq('corridor_tag', corridor);
    }

    if (operatorId) {
      query = query.eq('operator_id', operatorId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ posts: data ?? [], count: data?.length ?? 0 });
  } catch (err) {
    console.error('[Social Posts GET] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sb = supabaseServer();
    const body = await request.json();
    const { operator_id, content, post_type, corridor_tag } = body;

    if (!operator_id || !content) {
      return NextResponse.json({ error: 'Missing operator_id or content' }, { status: 400 });
    }

    if (content.length > 280) {
      return NextResponse.json({ error: 'Post too long (max 280 characters)' }, { status: 400 });
    }

    const { data, error } = await sb
      .from('operator_posts')
      .insert({
        operator_id,
        content,
        post_type: post_type ?? 'update',
        corridor_tag: corridor_tag ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ post: data });
  } catch (err) {
    console.error('[Social Posts POST] Error:', err);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
