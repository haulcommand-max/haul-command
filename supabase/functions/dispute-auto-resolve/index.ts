import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  const supabase = getServiceClient();

  // Tier 1 logic: If GPS proves the operator was on site the whole time, resolve in operator's favor.
  // Else, if GPS proves the operator never showed up, resolve in broker's favor.

  const { data: disputes, error } = await supabase
    .from("disputes")
    .select("*, jobs(*)")
    .eq("status", "OPENED")
    .eq("tier", 1)
    .lte("escalate_at", new Date().toISOString());

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  const results = [];

  for (const dispute of disputes || []) {
    const job = dispute.jobs;
    if (!job) continue;

    // simplistic GPS check
    const hasGpsConfirmation = job.gps_start_confirmed_at && job.gps_end_confirmed_at;
    
    let resolution = "";
    if (hasGpsConfirmation) {
      resolution = "Auto-resolved in favor of operator. GPS proofs validated presence.";
    } else {
      resolution = "Auto-resolved in favor of broker. No GPS start/end sequences recorded.";
    }

    const { error: updErr } = await supabase
      .from("disputes")
      .update({
        status: "RESOLVED",
        auto_resolved: true,
        resolution,
        resolved_at: new Date().toISOString()
      })
      .eq("id", dispute.id);

    if (updErr) {
      results.push({ id: dispute.id, error: updErr.message });
    } else {
      results.push({ id: dispute.id, status: "RESOLVED" });
    }
  }

  return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
    headers: { ...corsHeaders, "content-type": "application/json" }
  });
});
