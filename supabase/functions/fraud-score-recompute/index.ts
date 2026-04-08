import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  const supabase = getServiceClient();

  // Call the recalculation RPC or execute the logic directly
  // Note: in a production scenario, you would perform rolling window calculations
  // For this schema, we compute fraud scores and push them to fraud_signals
  
  const { data: users, error } = await supabase
    .from("profiles")
    .select("id");
    
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  // Very simplified fraud score update for demonstration
  for (const user of users || []) {
    // Check missing identity (L0)
    const { count: kycCount } = await supabase.from("kyc_verifications").select("*", { count: "exact" }).eq("user_id", user.id);
    const identity_thin = kycCount === 0 ? 0.8 : 0;
    
    // Check cancel spikes
    const { count: cancelCount } = await supabase.from("jobs").select("*", { count: "exact" }).eq("driver_id", user.id).eq("status", "CANCELLED");
    const cancel_spike = (cancelCount ?? 0) > 3 ? 0.6 : 0;
    
    const fraud_score = Math.min(1.0, (0.08 * identity_thin) + (0.12 * cancel_spike));

    await supabase
      .from("fraud_signals")
      .upsert({
        user_id: user.id,
        identity_thin,
        cancel_spike,
        fraud_score,
        computed_at: new Date().toISOString()
      }, { onConflict: "user_id" });
  }

  return new Response(JSON.stringify({ ok: true, processed: users?.length }), {
    headers: { ...corsHeaders, "content-type": "application/json" }
  });
});
