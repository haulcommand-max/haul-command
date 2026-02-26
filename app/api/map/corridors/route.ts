export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// Static corridor geometry (line segments) â€” extend with real GeoJSON from DB later
const CORRIDOR_LINES: Record<string, number[][]> = {
    "I-75": [
        [-84.39, 33.75], [-83.72, 32.08], [-83.43, 30.83],
        [-82.56, 29.65], [-82.42, 28.91], [-81.68, 27.95],
        [-81.36, 26.71], [-80.69, 25.77],
    ],
    "I-10": [
        [-87.32, 30.42], [-85.67, 30.17], [-83.24, 29.65],
        [-81.66, 29.13], [-81.36, 29.50],
    ],
    "I-95": [
        [-80.19, 25.77], [-80.14, 26.71], [-80.04, 27.95],
        [-81.39, 29.18], [-81.52, 30.33], [-81.65, 31.13],
    ],
};

export async function GET() {
    // Get load density per corridor from DB (last 30 min)
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    let densityMap: Record<string, number> = {};

    try {
        // Count loads per corridor using trust_corridors
        const { data } = await getSupabase()
        .from("trust_events")
            .select("corridor_id")
            .gte("created_at", cutoff)
            .not("corridor_id", "is", null);

        if (data) {
            const counts: Record<string, number> = {};
            for (const r of data) {
                if (r.corridor_id) counts[r.corridor_id] = (counts[r.corridor_id] ?? 0) + 1;
            }
            const max = Math.max(1, ...Object.values(counts));
            for (const [k, v] of Object.entries(counts)) {
                densityMap[k] = v / max;
            }
        }
    } catch {
        // Fallback to zero density if query fails
    }

    const features = Object.entries(CORRIDOR_LINES).map(([name, coords]) => ({
        type: "Feature",
        geometry: { type: "LineString", coordinates: coords },
        properties: {
            name,
            // heat 0â€“1 based on recent load activity; fallback to 0.3 for visual baseline
            heat: densityMap[name] ?? 0.3,
        },
    }));

    return NextResponse.json(
        { type: "FeatureCollection", features },
        {
            headers: {
                "Cache-Control": "s-maxage=60, stale-while-revalidate=30",
                "Access-Control-Allow-Origin": "*",
            },
        }
    );
}
