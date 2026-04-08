import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

interface WebhookPayload {
  type: "INSERT" | "UPDATE";
  table: string;
  record: {
    id: string; // job id
    driver_id: string;
    broker_id: string;
    rate_cents: number;
    status: string;
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  const supabase = getServiceClient();
  const payload: WebhookPayload = await req.json().catch(() => null);

  if (!payload || !payload.record) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
      status: 400
    });
  }

  const { driver_id, rate_cents } = payload.record;

  // Rule: If rate_cents > 50000 ($500) and user KYC level < 2, dispatch a step-up event
  if (rate_cents > 50000) {
    const { data: profile } = await supabase.from("profiles").select("kyc_level").eq("id", driver_id).single();
    
    if (profile && profile.kyc_level < 2) {
      // Dispatch notification event for step up required
      await supabase.from("notification_events").insert({
        user_id: driver_id,
        type: "KYC_STEP_UP_REQUIRED",
        title: "KYC Verification Upgrade Required",
        body: "This job's value requires KYC Level 2. Please upload additional documentation.",
        data: { job_id: payload.record.id, required_level: 2 }
      });
      
      return new Response(JSON.stringify({ ok: true, stepUpTriggered: true }), {
        headers: { ...corsHeaders, "content-type": "application/json" }
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, stepUpTriggered: false }), {
    headers: { ...corsHeaders, "content-type": "application/json" }
  });
});
