import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * FIREBASE CLOUD MESSAGING EDGE WORKER
 * Automatically deep-links native app pushes based on Supabase Database Webhook payloads.
 */
serve(async (req) => {
  try {
    const payload = await req.json();
    const table = payload.table;
    const record = payload.record;
    
    console.log(`[FCM-WORKER] Processing Webhook Trigger for table: ${table}`);

    let pushTitle = 'Haul Command System Alert';
    let pushBody = '';
    let deepLink = 'haulcommand://dashboard';

    // Route logic based on DB Webhook Source
    if (table === 'job_applications') {
       pushTitle = 'New Elite Vector Bid';
       pushBody = `Operator has transmitted a bid for load vector.`;
       deepLink = `haulcommand://load-board/${record.job_id}`;
    } else if (table === 'hc_training_diagnostics') {
       pushTitle = 'Diagnostic Gap Detected';
       pushBody = `A fatal operational gap was logged. Deploy protocol patch immediately.`;
       deepLink = `haulcommand://training/report-card`;
    }

    // Call Firebase HTTP v1 API
    const FCM_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID');
    const FCM_OAUTH_TOKEN = Deno.env.get('FIREBASE_OAUTH_TOKEN'); // Assuming short-lived token generated elsewhere or static test token
    
    // Lookup the user's FCM device token from push_subscriptions table
    const { getServiceClient } = await import('../_shared/supabase.ts');
    const supabase = getServiceClient();
    
    let targetUserId = record.user_id || record.profile_id;
    if (table === 'job_applications') targetUserId = record.operator_id;

    if (!targetUserId) {
        return new Response(JSON.stringify({ error: "No user_id found in record" }), { status: 400 });
    }

    const { data: tokens } = await supabase
      .from('push_subscriptions')
      .select('fcm_token')
      .eq('user_id', targetUserId)
      .not('fcm_token', 'is', null);

    if (!tokens || tokens.length === 0) {
        console.log(`[FCM-WORKER] No tokens found for user ${targetUserId}, skipping push.`);
        return new Response(JSON.stringify({ success: true, dispatched: false, reason: "no_token" }), { headers: { "Content-Type": "application/json" } });
    }

    let successCount = 0;
    
    if (FCM_PROJECT_ID && FCM_OAUTH_TOKEN) {
        for (const t of tokens) {
            const res = await fetch(`https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${FCM_OAUTH_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: {
                        token: t.fcm_token,
                        notification: { title: pushTitle, body: pushBody },
                        data: { deepLink }
                    }
                })
            });
            if (res.ok) successCount++;
        }
    } else {
         console.warn("[FCM-WORKER] Missing FIREBASE_PROJECT_ID/OAUTH_TOKEN - skipping actual API call.");
    }
    
    console.log(`[FCM-WORKER] Dispatched Push -> Title: ${pushTitle} | Body: ${pushBody} | Link: ${deepLink} | Successes: ${successCount}/${tokens.length}`);
    
    return new Response(JSON.stringify({ success: true, dispatched: true, successCount }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});
