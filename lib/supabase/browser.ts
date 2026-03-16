// Shim: re-exports from the canonical location
// supabaseBrowser() and createClient() are identical — use createClient() for new code
import { createClient } from '@/lib/supabase/client';

export function supabaseBrowser() {
    return createClient();
}

export { createClient };
