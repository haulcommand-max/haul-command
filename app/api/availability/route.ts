import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Availability Calendar API
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const operatorId = url.searchParams.get('operator_id') || user.id;
    const startDate = url.searchParams.get('start') || new Date().toISOString().split('T')[0];
    const endDate = url.searchParams.get('end') || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const { data: availability } = await supabase
      .from('operator_availability')
      .select('*')
      .eq('operator_id', operatorId)
      .gte('available_date', startDate)
      .lte('available_date', endDate)
      .order('available_date');

    return NextResponse.json({ availability: availability || [] });
  } catch {
    return NextResponse.json({ error: 'Failed to load availability' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { dates, status } = body; // dates: string[], status: 'available'|'unavailable'
    if (!dates?.length || !status) {
      return NextResponse.json({ error: 'dates array and status required' }, { status: 400 });
    }

    const records = dates.map((d: string) => ({
      operator_id: user.id,
      available_date: d,
      status,
    }));

    const { error } = await supabase.from('operator_availability').upsert(records, { onConflict: 'operator_id,available_date' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ updated: dates.length });
  } catch {
    return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
  }
}
