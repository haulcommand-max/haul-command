// app/api/adgrid/attribution/route.ts
// POST — Records an attribution event when a claim/upgrade/conversion happens.
// This route uses the canonical hc_adgrid_* telemetry recorder. The legacy
// adgrid_attribution/adgrid_events tables are not assumed to exist.

import { NextRequest, NextResponse } from "next/server";
import { recordAdGridEvent } from "@/lib/adgrid/adGridEvents";

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

    const conversionType = cleanText(body.conversion_type ?? body.conversionType, 120);
    if (!conversionType) {
        return NextResponse.json({ error: "conversion_type required" }, { status: 400 });
    }
    if (!VALID_CONVERSION_TYPES.has(conversionType)) {
        return NextResponse.json({ error: "Invalid conversion_type" }, { status: 400 });
    }

    const result = await recordAdGridEvent({
        eventType: "outcome",
        campaignId: cleanText(body.campaign_id ?? body.campaignId, 80),
        slotId: cleanText(body.slot_id ?? body.slotId, 80),
        placementKey: cleanText(body.placement_key ?? body.placementKey ?? body.page_type, 120),
        pageKind: cleanText(body.page_type ?? body.pageKind, 80),
        pagePath: cleanText(body.page_path ?? body.pagePath, 300),
        countryCode: cleanText(body.country_code ?? body.countryCode, 8),
        stateCode: cleanText(body.state_code ?? body.stateCode, 24),
        corridorSlug: cleanText(body.corridor_slug ?? body.corridorSlug, 120),
        audienceRole: cleanText(body.audience_role ?? body.audienceRole, 120),
        variant: cleanText(body.variant, 120),
        referrer: req.headers.get("referer") ?? cleanText(body.referrer, 500),
        outcomeEvent: conversionType,
        outcomeValueCents: numberOrNull(body.revenue_cents ?? body.revenueCents ?? body.outcome_value_cents),
    });

    if (!result.ok) {
        return NextResponse.json({ ok: false, skipped: true, reason: result.error }, { status: 202 });
    }

    return NextResponse.json({
        ok: true,
        conversion_type: conversionType,
        campaign_id: result.campaignId,
        slot_id: result.slotId,
        event_id: result.eventId,
    }, { status: 201 });
}

function cleanText(value: unknown, maxLength: number): string | null {
    if (typeof value !== "string") return null;
    const cleaned = value.trim().replace(/[\u0000-\u001f\u007f]/g, "");
    return cleaned ? cleaned.slice(0, maxLength) : null;
}

function numberOrNull(value: unknown): number | null {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(0, Math.round(parsed));
}
