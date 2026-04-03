// lib/swarm/trigger-wiring.ts
// The trigger layer that makes agents REAL.
// Every trigger fires into swarm_activity_log and dispatches to agent_queue.
// Rule: no_trigger = dead_agent

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";
import { getAgentById, FULL_AGENT_REGISTRY } from "./index";
import type { SwarmAgentDef } from "./types";

// ═══════════════════════════════════════════════════════════════
// CORE: Fire a trigger event → find matching agents → dispatch
// ═══════════════════════════════════════════════════════════════

export async function fireTrigger(
  triggerName: string,
  payload: {
    entity_type?: string;
    entity_id?: string;
    country_code?: string;
    market_key?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<{ dispatched: string[] }> {
  const supabase = getSupabaseAdmin();

  // Find all agents that listen for this trigger
  const matching = FULL_AGENT_REGISTRY.filter(
    (a) => a.enabled && a.triggers.some((t) => t.name === triggerName)
  );

  const dispatched: string[] = [];

  for (const agent of matching) {
    // Insert into agent_queue for async processing
    await supabase.from("agent_queue").insert({
      agent_id: agent.id,
      priority: getPriority(agent),
      action_type: triggerName,
      payload: {
        trigger_name: triggerName,
        ...payload,
      },
      market_key: payload.market_key ?? null,
      status: "pending",
    });

    // Log the trigger event
    await supabase.from("swarm_activity_log").insert({
      agent_name: agent.id,
      domain: agent.domain,
      trigger_reason: triggerName,
      action_taken: `Trigger dispatched: ${triggerName}`,
      surfaces_touched: agent.write_surfaces.slice(0, 5),
      country: payload.country_code ?? null,
      market_key: payload.market_key ?? null,
      status: "queued",
      metadata: payload.metadata ?? {},
    });

    dispatched.push(agent.id);
  }

  return { dispatched };
}

function getPriority(agent: SwarmAgentDef): number {
  // Revenue-critical domains get higher priority (lower number)
  const domainPriority: Record<string, number> = {
    command_governance: 2,
    monetization_control: 3,
    matching_execution: 3,
    demand_capture: 4,
    supply_control: 4,
    claim_identity_control: 5,
    trust_reputation_control: 5,
    search_intent_capture: 6,
    data_intelligence_control: 7,
  };
  return domainPriority[agent.domain] ?? 5;
}

// ═══════════════════════════════════════════════════════════════
// TRIGGER PACK A — Page & Entity Triggers
// Called from middleware, page components, or API routes
// ═══════════════════════════════════════════════════════════════

export async function onProfileViewed(entityId: string, countryCode: string, claimed: boolean) {
  const triggerName = claimed ? "profile_viewed" : "profile_view_unclaimed";
  return fireTrigger(triggerName, {
    entity_type: "listing",
    entity_id: entityId,
    country_code: countryCode,
  });
}

export async function onHighIntentPageViewed(pageType: string, slug: string, countryCode?: string) {
  return fireTrigger("high_intent_page_visit", {
    entity_type: "page",
    entity_id: slug,
    country_code: countryCode,
    metadata: { page_type: pageType },
  });
}

export async function onCityPageViewed(citySlug: string, countryCode: string) {
  return fireTrigger("city_page_viewed", {
    entity_type: "city",
    entity_id: citySlug,
    country_code: countryCode,
  });
}

export async function onCorridorPageViewed(corridorSlug: string, countryCode: string) {
  return fireTrigger("corridor_page_viewed", {
    entity_type: "corridor",
    entity_id: corridorSlug,
    country_code: countryCode,
  });
}

export async function onToolUsed(toolSlug: string, countryCode?: string) {
  return fireTrigger("tool_used", {
    entity_type: "tool",
    entity_id: toolSlug,
    country_code: countryCode,
  });
}

export async function onNoResultSearch(query: string, countryCode?: string) {
  return fireTrigger("no_result_search", {
    entity_type: "search",
    entity_id: query,
    country_code: countryCode,
    metadata: { query },
  });
}

export async function onFailedMatch(loadId: string, countryCode: string, marketKey: string) {
  return fireTrigger("no_match_found", {
    entity_type: "load",
    entity_id: loadId,
    country_code: countryCode,
    market_key: marketKey,
  });
}

// ═══════════════════════════════════════════════════════════════
// TRIGGER PACK B — Marketplace Triggers
// ═══════════════════════════════════════════════════════════════

export async function onNewLoadIngested(loadId: string, countryCode: string, corridorSlug?: string) {
  return fireTrigger("new_load_available", {
    entity_type: "load",
    entity_id: loadId,
    country_code: countryCode,
    metadata: { corridor: corridorSlug },
  });
}

export async function onNewBrokerDetected(brokerId: string, countryCode: string) {
  return fireTrigger("broker_phone_seen", {
    entity_type: "broker",
    entity_id: brokerId,
    country_code: countryCode,
  });
}

export async function onNewProfileCreated(listingId: string, countryCode: string, marketKey: string) {
  return fireTrigger("listing_created", {
    entity_type: "listing",
    entity_id: listingId,
    country_code: countryCode,
    market_key: marketKey,
  });
}

export async function onUrgentDemand(loadId: string, countryCode: string, marketKey: string) {
  return fireTrigger("urgent_request", {
    entity_type: "load",
    entity_id: loadId,
    country_code: countryCode,
    market_key: marketKey,
  });
}

// ═══════════════════════════════════════════════════════════════
// TRIGGER PACK C — Lifecycle Triggers
// ═══════════════════════════════════════════════════════════════

export async function onClaimStarted(entityId: string, countryCode: string) {
  return fireTrigger("claim_started", {
    entity_type: "listing",
    entity_id: entityId,
    country_code: countryCode,
  });
}

export async function onClaimAbandoned(entityId: string, countryCode: string) {
  return fireTrigger("claim_abandoned", {
    entity_type: "listing",
    entity_id: entityId,
    country_code: countryCode,
  });
}

export async function onClaimCompleted(entityId: string, countryCode: string) {
  return fireTrigger("claim_completed", {
    entity_type: "listing",
    entity_id: entityId,
    country_code: countryCode,
  });
}

export async function onTrustScoreUpdated(entityId: string, countryCode: string, delta: number) {
  const triggerName = delta < -10 ? "trust_drop" : "trust_score_updated";
  return fireTrigger(triggerName, {
    entity_type: "listing",
    entity_id: entityId,
    country_code: countryCode,
    metadata: { delta },
  });
}

export async function onJobCompleted(jobId: string, operatorId: string, countryCode: string) {
  return fireTrigger("job_completed", {
    entity_type: "job",
    entity_id: jobId,
    country_code: countryCode,
    metadata: { operator_id: operatorId },
  });
}

export async function onLeadAttempt(listingId: string, countryCode: string, claimed: boolean) {
  const triggerName = claimed ? "lead_attempt" : "lead_attempt_unclaimed";
  return fireTrigger(triggerName, {
    entity_type: "listing",
    entity_id: listingId,
    country_code: countryCode,
  });
}

export async function onSignupMatchedIdentity(userId: string, entityId: string, countryCode: string) {
  return fireTrigger("user_signup_match", {
    entity_type: "user",
    entity_id: userId,
    country_code: countryCode,
    metadata: { matched_entity: entityId },
  });
}

export async function onNewPagePublished(pageSlug: string, pageType: string) {
  return fireTrigger("page_published", {
    entity_type: "page",
    entity_id: pageSlug,
    metadata: { page_type: pageType },
  });
}
