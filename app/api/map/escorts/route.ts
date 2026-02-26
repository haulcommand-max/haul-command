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
    const state = searchParams.get("state");
    const limit = Math.min(Number(searchParams.get("limit") ?? 200), 500);

    // Only include escorts seen in the last 3 minutes
    const cutoff = new Date(Date.now() - 3 * 60 * 1000).toISOString();

    let q = getSupabase()
        .from("escort_presence")
        .select(
            "profile_id, lat, lng, last_heartbeat, state, status"
        )
        .gte("last_heartbeat", cutoff)
        .not("lat", "is", null)
        .not("lng", "is", null)
        .limit(limit);

    if (state) q = q.eq("state", state);

    const { data, error } = await q;

    if (error) {
        // Table may not exist yet â€” return empty FeatureCollection gracefully
        return NextResponse.json(
            { type: "FeatureCollection", features: [] },
            { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=10" } }
        );
    }

    const now = Date.now();
    const fc = {
        type: "FeatureCollection",
        features: (data ?? []).map((e: any) => {
            const ageSec = (now - new Date(e.last_heartbeat).getTime()) / 1000;
            return {
                type: "Feature",
                geometry: { type: "Point", coordinates: [e.lng, e.lat] },
                properties: {
                    profile_id: e.profile_id,
                    status: e.status ?? "active",
                    state: e.state ?? "",
                    age_sec: Math.round(ageSec),
                    // fade out after 90s
                    opacity: ageSec < 90 ? 1 : Math.max(0.2, 1 - (ageSec - 90) / 90),
                },
            };
        }),
    };

    return NextResponse.json(fc, {
        headers: {
            "Cache-Control": "s-maxage=30, stale-while-revalidate=10",
            "Access-Control-Allow-Origin": "*",
        },
    });
}
