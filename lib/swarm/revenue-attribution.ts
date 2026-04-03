// lib/swarm/revenue-attribution.ts
//
// Agent Revenue Attribution
// Per the agent_and_swarm_utilization_rule:
//   "Agents and swarms must be judged by output, not existence."
//   "money impact" is a required field for each agent.
//
// This module provides:
//  1. trackAgentRevenue() — attribute a revenue event to a specific agent
//  2. getAgentRevenueReport() — query per-agent revenue from swarm_activity_log
//  3. AGENT_REVENUE_MODELS — standard revenue lookups per agent_name
//
// Revenue events: claim_converted, sponsor_placed, lead_captured,
//   data_product_sold, load_matched, paywall_converted, territory_sold

import { getSupabaseAdmin } from '@/lib/enterprise/supabase/admin';

// ═══════════════════════════════════════════════════════════════
// REVENUE EVENT TYPES
// ═══════════════════════════════════════════════════════════════

export type RevenueEventType =
  | 'claim_converted'        // Operator claimed listing
  | 'sponsor_placed'         // Territory/zone sponsorship purchased
  | 'lead_captured'          // CPL lead generated
  | 'data_product_sold'      // /data marketplace purchase
  | 'load_matched'           // Load-to-operator match completed
  | 'paywall_converted'      // Free→Pro subscription
  | 'territory_sold'         // Country/state/city takeover sold
  | 'push_campaign_sent'     // Push campaign delivery fee
  | 'recruiter_lead'         // Recruiter card CPL
  | 'listing_fee'            // Classified listing posted ($20)
  | 'ad_impression'          // CPM from programmatic
  | 'ad_click'               // CPC from programmatic
  ;

export interface RevenueEvent {
  agent_name: string;
  event_type: RevenueEventType;
  amount_usd: number;
  market_key?: string;
  country?: string;
  entity_id?: string;        // claim_id, listing_id, load_id, etc.
  metadata?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// STANDARD REVENUE VALUES — per agent action
// ═══════════════════════════════════════════════════════════════

export const AGENT_REVENUE_MODELS: Record<string, Record<string, number>> = {
  // Claim & Identity
  claim_pressure_agent:       { claim_converted: 29, listing_fee: 20 },
  identity_verification_agent:{ claim_converted: 19 },  // Assists claim
  // Monetization
  adgrid_arbitrage_agent:     { ad_impression: 0.003, ad_click: 0.85, sponsor_placed: 199 },
  sponsor_inventory_agent:    { territory_sold: 499, sponsor_placed: 99 },
  paywall_gate_agent:         { paywall_converted: 49 },
  data_product_agent:         { data_product_sold: 49 },   // Avg product price
  // Demand & Leads
  lead_capture_agent:         { lead_captured: 12, recruiter_lead: 25 },
  demand_signal_agent:        { load_matched: 8 },
  // Corridor & Geo
  corridor_intelligence_agent:{ sponsor_placed: 299, data_product_sold: 79 },
  geo_expansion_agent:        { territory_sold: 199, claim_converted: 19 },
  market_mode_governor:       { sponsor_placed: 499, claim_converted: 29 }, // Mode triggers sponsor urgency
  // Push & Social
  push_campaign_agent:        { push_campaign_sent: 0.05 },  // per-send
};

// ═══════════════════════════════════════════════════════════════
// TRACK AGENT REVENUE — write to swarm_activity_log
// ═══════════════════════════════════════════════════════════════

export async function trackAgentRevenue(event: RevenueEvent): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    // Upsert a revenue attribution event into swarm_activity_log
    await supabase.from('swarm_activity_log').insert({
      agent_name: event.agent_name,
      trigger_reason: `revenue_attribution:${event.event_type}`,
      action_taken: `Revenue attributed: $${event.amount_usd.toFixed(2)} from ${event.event_type}`,
      surfaces_touched: ['monetization_events'],
      revenue_impact: event.amount_usd,
      trust_impact: null,
      country: event.country ?? 'US',
      market_key: event.market_key ?? null,
      status: 'completed',
    });

    // Also write to the dedicated monetization_events table if it exists
    // (additive — silently skips if table not yet created)
    await supabase.from('monetization_events').insert({
      agent_name: event.agent_name,
      event_type: event.event_type,
      amount_usd: event.amount_usd,
      market_key: event.market_key ?? null,
      country: event.country ?? 'US',
      entity_id: event.entity_id ?? null,
      metadata: event.metadata ?? {},
      created_at: new Date().toISOString(),
    }).throwOnError();
  } catch {
    // Silent fail — revenue attribution must never block the main flow
    console.warn('[revenue-attribution] Failed to track event:', event.event_type, event.agent_name);
  }
}

// ═══════════════════════════════════════════════════════════════
// GET AGENT REVENUE REPORT — per-agent revenue summary
// ═══════════════════════════════════════════════════════════════

export interface AgentRevenueRow {
  agent_name: string;
  total_revenue_usd: number;
  event_count: number;
  last_attributed_at: string;
}

export async function getAgentRevenueReport(
  options: { days?: number; country?: string } = {}
): Promise<AgentRevenueRow[]> {
  const supabase = getSupabaseAdmin();
  const since = new Date(
    Date.now() - (options.days ?? 30) * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from('swarm_activity_log')
    .select('agent_name, revenue_impact, created_at')
    .not('revenue_impact', 'is', null)
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  // Aggregate per agent
  const map = new Map<string, { total: number; count: number; last: string }>();
  for (const row of data) {
    const existing = map.get(row.agent_name) ?? { total: 0, count: 0, last: '' };
    existing.total += row.revenue_impact ?? 0;
    existing.count += 1;
    if (!existing.last || row.created_at > existing.last) existing.last = row.created_at;
    map.set(row.agent_name, existing);
  }

  return Array.from(map.entries())
    .map(([agent_name, v]) => ({
      agent_name,
      total_revenue_usd: Math.round(v.total * 100) / 100,
      event_count: v.count,
      last_attributed_at: v.last,
    }))
    .sort((a, b) => b.total_revenue_usd - a.total_revenue_usd);
}

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE: Attribute revenue from standard conversion events
// ═══════════════════════════════════════════════════════════════

/** Called when an operator claims a listing (triggered from claim API) */
export async function attributeClaimRevenue(
  agentName: string,
  marketKey: string,
  country: string,
  entityId: string
) {
  const model = AGENT_REVENUE_MODELS[agentName];
  const amount = model?.claim_converted ?? 29; // Default $29 first-month value
  return trackAgentRevenue({
    agent_name: agentName,
    event_type: 'claim_converted',
    amount_usd: amount,
    market_key: marketKey,
    country,
    entity_id: entityId,
  });
}

/** Called when a territory sponsor is sold */
export async function attributeSponsorRevenue(
  agentName: string,
  marketKey: string,
  country: string,
  priceUsd: number,
  entityId: string
) {
  return trackAgentRevenue({
    agent_name: agentName,
    event_type: 'territory_sold',
    amount_usd: priceUsd,
    market_key: marketKey,
    country,
    entity_id: entityId,
  });
}

/** Called when a data product is purchased */
export async function attributeDataSaleRevenue(
  agentName: string = 'data_product_agent',
  productId: string,
  priceUsd: number,
  country: string = 'US'
) {
  return trackAgentRevenue({
    agent_name: agentName,
    event_type: 'data_product_sold',
    amount_usd: priceUsd,
    country,
    entity_id: productId,
  });
}
