// app/api/adgrid/attribution/route.ts
// POST — Records an attribution event when a claim/upgrade/conversion happens
// Links campaign_id + slot_id to the conversion for revenue tracking

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
    buildAdgridEventInsert,
    buildAdgridOutcomeInsert,
} from "@/lib/monetization/adgrid-serving";

const VALID_CONVERSION_TYPES = new Set([
    "claim",
    "upgrade",
    "signup",
    "quote_request",
    "contact_unlock",
]);

export async function POST(req: NextRequest) {
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const {
        campaign_id,
        slot_id,
        creative_id,
        advertiser_id,
        page_type,
        page_context,
        conversion_type,
        entity_id,
        visitor_id,
        session_id,
        revenue_cents,
        attributed_impression_id,
        attributed_click_id,
    } = body as {
            campaign_id?: string;
            slot_id?: string;
            creative_id?: string;
            advertiser_id?: string;
            page_type?: string;
            page_context?: Record<string, unknown>;
            conversion_type?: string;
            entity_id?: string;
            visitor_id?: string;
            session_id?: string;
            revenue_cents?: number;
            attributed_impression_id?: string;
            attributed_click_id?: string;
        };

    if (!slot_id || !conversion_type) {
        return NextResponse.json({ error: "slot_id and conversion_type required" }, { status: 400 });
    }
    if (!VALID_CONVERSION_TYPES.has(conversion_type)) {
        return NextResponse.json({ error: "Invalid conversion_type" }, { status: 400 });
    }

    const svc = getSupabaseAdmin();
    const outcome = buildAdgridOutcomeInsert({
        outcomeEvent: conversion_type,
        campaignId: campaign_id,
        creativeId: creative_id,
        advertiserId: advertiser_id,
        sessionId: session_id ?? visitor_id ?? null,
        attributedImpressionId: attributed_impression_id,
        attributedClickId: attributed_click_id,
        outcomeValueCents: revenue_cents ?? null,
        billedAmountCents: revenue_cents ?? null,
        metadata: {
            slot_id,
            page_type: page_type ?? null,
            page_context: page_context ?? {},
            entity_id: entity_id ?? null,
            visitor_id: visitor_id ?? null,
        },
    });

    const { data: outcomeRow, error } = await svc
        .from(outcome.table)
        .insert(outcome.payload)
        .select('id')
        .single();

    if (error) {
        console.error("[adgrid/attribution POST]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const event = buildAdgridEventInsert({
        eventType: "conversion",
        campaignId: campaign_id,
        advertiserId: advertiser_id,
        slotId: slot_id,
        surface: page_type ?? "adgrid-conversion",
        zone: page_type ?? null,
        sessionId: session_id ?? visitor_id ?? null,
        billingAmountCents: revenue_cents ?? null,
        userAgentSummary: req.headers.get("user-agent")?.slice(0, 180) ?? null,
    });
    const { error: eventError } = await svc.from(event.table).insert(event.payload);
    if (eventError) {
        console.warn("[adgrid/attribution event]", eventError.message);
    }

    return NextResponse.json(
        { ok: true, conversion_type, outcome_id: outcomeRow?.id ?? null, event_logged: !eventError },
        { status: 201 },
    );
}
