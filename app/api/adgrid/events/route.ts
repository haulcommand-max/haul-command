// app/api/adgrid/events/route.ts
// POST — fire AdGrid telemetry events (impression, click, outcome/conversion).
// Anonymous telemetry is allowed, but payloads are normalized into the canonical
// hc_adgrid_* event recorder instead of writing to the legacy adgrid_events table.

import { NextRequest, NextResponse } from "next/server";
import { recordAdGridEvent, type AdGridEventType } from "@/lib/adgrid/adGridEvents";

const VALID_EVENTS = new Set([
  "impression",
  "click",
  "outcome",
  "sponsor_cta_click",
  "lead_form_submit",
  "checkout_started",
  "corridor_featured_inquiry_started",
  "profile_view",
  "claim_started",
  "upgrade_started",
  "conversion",
]);

const CLICK_EVENTS = new Set(["click", "sponsor_cta_click", "profile_view"]);
const OUTCOME_EVENTS = new Set([
  "outcome",
  "lead_form_submit",
  "checkout_started",
  "corridor_featured_inquiry_started",
  "claim_started",
  "upgrade_started",
  "conversion",
]);

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawEvent = cleanText(body.eventType ?? body.event_type ?? "impression", 80) ?? "impression";
  if (!VALID_EVENTS.has(rawEvent)) {
    return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
  }

  const eventType = toCanonicalEventType(rawEvent);
  const pagePath = cleanText(body.pagePath ?? body.page_path, 300);
  const pageKind = cleanText(body.pageKind ?? body.page_kind ?? body.page_type ?? body.surface, 80);
  const placementKey = cleanText(
    body.placementKey ?? body.placement_key ?? body.placement ?? body.surface ?? body.slot_key,
    120,
  );

  const result = await recordAdGridEvent({
    eventType,
    campaignId: cleanText(body.campaignId ?? body.campaign_id, 80),
    slotId: cleanText(body.slotId ?? body.slot_id, 80),
    placementKey,
    pageKind,
    pagePath,
    countryCode: cleanText(body.countryCode ?? body.country_code, 8),
    stateCode: cleanText(body.stateCode ?? body.state_code, 24),
    corridorSlug: cleanText(body.corridorSlug ?? body.corridor_slug, 120),
    audienceRole: cleanText(body.audienceRole ?? body.audience_role ?? body.role, 120),
    variant: cleanText(body.variant, 120),
    referrer: req.headers.get("referer") ?? cleanText(body.referrer, 500),
    outcomeEvent: eventType === "outcome" ? rawEvent : cleanText(body.outcomeEvent ?? body.outcome_event, 120),
    outcomeValueCents: numberOrNull(body.outcomeValueCents ?? body.outcome_value_cents ?? body.revenue_cents),
  });

  // Telemetry must not block the public conversion path. Return 202 when no active
  // campaign/slot is available so clients do not treat this as a hard app failure.
  if (!result.ok) {
    return NextResponse.json({ ok: false, skipped: true, reason: result.error }, { status: 202 });
  }

  return new NextResponse(null, { status: 204 });
}

function toCanonicalEventType(eventType: string): AdGridEventType {
  if (CLICK_EVENTS.has(eventType)) return "click";
  if (OUTCOME_EVENTS.has(eventType)) return "outcome";
  return "impression";
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
