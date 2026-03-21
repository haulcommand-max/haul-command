/**
 * GET/POST /api/availability
 * Track 6: Operator Availability Calendar
 * 
 * GET: Retrieve availability for an operator (by user_id query param or current user)
 * POST: Set availability for dates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const operatorId = searchParams.get('user_id');
    const startDate = searchParams.get('start') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('end') || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    if (!operatorId) {
      return NextResponse.json({ error: 'user_id query param required' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('operator_availability')
      .select('*')
      .eq('operator_id', operatorId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('[Availability GET]', error);
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    return NextResponse.json({ dates: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { dates, status } = body;
    // dates: string[] (YYYY-MM-DD), status: 'available' | 'unavailable'

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json({ error: 'dates array required' }, { status: 400 });
    }

    if (!['available', 'unavailable'].includes(status)) {
      return NextResponse.json({ error: 'status must be available or unavailable' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const records = dates.map((d: string) => ({
      operator_id: user.id,
      date: d,
      status,
    }));

    const { error } = await admin
      .from('operator_availability')
      .upsert(records, { onConflict: 'operator_id,date' });

    if (error) {
      console.error('[Availability POST]', error);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, updated: dates.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
