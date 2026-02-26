// supabase/functions/here-polyline/index.ts
// Server-side polyline fetch from HERE Routing v8.
// Dormant until HERE key exists in Supabase secrets table OR env.
// Safe failure modes; never throws sensitive details.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Req = {
  load_id: string;
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = (await req.json().catch(() => null)) as Req | null;
    if (!body?.load_id) return json({ ok: false, error: "missing_load_id" }, 400);

    // Read HERE key from env first (preferred), fallback to DB secret
    const hereKeyEnv = Deno.env.get("HERE_API_KEY") ?? "";
    let hereKey = hereKeyEnv;

    if (!hereKey) {
      const { data: secretRow, error: secretErr } = await supabase
        .from("integrations_secrets")
        .select("value")
        .eq("key", "here_api_key")
        .maybeSingle();

      if (secretErr) return json({ ok: false, status: "no_key" }, 200);
      hereKey = secretRow?.value ?? "";
    }

    if (!hereKey) {
      return json({ ok: false, status: "no_key" }, 200);
    }

    // Load coordinates
    const { data: load, error: loadErr } = await supabase
      .from("loads")
      .select("id, origin_lat, origin_lng, dest_lat, dest_lng")
      .eq("id", body.load_id)
      .maybeSingle();

    if (loadErr || !load) return json({ ok: false, status: "missing_load" }, 404);

    const { origin_lat, origin_lng, dest_lat, dest_lng } = load as any;
    if (
      typeof origin_lat !== "number" ||
      typeof origin_lng !== "number" ||
      typeof dest_lat !== "number" ||
      typeof dest_lng !== "number"
    ) {
      return json({ ok: false, status: "missing_coords" }, 200);
    }

    // HERE Routing v8 request
    const url = new URL("https://router.hereapi.com/v8/routes");
    url.searchParams.set("transportMode", "car");
    url.searchParams.set("origin", `${origin_lat},${origin_lng}`);
    url.searchParams.set("destination", `${dest_lat},${dest_lng}`);

    // Request polyline; summary is optional
    url.searchParams.set("return", "polyline,summary");
    url.searchParams.set("apikey", hereKey);

    // Timeout protection
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);

    const resp = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(t);

    if (!resp.ok) {
      return json({ ok: false, status: "provider_error", code: resp.status }, 200);
    }

    const j = await resp.json();
    const polyline = j?.routes?.[0]?.sections?.[0]?.polyline;
    if (!polyline || typeof polyline !== "string") {
      return json({ ok: false, status: "no_polyline" }, 200);
    }

    // Store polyline
    // TTL days comes from feature flag config
    const { data: flag, error: flagErr } = await supabase
      .from("feature_flags")
      .select("config, enabled")
      .eq("key", "polyline_store")
      .maybeSingle();

    const ttlDays =
      (flag?.config?.ttl_days && Number(flag.config.ttl_days)) || 7;

    const ttlAt = new Date(Date.now() + ttlDays * 86400 * 1000).toISOString();

    const { error: updErr } = await supabase
      .from("loads")
      .update({
        route_polyline: polyline,
        route_polyline_provider: "here",
        route_polyline_created_at: new Date().toISOString(),
        route_polyline_ttl_at: ttlAt,
        route_polyline_status: "ok",
        route_polyline_error: null,
      })
      .eq("id", body.load_id);

    if (updErr) return json({ ok: false, status: "db_update_failed" }, 200);

    return json({ ok: true, status: "ok" }, 200);
  } catch (_e) {
    return json({ ok: false, status: "exception" }, 200);
  }
});
