import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

type Json = Record<string, unknown>;

serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    const supabase = getServiceClient();
    const body: Json = await req.json().catch(() => ({}));

    const country = String(body.country ?? "us");      // 'us' or 'ca'
    const region = String(body.region ?? "all");       // state/province or 'all'
    const metric = String(body.metric ?? "most_runs");
    const timeframe = String(body.timeframe ?? "month");
    const limit = Number(body.limit ?? 50);

    // Pull current rollups
    const { data, error } = await supabase
        .from("public_leaderboards")
        .select("*")
        .eq("country_code", country)
        .eq("region_code", region)
        .eq("metric", metric)
        .eq("timeframe", timeframe)
        .order("rank", { ascending: true })
        .limit(limit);

    if (error) {
        return new Response(JSON.stringify({ ok: false, error: error.message }), {
            headers: { ...corsHeaders, "content-type": "application/json" },
            status: 500
        });
    }

    const payload = { country, region, metric, timeframe, rows: data ?? [] };

    const { error: insErr } = await supabase.from("leaderboard_snapshots").insert({
        timeframe,
        country_code: country,
        region_code: region,
        metric,
        payload
    });

    if (insErr) {
        return new Response(JSON.stringify({ ok: false, error: insErr.message }), {
            headers: { ...corsHeaders, "content-type": "application/json" },
            status: 500
        });
    }

    return new Response(JSON.stringify({ ok: true, snapshotted: true, count: (data ?? []).length }), {
        headers: { ...corsHeaders, "content-type": "application/json" }
    });
});
