/**
 * LIVE AVAILABILITY API — /api/availability
 * 
 * "A great directory is static.
 *  A world-class directory is alive."
 * 
 * Endpoints:
 *   GET  /api/availability?user_id=... → get current status
 *   POST /api/availability → update availability (toggle, window, radius)
 *   POST /api/availability/hold → "request hold" from broker
 *   POST /api/availability/respond → accept/decline from operator
 * 
 * Integrates with:
 *   - driver_presence table (real-time toggle)
 *   - profiles table (service radius, calendar state)
 *   - notification_queue (push alerts on hold requests)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

// ── GET: Read availability state ──
export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get('user_id');
    if (!userId) {
        return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const [{ data: presence }, { data: profile }] = await Promise.all([
        supabase
            .from('driver_presence')
            .select('is_available, last_seen_at, lat, lng, city, state, country_code')
            .eq('user_id', userId)
            .single(),
        supabase
            .from('profiles')
            .select('service_radius_miles, booked_until, availability_window, accepts_night_runs, accepts_weekend_runs')
            .eq('id', userId)
            .single(),
    ]);

    const lastSeen = presence?.last_seen_at;
    const now = Date.now();
    const lastSeenAge = lastSeen ? Math.floor((now - new Date(lastSeen).getTime()) / 60000) : null;

    let freshnessBadge = 'unknown';
    if (lastSeenAge !== null) {
        if (lastSeenAge < 15) freshnessBadge = 'just_now';
        else if (lastSeenAge < 60) freshnessBadge = 'recent';
        else if (lastSeenAge < 360) freshnessBadge = 'today';
        else if (lastSeenAge < 1440) freshnessBadge = 'yesterday';
        else freshnessBadge = 'stale';
    }

    // Compute calendar state
    const bookedUntil = profile?.booked_until;
    let calendarState = 'open';
    if (bookedUntil) {
        const bookedDate = new Date(bookedUntil);
        if (bookedDate > new Date()) {
            calendarState = 'booked_out';
        }
    }

    return NextResponse.json({
        user_id: userId,
        is_available: presence?.is_available ?? false,
        last_seen_at: lastSeen,
        freshness: freshnessBadge,
        freshness_label: FRESHNESS_LABELS[freshnessBadge] || 'Unknown',
        location: {
            city: presence?.city,
            state: presence?.state,
            country_code: presence?.country_code,
            lat: presence?.lat,
            lng: presence?.lng,
        },
        service_radius_miles: profile?.service_radius_miles ?? 150,
        calendar_state: calendarState,
        booked_until: bookedUntil,
        availability_window: profile?.availability_window || 'anytime',
        accepts_night_runs: profile?.accepts_night_runs ?? true,
        accepts_weekend_runs: profile?.accepts_weekend_runs ?? true,
    });
}

const FRESHNESS_LABELS: Record<string, string> = {
    just_now: '🟢 Updated just now',
    recent: '🟢 Updated recently',
    today: '🟡 Updated today',
    yesterday: '🟠 Updated yesterday',
    stale: '🔴 Not recently active',
    unknown: '⚪ Unknown',
};

// ── POST: Update availability ──
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const body = await req.json();
    const admin = getSupabaseAdmin();

    // Toggle availability
    if (body.is_available !== undefined) {
        await admin.from('driver_presence').upsert({
            user_id: user.id,
            is_available: body.is_available,
            last_seen_at: new Date().toISOString(),
            city: body.city,
            state: body.state,
            country_code: body.country_code,
            lat: body.lat,
            lng: body.lng,
        }, { onConflict: 'user_id' });
    }

    // Update availability window 
    if (body.availability_window || body.service_radius_miles || body.booked_until !== undefined) {
        const update: Record<string, unknown> = {};
        if (body.availability_window) update.availability_window = body.availability_window;
        if (body.service_radius_miles) update.service_radius_miles = body.service_radius_miles;
        if (body.booked_until !== undefined) update.booked_until = body.booked_until;
        if (body.accepts_night_runs !== undefined) update.accepts_night_runs = body.accepts_night_runs;
        if (body.accepts_weekend_runs !== undefined) update.accepts_weekend_runs = body.accepts_weekend_runs;
        update.updated_at = new Date().toISOString();

        await admin.from('profiles').update(update).eq('id', user.id);
    }

    return NextResponse.json({ ok: true, user_id: user.id });
}
