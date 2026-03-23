/**
 * POST /api/events
 *
 * Unified event journal — writes to Supabase hc_events table.
 * Replaces console.log-only version with actual persistence.
 * Cost-tight: never blocks UX, always returns 200.
 */

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Write to Supabase hc_events (non-blocking)
  try {
    const sb = supabaseServer();
    await sb.from('hc_events').insert({
      event_type: body.name,
      properties: body.payload ?? {},
      user_id: body.user_id ?? null,
      created_at: new Date(body.ts ?? Date.now()).toISOString(),
    });
  } catch {
    // Fallback to console if DB fails — cost-tight, never block
    console.log("[event]", body.name, body.payload ?? {});
  }

  return NextResponse.json({ ok: true });
}
