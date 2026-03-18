/**
 * Re-exports from the consolidated Supabase server client.
 * All imports from '@/lib/supabase/server' now go through the single source of truth.
 */
export { supabaseServer as getSupabaseServerClient } from "@/lib/supabase-server";
