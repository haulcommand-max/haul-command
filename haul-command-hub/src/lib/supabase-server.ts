import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client for SSR pages.
 * Uses anon key (respects RLS), no cookie handling needed for public reads.
 */
export function supabaseServer() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
    );
}
