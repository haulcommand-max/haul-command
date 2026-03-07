export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
    );
}

function parseBBox(s: string | null): [number, number, number, number] | null {
    if (!s) return null;
    const parts = s.split(',').map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return null;
    return [parts[0], parts[1], parts[2], parts[3]];
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state');
    const bbox = parseBBox(searchParams.get('bbox'));
    const limit = Math.min(Number(searchParams.get('limit') ?? 200), 500);
    const supabase = getSupabase();

    // ── Strategy: try new escort_locations_current first, fall back to escort_presence ──

    // 1) New table: escort_locations_current (from hc_ping_location RPC)
    let newFeatures: any[] = [];
    {
        let q = supabase
            .from('escort_locations_current')
            .select('user_id, occurred_at, lat, lng, accuracy_m, speed_mps, heading_deg, is_moving, updated_at')
            .not('lat', 'is', null)
            .not('lng', 'is', null)
            .limit(limit);

        if (bbox) {
            const [minLng, minLat, maxLng, maxLat] = bbox;
            q = q.gte('lat', minLat).lte('lat', maxLat).gte('lng', minLng).lte('lng', maxLng);
        }

        const { data } = await q;
        const now = Date.now();
        newFeatures = (data ?? []).map((e: any) => {
            const ageSec = (now - new Date(e.updated_at).getTime()) / 1000;
            return {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [e.lng, e.lat] },
                properties: {
                    user_id: e.user_id,
                    source: 'locations_current',
                    is_moving: e.is_moving,
                    speed_mps: e.speed_mps,
                    heading_deg: e.heading_deg,
                    accuracy_m: e.accuracy_m,
                    age_sec: Math.round(ageSec),
                    opacity: ageSec < 90 ? 1 : Math.max(0.2, 1 - (ageSec - 90) / 90),
                },
            };
        });
    }

    // 2) Legacy table: escort_presence (heartbeat-based)
    let legacyFeatures: any[] = [];
    {
        const cutoff = new Date(Date.now() - 3 * 60 * 1000).toISOString();
        let q = supabase
            .from('escort_presence')
            .select('profile_id, lat, lng, last_heartbeat, state, status')
            .gte('last_heartbeat', cutoff)
            .not('lat', 'is', null)
            .not('lng', 'is', null)
            .limit(limit);

        if (state) q = q.eq('state', state);

        const { data } = await q;
        const now = Date.now();
        legacyFeatures = (data ?? []).map((e: any) => {
            const ageSec = (now - new Date(e.last_heartbeat).getTime()) / 1000;
            return {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [e.lng, e.lat] },
                properties: {
                    profile_id: e.profile_id,
                    source: 'escort_presence',
                    status: e.status ?? 'active',
                    state: e.state ?? '',
                    age_sec: Math.round(ageSec),
                    opacity: ageSec < 90 ? 1 : Math.max(0.2, 1 - (ageSec - 90) / 90),
                },
            };
        });
    }

    // Merge: new table features take priority, dedupe by user_id/profile_id
    const seenIds = new Set(newFeatures.map((f: any) => f.properties.user_id));
    const merged = [
        ...newFeatures,
        ...legacyFeatures.filter((f: any) => !seenIds.has(f.properties.profile_id)),
    ];

    const fc = { type: 'FeatureCollection', features: merged };

    return NextResponse.json(fc, {
        headers: {
            'Cache-Control': 's-maxage=30, stale-while-revalidate=10',
            'Access-Control-Allow-Origin': '*',
        },
    });
}
