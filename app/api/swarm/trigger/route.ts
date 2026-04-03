// app/api/swarm/trigger/route.ts
// API endpoint for firing swarm triggers from frontend pages and edge middleware
// This is how page views, tool usage, claim events, etc. become real agent triggers

import { NextRequest, NextResponse } from "next/server";
import {
  onProfileViewed,
  onHighIntentPageViewed,
  onCityPageViewed,
  onCorridorPageViewed,
  onToolUsed,
  onNoResultSearch,
  onNewLoadIngested,
  onNewBrokerDetected,
  onClaimStarted,
  onClaimAbandoned,
  onClaimCompleted,
  onLeadAttempt,
  onJobCompleted,
  onTrustScoreUpdated,
} from "@/lib/swarm/trigger-wiring";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trigger, payload } = body;

    if (!trigger) {
      return NextResponse.json({ error: "trigger required" }, { status: 400 });
    }

    let result;

    switch (trigger) {
      // ── Pack A: Page/Entity triggers ──
      case "profile_viewed":
        result = await onProfileViewed(payload.entity_id, payload.country_code, payload.claimed ?? true);
        break;
      case "high_intent_page":
        result = await onHighIntentPageViewed(payload.page_type, payload.slug, payload.country_code);
        break;
      case "city_page_viewed":
        result = await onCityPageViewed(payload.slug, payload.country_code);
        break;
      case "corridor_page_viewed":
        result = await onCorridorPageViewed(payload.slug, payload.country_code);
        break;
      case "tool_used":
        result = await onToolUsed(payload.slug, payload.country_code);
        break;
      case "no_result_search":
        result = await onNoResultSearch(payload.query, payload.country_code);
        break;

      // ── Pack B: Marketplace triggers ──
      case "new_load":
        result = await onNewLoadIngested(payload.entity_id, payload.country_code, payload.corridor);
        break;
      case "new_broker":
        result = await onNewBrokerDetected(payload.entity_id, payload.country_code);
        break;

      // ── Pack C: Lifecycle triggers ──
      case "claim_started":
        result = await onClaimStarted(payload.entity_id, payload.country_code);
        break;
      case "claim_abandoned":
        result = await onClaimAbandoned(payload.entity_id, payload.country_code);
        break;
      case "claim_completed":
        result = await onClaimCompleted(payload.entity_id, payload.country_code);
        break;
      case "lead_attempt":
        result = await onLeadAttempt(payload.entity_id, payload.country_code, payload.claimed ?? true);
        break;
      case "job_completed":
        result = await onJobCompleted(payload.entity_id, payload.operator_id, payload.country_code);
        break;
      case "trust_updated":
        result = await onTrustScoreUpdated(payload.entity_id, payload.country_code, payload.delta ?? 0);
        break;

      default:
        return NextResponse.json({ error: `Unknown trigger: ${trigger}` }, { status: 400 });
    }

    return NextResponse.json({ ok: true, trigger, dispatched: result.dispatched });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
