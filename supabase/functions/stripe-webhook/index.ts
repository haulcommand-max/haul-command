import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

/**
 * 🚨 DEPRECATED — 2026-03-27: MONETIZATION ENGINE UPGRADE
 * This Edge Function was found to drop critical Enterprise Data Purchase events 
 * and lack subscription sync architecture for user_subscriptions.
 * 
 * To ensure absolute idempotency, strict MRR syncing, and fulfillment logging, 
 * ALL Stripe webhooks MUST now route through:
 * -> /api/webhooks/stripe (Managed by lib/monetization/entitlements.ts)
 */

serve(async (req: Request) => {
    console.error("[DEPRECATED] Stripe Webhook hit the legacy Edge Function. Re-route your Stripe dashboard to send events to the Next.js /api/webhooks/stripe endpoint to prevent lost revenue.");
    
    // Returning 410 Gone ensures Stripe marks this endpoint dead and stops attempting to hit it over the new one.
    return new Response(JSON.stringify({ 
        error: 'Gone', 
        message: 'Endpoint deprecated in favor of Unified Entitlements Engine /api/webhooks/stripe' 
    }), { status: 410, headers: { "Content-Type": "application/json" } });
});
