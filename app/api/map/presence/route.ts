export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';


export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const minutes = Math.min(Number(searchParams.get("minutes") ?? 45), 180);
    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();

    // Try presence_heartbeats first (new schema), fallback gracefully
    const { data, error } = await getSupabaseAdmin()
        .from("presence_heartbeats")
        .select("lat,lng,last_seen_at")
        .gte("last_seen_at", since)
        .not("lat", "is", null)
        .not("lng", "is", null)
        .limit(2000);

    if (error) {
        console.error("[map/presence] presence heartbeat query failed:", error.message);
        return NextResponse.json({ error: "presence_unavailable" }, { status: 503 });
    }

    const fc = {
        type: "FeatureCollection",
        features: Array.from((data ?? []).reduce((acc: Map<string, any>, p: any) => {
            const latBucket = Math.round(Number(p.lat) * 10) / 10;
            const lngBucket = Math.round(Number(p.lng) * 10) / 10;
            const key = `${latBucket}:${lngBucket}`;
            const current = acc.get(key) ?? {
                count: 0,
                latest_seen_at: p.last_seen_at,
            };

            current.count += 1;
            if (p.last_seen_at > current.latest_seen_at) current.latest_seen_at = p.last_seen_at;
            acc.set(key, current);
            return acc;
        }, new Map<string, any>()).entries()).map(([key, cell]: any) => {
            const [latBucket, lngBucket] = key.split(":").map(Number);
            return {
                type: "Feature",
                geometry: { type: "Point", coordinates: [lngBucket, latBucket] },
                properties: {
                    count: cell.count,
                    latest_seen_bucket: cell.latest_seen_at?.slice(0, 16),
                    precision: "approx_0_1_degree",
                },
            };
        }),
    };

    return NextResponse.json(fc, {
        headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
    });
}
