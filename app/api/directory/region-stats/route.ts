export const dynamic = 'force-dynamic';
/**
 * GET /api/directory/region-stats
 *
 * Returns aggregated stats per region, keyed as `${country}:${code}`.
 * Used by BrowseRegions2026 to populate operator/support/stop counts
 * and coverage signals on each tile.
 *
 * Response shape:
 * {
 *   "US:FL": { operators: 38, support: 4, stops: 12, hot: true, coverageScore: 82 },
 *   "CA:ON": { operators: 9, support: 2, stops: 6, hot: false, coverageScore: 61 },
 *   ...
 * }
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const revalidate = 300; // 5-min cache — data doesn't change by the second

export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        // Parallel aggregate queries
        const [operatorsRes, supportRes, stopsRes, hotRes, speRes] = await Promise.all([
            // Operator counts per region
            supabase
                .from("escort_profiles")
                .select("country_code, region_code")
                .eq("is_published", true)
                .not("region_code", "is", null),

            // Support contact counts per region
            supabase
                .from("support_contacts")
                .select("country_code, region_code")
                .not("region_code", "is", null),

            // Truck stop counts per region
            supabase
                .from("truck_stops")
                .select("country_code, region_code")
                .not("region_code", "is", null),

            // Hot corridors — regions with high corridor stress
            supabase
                .from("corridor_stress_log")
                .select("origin_state, dest_state, stress_index")
                .gte("stress_index", 0.65)
                .order("stress_index", { ascending: false })
                .limit(30),

            // Supply Pressure Engine snapshots — region-level only (city_id IS NULL)
            supabase
                .from("market_pressure_snapshots")
                .select("country_code, region_code, cal_label, pressure_now, pressure_24h, demand_trend, low_data_flag")
                .is("city_id", null)
                .is("corridor_id", null),
        ]);

        // Build lookup maps
        const stats: Record<string, {
            operators: number;
            support: number;
            stops: number;
            hot: boolean;
            coverageScore: number;
            // SPE fields
            calLabel?: string | null;
            pressureNow?: number | null;
            pressure24h?: number | null;
            demandTrend?: number | null;
            lowDataFlag?: boolean;
        }> = {};

        function ensure(key: string) {
            if (!stats[key]) {
                stats[key] = { operators: 0, support: 0, stops: 0, hot: false, coverageScore: 0 };
            }
            return stats[key];
        }

        // Count operators
        for (const row of operatorsRes.data ?? []) {
            if (!row.country_code || !row.region_code) continue;
            const key = `${String(row.country_code).toUpperCase()}:${String(row.region_code).toUpperCase()}`;
            ensure(key).operators++;
        }

        // Count support contacts
        for (const row of supportRes.data ?? []) {
            if (!row.country_code || !row.region_code) continue;
            const key = `${String(row.country_code).toUpperCase()}:${String(row.region_code).toUpperCase()}`;
            ensure(key).support++;
        }

        // Count truck stops
        for (const row of stopsRes.data ?? []) {
            if (!row.country_code || !row.region_code) continue;
            const key = `${String(row.country_code).toUpperCase()}:${String(row.region_code).toUpperCase()}`;
            ensure(key).stops++;
        }

        // Mark hot regions
        const hotRegions = new Set<string>();
        for (const row of hotRes.data ?? []) {
            if (row.origin_state) hotRegions.add(`US:${String(row.origin_state).toUpperCase()}`);
            if (row.dest_state) hotRegions.add(`US:${String(row.dest_state).toUpperCase()}`);
        }
        for (const key of hotRegions) {
            ensure(key).hot = true;
        }

        // Compute coverage score 0-100
        // Formula: operators*60% + support*20% + stops*20%, normalized to 100
        for (const [key, s] of Object.entries(stats)) {
            const opScore = Math.min(s.operators / 20, 1) * 60;  // 20 operators = full
            const supScore = Math.min(s.support / 5, 1) * 20;  // 5 contacts = full
            const stkScore = Math.min(s.stops / 10, 1) * 20;  // 10 stops = full
            s.coverageScore = Math.round(opScore + supScore + stkScore);
        }

        // Merge SPE data
        for (const row of speRes.data ?? []) {
            if (!row.country_code || !row.region_code) continue;
            const key = `${String(row.country_code).toUpperCase()}:${String(row.region_code).toUpperCase()}`;
            const s = ensure(key);
            s.calLabel = row.cal_label ?? null;
            s.pressureNow = row.pressure_now != null ? Number(row.pressure_now) : null;
            s.pressure24h = row.pressure_24h != null ? Number(row.pressure_24h) : null;
            s.demandTrend = row.demand_trend != null ? Number(row.demand_trend) : null;
            s.lowDataFlag = row.low_data_flag ?? false;
        }

        return NextResponse.json(stats, {
            headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
        });

    } catch (err) {
        console.error("[region-stats]", err);
        return NextResponse.json({}, { status: 200 }); // Fail gracefully — tiles show "—"
    }
}
