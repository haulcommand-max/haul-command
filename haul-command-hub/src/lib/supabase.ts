import { createBrowserClient } from '@supabase/ssr';

/**
 * Create a Supabase browser client.
 * Only call this in client components at runtime.
 */
export const createClient = () => {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
};

/**
 * Lazy-initialized browser client singleton.
 * Safe to import in client components — the client is only created on first access.
 */
let _instance: ReturnType<typeof createClient> | null = null;

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
    get(_, prop) {
        if (!_instance) _instance = createClient();
        return (_instance as any)[prop];
    },
});
