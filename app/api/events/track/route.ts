import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/events/track
 * Unified behavioral event tracker.
 * Fires from any page: search, view, click, impression, etc.
 * Feeds pricing AI, demand models, operator ranking.
 */
export async function POST(req: NextRequest) {
    try {
        const { event_name, entity_type, entity_id, payload } = await req.json();

        if (!event_name) {
            return NextResponse.json({ error: "event_name required" }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const sb = getSupabaseAdmin();

        const { data, error } = await sb.rpc("hc_track_event", {
            p_event_name: event_name,
            p_entity_type: entity_type || null,
            p_entity_id: entity_id || null,
            p_user_id: user?.id || null,
            p_payload: payload || {},
        });

        if (error) {
            console.error("[events-track] event RPC failed:", error);
            return NextResponse.json({ error: "Event tracking failed" }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
