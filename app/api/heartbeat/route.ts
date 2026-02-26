export const dynamic = 'force-dynamic';
/**
 * POST /api/heartbeat
 *
 * Updates the authenticated user's last_seen_at in escort_profiles
 * and upserts their row in operator_heartbeats.
 *
 * Rate-limited: one meaningful DB write per 90 seconds per user
 * (prevents hammering on every tab-focus event).
 *
 * Auth: requires valid Supabase JWT in Authorization header.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// In-memory throttle (per-process, resets on cold start — acceptable for heartbeat)
const lastWrite = new Map<string, number>();
const THROTTLE_MS = 90_000; // 90 seconds

export async function POST(req: Request) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        // Silently accept — heartbeat from unauthenticated user is a no-op
        return NextResponse.json({ ok: true });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: true });

    // Throttle
    const last = lastWrite.get(user.id) ?? 0;
    if (Date.now() - last < THROTTLE_MS) {
        return NextResponse.json({ ok: true, throttled: true });
    }
    lastWrite.set(user.id, Date.now());

    // Service role client for write
    const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const now = new Date().toISOString();

    await Promise.all([
        // Update escort_profiles last_seen_at
        admin
            .from("escort_profiles")
            .update({ last_seen_at: now })
            .eq("user_id", user.id),

        // Upsert operator_heartbeats (lightweight, fast)
        admin
            .from("operator_heartbeats")
            .upsert({ user_id: user.id, seen_at: now }, { onConflict: "user_id" }),
    ]);

    return NextResponse.json({ ok: true });
}
