import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// ─── In-process TTL cache ────────────────────────────────────────────────────
// hc_global_stats_get() averages 7.6s — we cache the result for 60s so the
// heavy RPC fires at most once per minute per serverless instance, regardless
// of how many concurrent requests come in.
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 60_000; // 60 seconds

let cachedData: Record<string, unknown> | null = null;
let cacheExpiresAt = 0;

export const dynamic = "force-dynamic"; // prevent Next.js from statically building this

export async function GET() {
    const now = Date.now();

    // Serve from cache if still fresh
    if (cachedData !== null && now < cacheExpiresAt) {
        return NextResponse.json(cachedData, {
            status: 200,
            headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
                "X-Cache": "HIT",
            },
        });
    }

    try {
        const supabase = supabaseServer();
        const { data, error } = await supabase.rpc("hc_global_stats_get");

        if (error || !data) {
            // Return stale cache if available, otherwise empty
            const fallback = cachedData ?? {};
            return NextResponse.json(fallback, {
                status: 200,
                headers: {
                    "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
                    "X-Cache": "STALE",
                },
            });
        }

        // Populate cache
        cachedData = data as Record<string, unknown>;
        cacheExpiresAt = now + CACHE_TTL_MS;

        return NextResponse.json(cachedData, {
            status: 200,
            headers: {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
                "X-Cache": "MISS",
            },
        });
    } catch {
        const fallback = cachedData ?? {};
        return NextResponse.json(fallback, { status: 200 });
    }
}
