/// <reference types="npm:@supabase/functions-js/edge-runtime.d.ts" />
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * presence-timeout-offline — Cron every 10 minutes.
 * Sets escort_presence.status=offline if last_heartbeat_at older than 10 minutes.
 * Also cleans up expired availability windows.
 */

Deno.serve(async (req: Request) => {
    // Allow both cron invocations (no auth header) and manual triggers (with auth)
    const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date().toISOString();
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    // 1. Set offline: escorts with stale heartbeat
    const { data: timedOut, error: timeoutErr } = await supabase
        .from("escort_presence")
        .update({ status: "offline", updated_at: now })
        .in("status", ["online", "available", "resting"])
        .lt("last_heartbeat_at", tenMinutesAgo)
        .select("escort_id");

    if (timeoutErr) {
        return new Response(JSON.stringify({ error: timeoutErr.message }), { status: 500 });
    }

    // 2. Clean up expired availability windows
    const { data: expiredWindows } = await supabase
        .from("escort_availability_windows")
        .delete()
        .lt("end_at", now)
        .select("id");

    // 3. Mark expired match_offers
    await supabase
        .from("match_offers")
        .update({ status: "expired" })
        .in("status", ["offered", "viewed"])
        .lt("expires_at", now);

    return new Response(JSON.stringify({
        ok: true,
        escorts_timed_out: timedOut?.length ?? 0,
        windows_expired: expiredWindows?.length ?? 0,
        ran_at: now,
    }), { status: 200, headers: { "Content-Type": "application/json" } });
});
