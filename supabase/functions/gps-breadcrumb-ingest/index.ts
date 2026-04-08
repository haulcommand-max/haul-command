import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

interface BreadcrumbPayload {
  job_id: string;
  driver_id: string;
  lat: number;
  lng: number;
  accuracy_m?: number;
  recorded_at?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  const supabase = getServiceClient();
  const body: BreadcrumbPayload | BreadcrumbPayload[] = await req.json().catch(() => null);

  if (!body) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
      status: 400
    });
  }

  const breads = Array.isArray(body) ? body : [body];

  const { data, error } = await supabase
    .from("gps_breadcrumbs")
    .insert(breads.map(b => ({
      job_id: b.job_id,
      driver_id: b.driver_id,
      lat: b.lat,
      lng: b.lng,
      accuracy_m: b.accuracy_m || null,
      recorded_at: b.recorded_at || new Date().toISOString()
    })));

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
      status: 500
    });
  }

  return new Response(JSON.stringify({ ok: true, count: breads.length }), {
    headers: { ...corsHeaders, "content-type": "application/json" }
  });
});
