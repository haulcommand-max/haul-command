// app/api/adgrid/attribution/route.ts
// POST — Records an attribution event when a claim/upgrade/conversion happens
// Links campaign_id + slot_id to the conversion for revenue tracking

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const VALID_CONVERSION_TYPES = new Set([
    "claim",
    "upgrade",
    "signup",
    "quote_request",
    "contact_unlock",
]);

export async function POST(req: NextRequest) {
    const svc = getSupabaseAdmin();

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
        return NextResponse.json({ error: "Attribution recording failed" }, { status: 500 });
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
