import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/standing-orders/create
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      origin,
      destination,
      corridor,
      load_type,
      rate_per_day,
      recurrence = 'weekly',
      preferred_operator_id,
      country_code = 'us',
      notes,
    } = body;

    if (!origin || !destination || !rate_per_day) {
      return NextResponse.json({ error: 'origin, destination, and rate_per_day required' }, { status: 400 });
    }

    const { data: order, error } = await supabase
      .from('standing_orders')
      .insert({
        broker_id: user.id,
        origin,
        destination,
        corridor: corridor || `${origin} → ${destination}`,
        load_type: load_type || 'wide_load',
        rate_per_day,
        recurrence,
        preferred_operator_id: preferred_operator_id || null,
        country_code,
        notes: notes || '',
        status: 'active',
        next_dispatch_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Standing order create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/standing-orders/create (list for current user)
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orders, error } = await supabase
      .from('standing_orders')
      .select('*')
      .eq('broker_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ orders: orders || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
