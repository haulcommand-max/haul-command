import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/public/kpis
 *
 * RLS-safe public KPI endpoint.
 * Uses service_role to aggregate non-sensitive metrics, returning only
 * safe numeric summaries — never PII, never raw event data.
 *
 * Response is edge-cacheable (5 min stale-while-revalidate).
 */

const FALLBACK: KpiResponse = {
    escorts_online: 0,
    available_now: 0,
    open_loads: 0,
    median_fill_time_minutes: 0,
    updated_at: new Date().toISOString(),
    ok: false,
};

interface KpiResponse {
    escorts_online: number;
    available_now: number;
    open_loads: number;
    median_fill_time_minutes: number;
    updated_at: string;
    ok: boolean;
}

export async function GET() {
    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
            return NextResponse.json(
                { ...FALLBACK, reason: "env_missing" },
                {
                    status: 200,
                    headers: {
                        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
                    },
                },
            );
        }

        const supabase = createClient(url, key);

        // Try v_market_pulse view first (safest, purpose-built)
        const { data, error } = await supabase
            .from("v_market_pulse")
            .select("*")
            .single();

        if (error || !data) {
            // View might not exist yet — return safe defaults
            return NextResponse.json(
                { ...FALLBACK, updated_at: new Date().toISOString() },
                {
                    status: 200,
                    headers: {
                        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
                    },
                },
            );
        }

        const response: KpiResponse = {
            escorts_online: Number(data.escorts_online_now ?? 0),
            available_now: Number(data.escorts_available_now ?? 0),
            open_loads: Number(data.open_loads_now ?? 0),
            median_fill_time_minutes: data.median_fill_time_min_7d
                ? Math.round(Number(data.median_fill_time_min_7d))
                : 0,
            updated_at: new Date().toISOString(),
            ok: true,
        };

        return NextResponse.json(response, {
            status: 200,
            headers: {
                "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
            },
        });
    } catch (err) {
        console.error("[/api/public/kpis] unhandled error:", err);
        return NextResponse.json(
            { ...FALLBACK, updated_at: new Date().toISOString() },
            {
                status: 200,
                headers: {
                    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
                },
            },
        );
    }
}
