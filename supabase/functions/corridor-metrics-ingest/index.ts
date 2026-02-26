import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type SegmentMetric = {
    corridor_id: string;
    segment_index: number;
    csi?: number;
    active_escorts?: number;
    required_escorts?: number;
    largest_gap_miles?: number;
    searches_7d?: number;
    load_posts_7d?: number;
    broker_requests_7d?: number;
    failure_rate?: number;
    median_time_to_fill_minutes?: number;
    strategic_value?: number; // 0..1 optional input
    recruitability?: number;  // 0..1 optional input
};

function clamp(n: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, n));
}

function computeEPS(s: SegmentMetric) {
    // EPS weights: demand .30, failure .25, strategic .20, recruit .15, costToWinInverse .10
    const demand = clamp(((s.searches_7d ?? 0) / 50) + ((s.load_posts_7d ?? 0) / 30), 0, 1);
    const failure = clamp(s.failure_rate ?? 0, 0, 1);
    const strategic = clamp(s.strategic_value ?? 0.7, 0, 1);
    const recruit = clamp(s.recruitability ?? 0.6, 0, 1);

    const active = s.active_escorts ?? 0;
    const req = Math.max(1, s.required_escorts ?? 1);
    const coverage = clamp(active / req, 0, 2);
    const costToWinInverse = clamp(coverage / 1.0, 0, 1);

    const eps01 =
        demand * 0.30 +
        failure * 0.25 +
        strategic * 0.20 +
        recruit * 0.15 +
        costToWinInverse * 0.10;

    return Math.round(eps01 * 10000) / 100;
}

serve(async (req) => {
    try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

        const payload = (await req.json()) as { window_start?: string; window_end?: string; segments: SegmentMetric[] };
        if (!payload?.segments?.length) {
            return new Response(JSON.stringify({ error: "segments[] required" }), { status: 400 });
        }

        const rows = payload.segments.map((s) => ({
            corridor_id: s.corridor_id,
            segment_index: s.segment_index,
            csi: s.csi ?? 1.0,
            active_escorts: s.active_escorts ?? 0,
            required_escorts: s.required_escorts ?? 0,
            largest_gap_miles: s.largest_gap_miles ?? 0,
            searches_7d: s.searches_7d ?? 0,
            load_posts_7d: s.load_posts_7d ?? 0,
            broker_requests_7d: s.broker_requests_7d ?? 0,
            failure_rate: s.failure_rate ?? 0,
            median_time_to_fill_minutes: s.median_time_to_fill_minutes ?? 0,
            eps: computeEPS(s),
            window_start: payload.window_start ?? null,
            window_end: payload.window_end ?? null,
        }));

        const { error } = await sb
            .from("corridor_segment_metrics")
            .upsert(rows, { onConflict: "corridor_id,segment_index" });

        if (error) throw error;

        return new Response(JSON.stringify({ ok: true, upserted: rows.length }), {
            headers: { "content-type": "application/json" },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
    }
});
