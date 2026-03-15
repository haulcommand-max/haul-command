// lib/supabase/admin.ts — HAUL COMMAND Supabase Admin Client (CONSOLIDATED)
//
// This is the SINGLE canonical admin client for all server-side operations.
// Replaces:
//   - lib/enterprise/supabase/admin.ts (getSupabaseAdmin — non-singleton, created per call)
//   - lib/realtime/admin.ts (broadcastCorridorEvent — used module-level init)
//
// Usage:
//   import { supabaseAdmin } from '@/lib/supabase/admin';
//   import { getSupabaseAdmin } from '@/lib/supabase/admin'; // alias for backwards compat
//   import { broadcastCorridorEvent } from '@/lib/supabase/admin'; // realtime broadcasting
//
// Key difference from old enterprise/admin: uses lazy singleton (1 connection per process).
// Old enterprise/admin created a new client every call = connection leaks.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;

function _getAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  _admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}

/** Proxy-based lazy singleton — safe to import at module scope. */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (_getAdmin() as any)[prop];
  },
});

/**
 * Backwards-compatible alias for code that uses `getSupabaseAdmin()`.
 * Returns the same singleton — no connection leak.
 */
export function getSupabaseAdmin(): SupabaseClient {
  return _getAdmin();
}

// ── Realtime Broadcasting (merged from lib/realtime/admin.ts) ──

/**
 * Broadcast an event to a corridor channel via Supabase Realtime.
 * Used for surge alerts, new load notifications, etc.
 */
export async function broadcastCorridorEvent(
  corridorId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  const admin = _getAdmin();
  const channelName = `corridor:${corridorId}`;
  const channel = admin.channel(channelName);

  const status = await channel.send({
    type: "broadcast",
    event: eventType ?? "corridor_event",
    payload: payload ?? {},
  });

  await admin.removeChannel(channel);

  if (status !== "ok") {
    console.error("broadcastCorridorEvent error:", status);
    throw new Error(`Broadcast failed with status: ${status}`);
  }
}
