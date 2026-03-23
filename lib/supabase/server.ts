import { createClient as _createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Server-side Supabase client for data fetching
// Supports both the old pattern { createClient } (0-arg) and the original supabaseServer()

/**
 * createClient() — zero-arg wrapper that auto-configures from env vars.
 * Used by 50+ API routes that do: const supabase = await createClient();
 * Falls back to the standard createClient(url, key) signature if args are passed.
 */
export function createClient(url?: string, key?: string, options?: Record<string, unknown>) {
    if (url && key) {
        return _createClient(url, key, options);
    }
    // Zero-arg: auto-configure from env
    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
    const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return _createClient(envUrl, envKey, {
        auth: { persistSession: false },
    });
}

/**
 * supabaseServer() — original named export, same underlying logic.
 */
export function supabaseServer() {
    return createClient();
}
