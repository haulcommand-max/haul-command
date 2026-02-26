import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(data: any, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

serve(async (req) => {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => null) as { q?: string };
    const q = body?.q?.trim();
    if (!q) return json({ ok: false, error: "missing_q" }, 400);

    // Key from env OR DB secrets table
    let key = Deno.env.get("HERE_API_KEY") ?? "";
    if (!key) {
        const { data } = await supabase
            .from("integrations_secrets")
            .select("value")
            .eq("key", "here_api_key")
            .maybeSingle();
        key = data?.value ?? "";
    }
    if (!key) return json({ ok: false, status: "no_key" }, 200);

    // HERE Geocoding & Search v1
    const url = new URL("https://geocode.search.hereapi.com/v1/geocode");
    url.searchParams.set("q", q);
    url.searchParams.set("limit", "1");
    url.searchParams.set("apikey", key);

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);

    const resp = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(t);

    if (!resp.ok) return json({ ok: false, status: "provider_error", code: resp.status }, 200);

    const j = await resp.json();
    const item = j?.items?.[0];
    const lat = item?.position?.lat;
    const lng = item?.position?.lng;
    const label = item?.address?.label ?? item?.title ?? q;

    if (typeof lat !== "number" || typeof lng !== "number") {
        return json({ ok: false, status: "no_result" }, 200);
    }

    return json({ ok: true, lat, lng, label }, 200);
});
