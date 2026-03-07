import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/events/track
 * Unified behavioral event tracker.
 * Fires from any page: search, view, click, impression, etc.
 * Feeds pricing AI, demand models, operator ranking.
 */
export async function POST(req: NextRequest) {
    try {
        const { event_name, entity_type, entity_id, user_id, payload } = await req.json();

        if (!event_name) {
            return NextResponse.json({ error: "event_name required" }, { status: 400 });
        }

        const sb = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await sb.rpc("hc_track_event", {
            p_event_name: event_name,
            p_entity_type: entity_type || null,
            p_entity_id: entity_id || null,
            p_user_id: user_id || null,
            p_payload: payload || {},
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
