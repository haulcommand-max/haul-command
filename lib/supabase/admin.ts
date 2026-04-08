import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let adminClient: ReturnType<typeof createClient> | null = null;

export const getSupabaseAdmin = () => {
  if (adminClient) return adminClient;

  adminClient = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return adminClient;
};

/**
 * Lazy-initialized singleton for direct import.
 * Usage: import { supabaseAdmin } from "@/lib/supabase/admin";
 */
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return (getSupabaseAdmin() as any)[prop];
  },
});

/**
 * Broadcast a corridor event via Supabase Realtime.
 * Preserved from existing enterprise/supabase/admin.ts re-export.
 */
export async function broadcastCorridorEvent(channelName: string, event: string, payload: any) {
  const client = getSupabaseAdmin();
  const channel = client.channel(channelName);
  await channel.send({ type: "broadcast", event, payload });
}
