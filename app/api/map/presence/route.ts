export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const minutes = Math.min(Number(searchParams.get("minutes") ?? 45), 180);
    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();

    // Try presence_heartbeats first (new schema), fallback gracefully
    const { data, error } = await getSupabase()
        .from("presence_heartbeats")
        .select("profile_id,lat,lng,last_seen_at")
        .gte("last_seen_at", since)
        .not("lat", "is", null)
        .not("lng", "is", null)
        .limit(2000);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const fc = {
        type: "FeatureCollection",
        features: (data ?? []).map((p: any) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [p.lng, p.lat] },
            properties: {
                profile_id: p.profile_id,
                last_seen_at: p.last_seen_at,
            },
        })),
    };

    return NextResponse.json(fc, {
        headers: {
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*",
        },
    });
}
