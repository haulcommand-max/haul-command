// app/api/supply/recommendations/route.ts
//
// GET: Returns hot-zone data from corridor_supply_snapshot table.
// Used by HotZonesNearYou.tsx + EscortSupplyRadar + SupplyRadarStrip
// No auth required — this is public demand intelligence.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const supabase = getSupabaseAdmin();

// Map demand_pressure to priority buckets
function pressureBucket(demandPressure: number): string {
    if (demandPressure >= 0.8) return "urgent_supply_needed";
    if (demandPressure >= 0.6) return "reposition_recommended";
    if (demandPressure >= 0.4) return "watch";
    return "stable";
}

function recommendedRadius(demandPressure: number): number {
    if (demandPressure >= 0.8) return 100;
    if (demandPressure >= 0.6) return 75;
    return 50;
}

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "10", 10), 50);

        // Get the latest snapshot per corridor (most recent timestamp_bucket)
        const { data: snapshots, error } = await supabase
            .from("corridor_supply_snapshot")
            .select("corridor_slug, supply_count, available_count, demand_pressure, timestamp_bucket")
            .order("timestamp_bucket", { ascending: false })
            .limit(100);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!snapshots?.length) {
            return NextResponse.json({ data: [] });
        }

        // Deduplicate: keep only the latest snapshot per corridor
        const latestByCorridor = new Map<string, any>();
        for (const row of snapshots) {
            if (!latestByCorridor.has(row.corridor_slug)) {
                latestByCorridor.set(row.corridor_slug, row);
            }
        }

        // Map to HotZone format and sort by demand pressure
        const zones = Array.from(latestByCorridor.values())
            .map((row: any) => ({
                corridor: row.corridor_slug,
                label: formatCorridorLabel(row.corridor_slug),
                priority_score: Math.round(row.demand_pressure * 100),
                pressure_bucket: pressureBucket(row.demand_pressure),
                recommended_radius_miles: recommendedRadius(row.demand_pressure),
                supply_count: row.supply_count,
                available_count: row.available_count,
            }))
            .sort((a, b) => b.priority_score - a.priority_score)
            .slice(0, limit);

        return NextResponse.json({
            data: zones,
            updated_at: snapshots[0]?.timestamp_bucket ?? null,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
    }
}

function formatCorridorLabel(slug: string): string {
    // "i-75-southeast" → "I-75 Southeast"
    return slug
        .split("-")
        .map((part, i) => {
            if (i === 0 && part.toLowerCase() === "i") return "I";
            if (i === 1 && /^\d+$/.test(part)) return `-${part}`;
            return " " + part.charAt(0).toUpperCase() + part.slice(1);
        })
        .join("")
        .trim();
}
