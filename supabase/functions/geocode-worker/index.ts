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
        .eq("key", "coord_capture")
        .maybeSingle();

    if (!flag?.enabled) return json({ ok: true, skipped: true, reason: "flag_off" });

    const maxPerRun = Number(flag.config?.max_geocodes_per_run ?? 400);

    const { data: queue, error: qErr } = await supabase
        .from("geocode_queue")
        .select("id, load_id, side, query_text, attempts")
        .lte("next_attempt_at", new Date().toISOString())
        .order("priority", { ascending: false })
        .order("next_attempt_at", { ascending: true })
        .limit(maxPerRun);

    if (qErr) return json({ ok: false, error: "queue_read_failed" });
    if (!queue?.length) return json({ ok: true, processed: 0 });

    let okCount = 0;
    let failCount = 0;

    for (const job of queue) {
        const r = await fetch(`${supabaseUrl}/functions/v1/here-geocode`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
            body: JSON.stringify({ q: job.query_text }),
        });

        const j = await r.json().catch(() => ({}));

        if (j?.ok) {
            okCount++;

            // apply coords to load
            if (job.side === "origin") {
                await supabase.from("loads").update({
                    origin_lat: j.lat, origin_lng: j.lng,
                    origin_place_label: j.label,
                    origin_coord_source: "geocode",
                    origin_coord_status: "ok",
                    origin_geocode_error: null
                }).eq("id", job.load_id);
            } else {
                await supabase.from("loads").update({
                    dest_lat: j.lat, dest_lng: j.lng,
                    dest_place_label: j.label,
                    dest_coord_source: "geocode",
                    dest_coord_status: "ok",
                    dest_geocode_error: null
                }).eq("id", job.load_id);
            }

            // remove job
            await supabase.from("geocode_queue").delete().eq("id", job.id);
        } else {
            failCount++;

            const attempts = Number(job.attempts ?? 0) + 1;
            const backoffHours = Math.min(48, 2 ** Math.min(attempts, 5)); // 2,4,8,16,32,48...
            const next = new Date(Date.now() + backoffHours * 3600 * 1000).toISOString();

            await supabase.from("geocode_queue").update({
                attempts,
                next_attempt_at: next,
                updated_at: new Date().toISOString()
            }).eq("id", job.id);

            // write error
            if (job.side === "origin") {
                await supabase.from("loads").update({
                    origin_coord_status: "failed",
                    origin_geocode_error: String(j?.status ?? j?.error ?? "unknown")
                }).eq("id", job.load_id);
            } else {
                await supabase.from("loads").update({
                    dest_coord_status: "failed",
                    dest_geocode_error: String(j?.status ?? j?.error ?? "unknown")
                }).eq("id", job.load_id);
            }
        }
    }

    return json({ ok: true, processed: queue.length, okCount, failCount });
});
