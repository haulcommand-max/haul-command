// supabase/functions/polyline-worker/index.ts
// Processes route_polyline_queue in capped batches and calls here-polyline.
// Dormant until polyline_store enabled AND HERE key available.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(data: any, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

serve(async () => {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: flag } = await supabase
        .from("feature_flags")
        .select("enabled, config")
        .eq("key", "polyline_store")
        .maybeSingle();

    if (!flag?.enabled) return json({ ok: true, skipped: true, reason: "flag_off" });

    const maxPerRun = Number(flag.config?.max_polylines_per_run ?? 500);

    // Pull queue
    const { data: queue, error: qErr } = await supabase
        .from("route_polyline_queue")
        .select("load_id, attempts")
        .lte("next_attempt_at", new Date().toISOString())
        .order("priority", { ascending: false })
        .order("next_attempt_at", { ascending: true })
        .limit(maxPerRun);

    if (qErr) return json({ ok: false, error: "queue_read_failed" });
    if (!queue?.length) return json({ ok: true, processed: 0 });

    let okCount = 0;
    let failCount = 0;

    for (const item of queue) {
        const loadId = item.load_id as string;

        // Call HERE polyline function
        const r = await fetch(`${supabaseUrl}/functions/v1/here-polyline`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({ load_id: loadId }),
        });

        const j = await r.json().catch(() => ({}));

        if (j?.ok) {
            okCount++;

            // remove from queue
            await supabase.from("route_polyline_queue").delete().eq("load_id", loadId);
        } else {
            failCount++;

            // backoff schedule
            const attempts = Number(item.attempts ?? 0) + 1;
            const backoffHours = Math.min(48, 2 ** Math.min(attempts, 5)); // 2,4,8,16,32,48...
            const next = new Date(Date.now() + backoffHours * 3600 * 1000).toISOString();

            await supabase
                .from("route_polyline_queue")
                .update({ attempts, next_attempt_at: next, updated_at: new Date().toISOString() })
                .eq("load_id", loadId);

            // store error on loads
            await supabase
                .from("loads")
                .update({
                    route_polyline_status: "failed",
                    route_polyline_error: String(j?.status ?? j?.error ?? "unknown"),
                })
                .eq("id", loadId);
        }
    }

    return json({ ok: true, processed: queue.length, okCount, failCount });
});
