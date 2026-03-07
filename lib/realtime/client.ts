/**
 * Singleton Supabase browser client for Realtime subscriptions.
 * Uses the existing SSR browser client from lib/supabase/browser.
 */
import { supabaseBrowser } from "@/lib/supabase/browser";

// Create a singleton client for Realtime channels —
// channels need the same client instance to manage subscriptions.
let _client: ReturnType<typeof supabaseBrowser> | null = null;

function getClient() {
    if (!_client) {
        _client = supabaseBrowser();
    }
    return _client;
}

// Re-export as a proxy object that delegates to the singleton
export const supabaseRealtime = new Proxy({} as ReturnType<typeof supabaseBrowser>, {
    get(_target, prop) {
        return (getClient() as any)[prop];
    },
});

// For backward compat with channels.ts import
export { supabaseRealtime as supabaseBrowser };
