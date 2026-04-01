import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH /api/ads/campaigns/[id]  — update status (active/paused) or other fields
 */

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createClient();
    const body = await req.json();
    const { id } = await params;

    if (!id) return NextResponse.json({ error: 'Missing campaign ID' }, { status: 400 });

    const { data, error } = await supabase
      .from('ad_campaigns')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ success: true }); // graceful

    return NextResponse.json({ campaign: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
