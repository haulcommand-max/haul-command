import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

/* ═══════════════════════════════════════════════════════════════════
   /api/social/endorsements — Broker endorsements on operators
   POST { operator_id, content } — create endorsement
   GET ?operator_id=xxx — list endorsements for operator
   ═══════════════════════════════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  try {
    const sb = supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const content = (body.content || '').trim();
    const operator_id = body.operator_id;
    if (!content || !operator_id) return NextResponse.json({ error: 'operator_id and content required' }, { status: 400 });
    if (content.length > 200) return NextResponse.json({ error: 'Max 200 characters' }, { status: 400 });

    // Check for existing endorsement from this broker
    const { data: existing } = await sb
      .from('broker_endorsements')
      .select('id')
      .eq('broker_id', user.id)
      .eq('operator_id', operator_id)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await sb.from('broker_endorsements')
        .update({ content })
        .eq('id', existing.id)
        .select('*').single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ endorsement: data, updated: true });
    }

    const { data, error } = await sb.from('broker_endorsements').insert({
      broker_id: user.id,
      operator_id,
      content,
    }).select('*').single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ endorsement: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const sb = supabaseServer();
    const operator_id = req.nextUrl.searchParams.get('operator_id');
    if (!operator_id) return NextResponse.json({ endorsements: [] });

    const { data } = await sb
      .from('broker_endorsements')
      .select('*, profiles!broker_id(full_name)')
      .eq('operator_id', operator_id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({ endorsements: data || [] });
  } catch {
    return NextResponse.json({ endorsements: [] });
  }
}
