import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const revalidate = 30; // ISR: refresh every 30s

export async function GET() {
    try {
        const supabase = supabaseServer();
        const { data, error } = await supabase.rpc("hc_global_stats_get");

        if (error || !data) {
            // Return empty object — UI shows "Initializing" states
            return NextResponse.json({}, { status: 200 });
        }

        return NextResponse.json(data, {
            status: 200,
            headers: {
                "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
            },
        });
    } catch {
        return NextResponse.json({}, { status: 200 });
    }
}
