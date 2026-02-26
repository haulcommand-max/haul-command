// ============================================================================
// SHARED SUPABASE CLIENT — Used by all Edge Functions
// ============================================================================

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

let _client: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase client using service_role key.
 * Edge Functions run server-side — service_role is appropriate here.
 */
export function getSupabaseClient(): SupabaseClient {
    if (_client) return _client;

    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !key) {
        throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
    }

    _client = createClient(url, key, {
        auth: { persistSession: false },
    });

    return _client;
}

/**
 * Standard CORS headers for webhook endpoints.
 * Navixy sends POST requests — we need to handle preflight.
 */
export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-navixy-signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Validates the Navixy webhook signature.
 * Uses HMAC-SHA256 with the shared secret.
 */
export async function validateNavixySignature(
    body: string,
    signature: string | null,
    secret: string
): Promise<boolean> {
    if (!signature) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const computed = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    return computed === signature;
}
