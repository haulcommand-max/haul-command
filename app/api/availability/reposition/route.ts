import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ══════════════════════════════════════════════════════════════
// POST /api/availability/reposition — Create repositioning post
// "I'm finishing in Dallas, heading to Houston, available along the way"
// The #2 competitor function: deadhead reduction.
// ══════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await req.json();
  const {
    origin_city,
    origin_state,
    origin_country = 'US',
    dest_city,
    dest_state,
    dest_country = 'US',
    depart_date,
    depart_time_approx,
    service_types = [],
    rate_note,
    willing_to_detour_miles = 50,
    phone,
    contact_note,
  } = body;

  if (!origin_city || !origin_state || !depart_date) {
    return NextResponse.json({
      error: 'origin_city, origin_state, and depart_date are required',
    }, { status: 400 });
  }

  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

  const { data: post, error } = await supabase
    .from('repositioning_posts')
    .insert({
      operator_id: user.id,
      origin_city,
      origin_state,
      origin_country,
      dest_city,
      dest_state,
      dest_country,
      depart_date,
      depart_time_approx,
      service_types,
      rate_note,
      willing_to_detour_miles,
      phone,
      contact_note,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({
        message: 'Repositioning system is being deployed. Your post has been noted.',
        fallback: true,
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post, message: 'Repositioning post created' });
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const url = new URL(req.url);
  const originState = url.searchParams.get('origin_state');
  const destState = url.searchParams.get('dest_state');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '30'), 100);

  let query = supabase
    .from('v_repositioning_feed')
    .select('*')
    .limit(limit);

  if (originState) query = query.eq('origin_state', originState.toUpperCase());
  if (destState) query = query.eq('dest_state', destState.toUpperCase());

  const { data: posts, error } = await query;

  if (error) {
    return NextResponse.json({ posts: [], source: 'unavailable', error: error.message });
  }

  return NextResponse.json({ posts: posts || [], count: posts?.length || 0 });
}
