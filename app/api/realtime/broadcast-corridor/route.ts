import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { broadcastCorridorEvent } from "@/lib/supabase/admin";

/**
 * POST /api/realtime/broadcast-corridor
 * Broadcasts an event to all clients subscribed to a corridor channel.
 * Used for surge alerts, new loads, closures, etc.
 */
export async function POST(req: Request) {
    const { corridorId, type, payload } = await req.json();

    if (!corridorId) {
        return NextResponse.json({ error: "corridorId is required" }, { status: 400 });
    }

    try {
        await broadcastCorridorEvent(corridorId, type ?? "corridor_event", payload ?? {});
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
