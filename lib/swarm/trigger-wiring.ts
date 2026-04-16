/**
 * lib/swarm/trigger-wiring.ts
 * Swarm Trigger Wiring — maps page events to autonomous agent triggers.
 * All functions are fire-and-forget safe (non-blocking).
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin';

async function dispatchTrigger(
  triggerType: string,
  payload: Record<string, unknown>
): Promise<{ dispatched: number }> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('hc_workflow_queues').insert({
    queue_name: `swarm.${triggerType}`,
    worker_key: 'swarm-worker',
    payload_json: payload,
    status: 'pending',
    priority: 50,
  });
  if (error) console.warn(`[swarm-trigger] ${triggerType} dispatch failed:`, error.message);
  return { dispatched: error ? 0 : 1 };
}

export const onProfileViewed = (entityId: string, country: string, claimed: boolean) =>
  dispatchTrigger('profile_viewed', { entity_id: entityId, country_code: country, claimed });

export const onHighIntentPageViewed = (pageType: string, slug: string, country: string) =>
  dispatchTrigger('high_intent_page', { page_type: pageType, slug, country_code: country });

export const onCityPageViewed = (slug: string, country: string) =>
  dispatchTrigger('city_page_viewed', { slug, country_code: country });

export const onCorridorPageViewed = (slug: string, country: string) =>
  dispatchTrigger('corridor_page_viewed', { slug, country_code: country });

export const onToolUsed = (slug: string, country: string) =>
  dispatchTrigger('tool_used', { slug, country_code: country });

export const onNoResultSearch = (query: string, country: string) =>
  dispatchTrigger('no_result_search', { query, country_code: country });

export const onNewLoadIngested = (entityId: string, country: string, corridor: string) =>
  dispatchTrigger('new_load', { entity_id: entityId, country_code: country, corridor });

export const onNewBrokerDetected = (entityId: string, country: string) =>
  dispatchTrigger('new_broker', { entity_id: entityId, country_code: country });

export const onClaimStarted = (entityId: string, country: string) =>
  dispatchTrigger('claim_started', { entity_id: entityId, country_code: country });

export const onClaimAbandoned = (entityId: string, country: string) =>
  dispatchTrigger('claim_abandoned', { entity_id: entityId, country_code: country });

export const onClaimCompleted = (entityId: string, country: string) =>
  dispatchTrigger('claim_completed', { entity_id: entityId, country_code: country });

export const onLeadAttempt = (entityId: string, country: string, claimed: boolean) =>
  dispatchTrigger('lead_attempt', { entity_id: entityId, country_code: country, claimed });

export const onJobCompleted = (jobId: string, operatorId: string, country: string) =>
  dispatchTrigger('job_completed', { entity_id: jobId, operator_id: operatorId, country_code: country });

export const onTrustScoreUpdated = (entityId: string, country: string, delta: number) =>
  dispatchTrigger('trust_updated', { entity_id: entityId, country_code: country, delta });
