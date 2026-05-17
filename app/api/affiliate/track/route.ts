import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const { partner, userId, source, url } = await req.json();
    if (!partner) return NextResponse.json({ error: 'partner required' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('affiliate_clicks')
      .insert({
        partner,
        user_id: userId && UUID_RE.test(userId) ? userId : null,
        source: source || 'direct',
        url: url || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[affiliate] click storage failed:', error);
      return NextResponse.json({ error: 'affiliate tracking unavailable' }, { status: 503 });
    }

    return NextResponse.json({ tracked: true, click_id: data.id });
  } catch {
    return NextResponse.json({ error: 'tracking failed' }, { status: 500 });
  }
}
