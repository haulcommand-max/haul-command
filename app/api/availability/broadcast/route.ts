import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ══════════════════════════════════════════════════════════════
// POST /api/availability/broadcast — Create/update availability broadcast
// The operator-facing endpoint for "I'm available near X"
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
    city,
    state_code,
    country_code = 'US',
    lat,
    lng,
    radius_miles = 50,
    status = 'available_now',
    available_until,
    service_types = [],
    equipment_notes,
    certifications = [],
    corridor_id,
    willing_to_deadhead_miles = 100,
    phone,
    contact_note,
  } = body;

  // Validate status
  const validStatuses = ['available_now', 'available_today', 'available_this_week', 'booked', 'offline'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
  }

  // Deactivate any previous active broadcasts for this operator
  await supabase
    .from('availability_broadcasts')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('operator_id', user.id)
    .eq('is_active', true);

  // Create new broadcast
  const expiresAt = available_until || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data: broadcast, error } = await supabase
    .from('availability_broadcasts')
    .insert({
      operator_id: user.id,
      city,
      state_code,
      country_code,
      lat,
      lng,
      radius_miles,
      status,
      available_until: expiresAt,
      service_types,
      equipment_notes,
      certifications,
      corridor_id,
      willing_to_deadhead_miles,
      phone,
      contact_note,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    // If table doesn't exist yet, return a graceful response
    if (error.code === '42P01') {
      return NextResponse.json({
        message: 'Availability broadcast system is being deployed. Your status has been noted.',
        fallback: true,
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ broadcast, message: 'Availability broadcast live' });
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const url = new URL(req.url);
  const state = url.searchParams.get('state');
  const country = url.searchParams.get('country') || 'US';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

  // Try v_available_escorts view first, then fallback to raw table
  let query = supabase
    .from('v_available_escorts')
    .select('*')
    .limit(limit);

  if (state) query = query.eq('state_code', state.toUpperCase());
  if (country) query = query.eq('country_code', country.toUpperCase());

  const { data: escorts, error } = await query;

  if (error) {
    // View might not exist yet — fallback to directory data
    const { data: fallback } = await supabase
      .from('hc_global_operators')
      .select('id, name, city, admin1_code, country_code, confidence_score, is_claimed, role_primary, slug')
      .eq('country_code', country.toUpperCase())
      .order('confidence_score', { ascending: false, nullsFirst: false })
      .limit(limit);

    return NextResponse.json({
      escorts: fallback || [],
      source: 'directory_fallback',
      count: fallback?.length || 0,
    });
  }

  return NextResponse.json({
    escorts: escorts || [],
    source: 'live_broadcasts',
    count: escorts?.length || 0,
  });
}
