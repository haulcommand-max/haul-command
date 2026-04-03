// lib/swarm/use-swarm-trigger.ts
// Client-side hook to fire swarm triggers from React components
// Fires silently — does not block UI, does not show errors to users

"use client";

export function fireSwarmTrigger(
  trigger: string,
  payload: Record<string, unknown>
): void {
  // Fire-and-forget — no await, no error shown to user
  fetch("/api/swarm/trigger", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trigger, payload }),
  }).catch(() => {
    // Silent fail — swarm triggers must never break UI
  });
}

// ── Pre-built trigger helpers ──

export function triggerProfileView(entityId: string, countryCode: string, claimed: boolean) {
  fireSwarmTrigger("profile_viewed", { entity_id: entityId, country_code: countryCode, claimed });
}

export function triggerCityPageView(slug: string, countryCode: string) {
  fireSwarmTrigger("city_page_viewed", { slug, country_code: countryCode });
}

export function triggerCorridorPageView(slug: string, countryCode: string) {
  fireSwarmTrigger("corridor_page_viewed", { slug, country_code: countryCode });
}

export function triggerToolUsed(toolSlug: string, countryCode?: string) {
  fireSwarmTrigger("tool_used", { slug: toolSlug, country_code: countryCode });
}

export function triggerHighIntentPage(pageType: string, slug: string, countryCode?: string) {
  fireSwarmTrigger("high_intent_page", { page_type: pageType, slug, country_code: countryCode });
}

export function triggerClaimStarted(entityId: string, countryCode: string) {
  fireSwarmTrigger("claim_started", { entity_id: entityId, country_code: countryCode });
}

export function triggerClaimCompleted(entityId: string, countryCode: string) {
  fireSwarmTrigger("claim_completed", { entity_id: entityId, country_code: countryCode });
}

export function triggerLeadAttempt(entityId: string, countryCode: string, claimed: boolean) {
  fireSwarmTrigger("lead_attempt", { entity_id: entityId, country_code: countryCode, claimed });
}
