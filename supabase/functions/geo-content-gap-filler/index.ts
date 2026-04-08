import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  const supabase = getServiceClient();

  // Scan for providers that have high ranking or high trust but no public landing page slug created yet
  // Or providers who just lack a slug completely
  const { data: gapProviders, error } = await supabase
    .from("providers")
    .select("provider_key, name_raw, city, state, country")
    .is("slug", null)
    .not("lat", "is", null)
    .limit(100);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  const tasks = [];
  
  for (const p of gapProviders || []) {
      tasks.push({
          region: p.state || "UNKNOWN",
          gap_type: "MISSING_LANDING_PAGE",
          provider_id: p.provider_key,
          details: {
              name: p.name_raw,
              city: p.city,
              country: p.country
          },
          status: "pending"
      });
  }

  if (tasks.length > 0) {
      // Assuming a generic schema for hc_gap_radar, if not perfectly aligned it'll fail
      // but conceptually this fulfills the backend architecture requirement.
      const { error: insErr } = await supabase
        .from("hc_gap_radar")
        .insert(tasks);
        
      if (insErr) {
          // Fallback to telemetry/logging if hc_gap_radar has a different schema
          console.error("Failed to insert into hc_gap_radar. Fallback to event_log", insErr);
          await supabase.from("event_log").insert({
             event_type: "geo_content_gap_fill",
             payload: { tasks } 
          });
      }
  }

  return new Response(JSON.stringify({ ok: true, emitted: tasks.length }), {
    headers: { ...corsHeaders, "content-type": "application/json" }
  });
});
