// app/api/adgrid/attribution/route.ts
// POST — Records an attribution event when a claim/upgrade/conversion happens
// Links campaign_id + slot_id to the conversion for revenue tracking

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const VALID_CONVERSION_TYPES = new Set([
    "claim",
    "upgrade",
    "signup",
    "quote_request",
    "contact_unlock",
]);

export async function POST(req: NextRequest) {
    const cookieStore = await cookies();
    const svc = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { campaign_id, slot_id, page_type, page_context, conversion_type, entity_id,
        visitor_id, session_id, revenue_cents } = body as {
            campaign_id?: string;
            slot_id?: string;
            page_type?: string;
            page_context?: Record<string, unknown>;
            conversion_type?: string;
            entity_id?: string;
            visitor_id?: string;
            session_id?: string;
            revenue_cents?: number;
        };

    if (!slot_id || !conversion_type) {
        return NextResponse.json({ error: "slot_id and conversion_type required" }, { status: 400 });
    }
    if (!VALID_CONVERSION_TYPES.has(conversion_type)) {
        return NextResponse.json({ error: "Invalid conversion_type" }, { status: 400 });
    }

    const { error } = await svc.from("adgrid_attribution").insert({
        campaign_id: campaign_id ?? null,
        slot_id,
        page_type: page_type ?? null,
        page_context: page_context ?? {},
        conversion_type,
        entity_id: entity_id ?? null,
        visitor_id: visitor_id ?? null,
        session_id: session_id ?? null,
        revenue_cents: revenue_cents ?? null,
    });

    if (error) {
        console.error("[adgrid/attribution POST]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also fire an event for analytics joining
    try {
        await svc.from("adgrid_events").insert({
            slot_id,
            event_type: "conversion",
            entity_id: entity_id ?? null,
            campaign_id: campaign_id ?? null,
            session_id: session_id ?? null,
            meta: { conversion_type, page_type, revenue_cents },
        });
    } catch { /* non-critical */ }

    return NextResponse.json({ ok: true, conversion_type }, { status: 201 });
}
