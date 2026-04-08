import { createClient as _createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Server-side Supabase client for data fetching — routed through Supavisor pooler.
//
// Connection strategy:
//   - API routes / serverless →  SUPABASE_DB_POOLER_URL  (transaction mode, port 6543)
//                                 This multiplexes 100s of concurrent serverless calls
//                                 through ~10 real Postgres connections via Supavisor.
//   - Fallback (local dev)    →  NEXT_PUBLIC_SUPABASE_URL  (direct connection)
//
// Required .env vars:
//   SUPABASE_DB_POOLER_URL   — from Supabase Dashboard → Project Settings → Database
//                               → Connection Pooling → Transaction mode URL (port 6543)
//   SUPABASE_SERVICE_ROLE_KEY

/**
 * createClient() — zero-arg wrapper that auto-configures from env vars.
 * Used by 50+ API routes that do: const supabase = await createClient();
 * Falls back to the standard createClient(url, key) signature if args are passed.
 */
export function createClient(url?: string, key?: string, options?: Record<string, unknown>) {
    if (url && key) {
        return _createClient<Database>(url, key, options);
    }
    // Zero-arg: use the REST API url. The Supabase REST API internally uses connection pooling automatically.
    // SUPABASE_DB_POOLER_URL is only for direct database connections (Prisma, pg, etc), NOT the @supabase/supabase-js client.
    const envUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.SUPABASE_URL!;
    const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return _createClient<Database>(envUrl, envKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        db: {
            // Force connection recycling — prevents stale connections under heavy ingestion load
            // Remove if using prepared statements (incompatible with transaction-mode pooling)
        },
        global: {
            headers: {
                // Identifies server-side requests in Supavisor metrics
                "x-client-info": "haul-command-server/1.0",
            },
        },
    });
}

/**
 * supabaseServer() — original named export, same underlying logic.
 */
export function supabaseServer() {
    return createClient();
}
