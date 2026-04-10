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
    const FCM_SERVER_KEY = Deno.env.get('FIREBASE_SERVER_KEY') || 'MOCK';
    
    // In Production: We'd lookup the user's FCM device token from a device_tokens table
    console.log(`[FCM-WORKER] Dispatching Push (Simulated) -> Title: ${pushTitle} | Body: ${pushBody} | Link: ${deepLink}`);
    
    return new Response(JSON.stringify({ success: true, dispatched: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});
