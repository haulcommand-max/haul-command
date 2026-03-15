// SHIM: Re-export from canonical location for backwards compatibility.
// All 95+ imports of getSupabaseAdmin continue to work without changes.
// The canonical singleton lives in lib/supabase/admin.ts.
export { getSupabaseAdmin, supabaseAdmin, broadcastCorridorEvent } from '@/lib/supabase/admin';
