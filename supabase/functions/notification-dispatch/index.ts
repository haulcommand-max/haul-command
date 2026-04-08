import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

interface WebhookPayload {
  type: "INSERT" | "UPDATE";
  table: string;
  record: {
    id: string;
    user_id: string;
    type: string;
    title: string;
    body: string;
    data: any;
    push_sent: boolean;
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

  const { id, user_id, title, body, push_sent } = payload.record;

  if (push_sent) {
    return new Response(JSON.stringify({ ok: true, message: "Already sent" }), {
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }

  // 1. Fetch user FCM tokens
  const { data: userData, error: userError } = await supabase
    .from("profiles")
    .select("firebase_fcm_token")
    .eq("id", user_id)
    .single();

  if (userError || !userData?.firebase_fcm_token) {
    // Cannot send push, just return
    return new Response(JSON.stringify({ ok: false, error: "No FCM token for user" }), {
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }

  // 2. Here we would send to Firebase Admin SDK
  // Since Deno Edge Functions cannot directly easily run firebase-admin, 
  // typical pattern is sending an HTTP request to a Firebase Cloud Function or our Next.js API
  
  // Example: Post to internal Next.js push endpoint
  const serviceUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://haulcommand.com";
  
  try {
    const pushRes = await fetch(`${serviceUrl}/api/internal/push-dispatch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("INTERNAL_API_KEY")}`
      },
      body: JSON.stringify({
        token: userData.firebase_fcm_token,
        title,
        body,
        data: payload.record.data
      })
    });

    if (pushRes.ok) {
      // 3. Mark as sent
      await supabase
        .from("notification_events")
        .update({ push_sent: true, push_sent_at: new Date().toISOString() })
        .eq("id", id);
      
      return new Response(JSON.stringify({ ok: true, dispatched: true }), {
        headers: { ...corsHeaders, "content-type": "application/json" }
      });
    } else {
      throw new Error(`Push API returned ${pushRes.status}`);
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
      status: 500
    });
  }
});
