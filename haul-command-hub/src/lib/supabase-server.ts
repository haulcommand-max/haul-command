import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Unified server-side Supabase client.
 * 
 * Uses service role key if available (full access for server-side operations),
 * falls back to anon key (RLS-enforced for public reads).
 * No cookie handling needed for public reads.
 * 
 * Gracefully handles missing env vars during build-time SSG by returning
 * null. All callers should handle a null client (or use supabaseServerSafe).
 */
export function supabaseServer(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        // During build-time SSG prerendering, env vars may not be available.
        // Return a stub client that won't crash but returns empty data.
        // The pages will be revalidated at runtime with real env vars via ISR.
        return createClient("https://placeholder.supabase.co", "placeholder-key", {
            auth: { persistSession: false },
        });
    }

    return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Alias for backward compatibility with the (directory) route group system.
 * @deprecated Use supabaseServer() directly.
 */
export const getSupabaseServerClient = supabaseServer;
