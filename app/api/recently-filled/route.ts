import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// ══════════════════════════════════════════════════════════════
// GET /api/recently-filled
//
// Lightweight feed for the RecentlyFilledStrip component.
// Returns last N completed jobs — no PII, no auth required.
// Response is cache-friendly (60s stale-while-revalidate).
// ══════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic"; // always server-rendered — RPC not available at build time

export async function GET() {
    try {
        const supabase = createClient();

        const { data, error } = await supabase.rpc("recently_filled_jobs", {
            limit_n: 12,
        });

        if (error) {
            console.error("[recently-filled] RPC error:", error.message);
            return NextResponse.json({ items: [] }, { status: 200 });
        }

        return NextResponse.json(
            { items: data ?? [] },
            {
                status: 200,
                headers: {
                    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
                },
            }
        );
    } catch (err) {
        console.error("[recently-filled] Unexpected error:", err);
        return NextResponse.json({ items: [] }, { status: 200 });
    }
}
