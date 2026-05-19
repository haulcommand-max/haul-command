import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { partner, source, url } = await req.json();
    if (!partner) return NextResponse.json({ error: 'partner required' }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabaseAdmin
      .from('affiliate_clicks')
      .insert({
        partner,
        user_id: user?.id ?? null,
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
