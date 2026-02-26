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
    const limit = Math.min(Number(searchParams.get("limit") ?? 300), 1000);

    // Try the canonical loads table first, fall back to null coords gracefully
    let q = getSupabase()
        .from("loads")
        .select("id,title,origin_lat,origin_lng,urgency,status,origin_city,origin_state")
        .in("status", ["open", "matched"])
        .not("origin_lat", "is", null)
        .not("origin_lng", "is", null)
        .limit(limit);

    if (state) q = q.eq("origin_state", state);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const fc = {
        type: "FeatureCollection",
        features: (data ?? []).map((l: any) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [l.origin_lng, l.origin_lat] },
            properties: {
                id: l.id,
                title: l.title ?? "Load",
                urgency: l.urgency ?? 0,
                status: l.status,
                city: l.origin_city ?? "",
                state: l.origin_state ?? "",
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
