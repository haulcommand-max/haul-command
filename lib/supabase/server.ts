import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Server-side Supabase client for data fetching (Bypasses RLS if using Service Role, but usually we use Anon for public data)
// For this "Public Directory" use case, we can use the Anon key if RLS allows public select.
// Or use Service Role if we are strictly effectively "Static Generating" or "Server Rendering" public data.

export function supabaseServer() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Use simple client for data fetching in Server Components
    return createClient(url, key, {
        auth: {
            persistSession: false,
        },
    });
}
