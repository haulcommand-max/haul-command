import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function adminCheck(req: NextRequest) {
  return req.headers.get('x-admin-secret') === process.env.HC_ADMIN_SECRET;
}

// GET /api/admin/social?status=draft|scheduled|posted
export async function GET(req: NextRequest) {
  if (!adminCheck(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const status = req.nextUrl.searchParams.get('status') || 'draft';
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: posts } = await supabase.from('social_posts')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ posts: posts || [] });
}

// PATCH /api/admin/social — approve or reject a post
export async function PATCH(req: NextRequest) {
  if (!adminCheck(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { post_id, action, scheduled_for } = await req.json();
  if (!post_id || !action) return NextResponse.json({ error: 'post_id and action required' }, { status: 400 });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  if (action === 'reject') {
    await supabase.from('social_posts').delete().eq('id', post_id);
    return NextResponse.json({ ok: true, action: 'deleted' });
  }

  if (action === 'approve') {
    // Schedule for the next optimal posting time (7am or 12pm next day)
    const next = scheduled_for ? new Date(scheduled_for) : getNextOptimalTime();
    await supabase.from('social_posts').update({
      status: 'scheduled',
      scheduled_for: next.toISOString(),
    }).eq('id', post_id);

    const { data: post } = await supabase.from('social_posts').select('*').eq('id', post_id).single();

    const bufferKey = process.env.BUFFER_API_KEY;
    const bufferProfileId = process.env.BUFFER_PROFILE_ID;
    
    if (bufferKey && bufferProfileId && post) {
      try {
        const body = new URLSearchParams();
        body.append('text', post.content || 'Update from Haul Command');
        body.append('profile_ids[]', bufferProfileId);
        body.append('scheduled_at', next.toISOString());
        
        await fetch(`https://api.bufferapp.com/1/updates/create.json?access_token=${bufferKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString()
        });
      } catch (e) {
        console.error('Failed to dispatch to Buffer:', e);
      }
    }

    return NextResponse.json({ ok: true, action: 'scheduled', scheduled_for: next.toISOString() });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

function getNextOptimalTime(): Date {
  const now = new Date();
  const candidate = new Date(now);
  candidate.setDate(candidate.getDate() + 1);
  candidate.setHours(7, 30, 0, 0); // 7:30am EST next day
  return candidate;
}
