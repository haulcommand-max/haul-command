import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  const supabase = getServiceClient();

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "driver");
    
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  let count = 0;
  for (const user of users || []) {
    // 1. Review quality
    const { data: reviews } = await supabase.from("reviews").select("stars").eq("reviewee_id", user.id);
    const revAvg = reviews?.length ? reviews.reduce((acc, r) => acc + r.stars, 0) / reviews.length : 0;
    const review_quality = revAvg / 5.0; // scale 0-1

    // 2. Compute completed vs cancelled
    const { count: completeCount } = await supabase.from("jobs").select("*", { count: "exact" }).eq("driver_id", user.id).eq("status", "COMPLETE");
    const { count: cancelCount } = await supabase.from("jobs").select("*", { count: "exact" }).eq("driver_id", user.id).eq("status", "CANCELLED");
    
    const total = (completeCount ?? 0) + (cancelCount ?? 0);
    const completion_rate = total > 0 ? (completeCount ?? 0) / total : 0;
    const cancel_rate_inv = total > 0 ? 1 - ((cancelCount ?? 0) / total) : 1;
    
    // We mock the rest for this basic version
    const clean_run_score = completion_rate;
    const response_score = 1.0;
    const compliance_score = 1.0;
    const job_tenure_score = 1.0;
    const funds_verified = 1.0;

    const trust_score = 
      0.20 * review_quality +
      0.20 * completion_rate +
      0.15 * cancel_rate_inv +
      0.15 * clean_run_score +
      0.10 * response_score +
      0.10 * compliance_score +
      0.05 * job_tenure_score +
      0.05 * funds_verified;

    await supabase
      .from("driver_trust_scores")
      .upsert({
        driver_id: user.id,
        trust_score,
        review_quality,
        completion_rate,
        cancel_rate_inv,
        clean_run_score,
        response_score,
        compliance_score,
        job_tenure_score,
        funds_verified,
        computed_at: new Date().toISOString()
      }, { onConflict: "driver_id" });
      
    count++;
  }

  return new Response(JSON.stringify({ ok: true, processed: count }), {
    headers: { ...corsHeaders, "content-type": "application/json" }
  });
});
