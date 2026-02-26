// Setup type definitions for built-in Deno APIs
/// <reference lib="deno.ns" />

import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

type Req = { cert_slugs: string[]; region_slugs: string[] };
type Res =
  | { ok: true; allowed: Record<string, boolean>; detail: Array<{ region: string; allowed: boolean; notes?: string }> }
  | { ok: false; error: string };

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    let body: Req;
    try {
        body = await req.json();
    } catch {
        const res: Res = { ok: false, error: "invalid json" };
        return new Response(JSON.stringify(res), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    const certs   = (body.cert_slugs ?? []).map(s => s.toLowerCase());
    const regions = (body.region_slugs ?? []).map(s => s.toLowerCase());

    if (certs.length === 0 || regions.length === 0) {
        const res: Res = { ok: false, error: "cert_slugs and region_slugs are required" };
        return new Response(JSON.stringify(res), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    const supabase = getServiceClient();

    const { data: rules, error } = await supabase
        .from("reciprocity_rules")
        .select("from_cert_slug, to_region_slug, allowed, notes")
        .in("from_cert_slug", certs)
        .in("to_region_slug", regions);

    if (error) {
        const res: Res = { ok: false, error: error.message };
        return new Response(JSON.stringify(res), { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    // Build allowed map: a region is allowed if ANY provided cert allows it
    const allowedMap: Record<string, boolean> = {};
    const notesMap: Record<string, string>    = {};

    for (const r of regions) allowedMap[r] = false;

    for (const row of rules ?? []) {
        if (row.allowed) {
            allowedMap[row.to_region_slug] = true;
            if (row.notes) notesMap[row.to_region_slug] = row.notes;
        }
    }

    const detail = regions.map(r => ({
        region:  r,
        allowed: allowedMap[r] ?? false,
        ...(notesMap[r] ? { notes: notesMap[r] } : {}),
    }));

    const res: Res = { ok: true, allowed: allowedMap, detail };
    return new Response(JSON.stringify(res), { headers: { ...corsHeaders, "content-type": "application/json" } });
});
