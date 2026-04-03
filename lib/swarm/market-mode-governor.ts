// lib/swarm/market-mode-governor.ts
//
// Market Mode Governor
// Each market (country × region × city) has a MODE that governs
// how agents behave, which monetization surfaces activate, and
// what content strategy dominates.
//
// Modes: seeding → demand_capture → waitlist → live → shortage → rescue
//
// Rule: no_market_without_mode

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";
import { AGENT_REVENUE_MODELS } from "@/lib/swarm/revenue-attribution";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type MarketMode =
  | "seeding"          // No supply, no demand. Build shells, seed content.
  | "demand_capture"   // Some supply exists. Focus on capturing demand signals.
  | "waitlist"         // Demand exists but supply can't fill. Waitlist + recruit.
  | "live"             // Supply + demand active. Full matching + monetization.
  | "shortage"         // Demand outpacing supply dangerously. Recruit + surge.
  | "rescue"           // Critical gap. Escalate everything.
  ;

export interface MarketState {
  market_key: string;          // e.g. "us-texas-houston" or "au-nsw"
  country_code: string;
  region?: string;
  city?: string;
  mode: MarketMode;
  supply_count: number;
  claimed_count: number;
  demand_signals_30d: number;
  match_rate_30d: number;      // 0.0 – 1.0
  fill_rate_30d: number;       // 0.0 – 1.0
  avg_response_time_hours: number;
  sponsor_inventory_filled: number; // 0.0 – 1.0
  last_evaluated: string;
}

export interface ModePolicy {
  mode: MarketMode;
  supply_priority: "critical" | "high" | "normal" | "low";
  demand_priority: "critical" | "high" | "normal" | "low";
  claim_pressure: "aggressive" | "moderate" | "gentle" | "passive";
  monetization_strategy: string;
  content_strategy: string;
  matching_behavior: string;
  sponsor_behavior: string;
}

// ═══════════════════════════════════════════════════════════════
// MODE POLICIES — how agents BEHAVE in each mode
// ═══════════════════════════════════════════════════════════════

export const MODE_POLICIES: Record<MarketMode, ModePolicy> = {
  seeding: {
    mode: "seeding",
    supply_priority: "critical",
    demand_priority: "low",
    claim_pressure: "passive",
    monetization_strategy: "launch_sponsorship_only",
    content_strategy: "publish_shells_glossary_regulations",
    matching_behavior: "disabled",
    sponsor_behavior: "offer_territory_launch_packages",
  },
  demand_capture: {
    mode: "demand_capture",
    supply_priority: "high",
    demand_priority: "critical",
    claim_pressure: "moderate",
    monetization_strategy: "lead_capture_and_broker_subscriptions",
    content_strategy: "corridor_pages_and_demand_funnels",
    matching_behavior: "basic_with_fallbacks",
    sponsor_behavior: "market_heat_sponsors_active",
  },
  waitlist: {
    mode: "waitlist",
    supply_priority: "critical",
    demand_priority: "high",
    claim_pressure: "aggressive",
    monetization_strategy: "waitlist_premium_and_priority_access",
    content_strategy: "supply_recruitment_content",
    matching_behavior: "waitlist_queue_with_eta",
    sponsor_behavior: "shortage_sponsors_premium_pricing",
  },
  live: {
    mode: "live",
    supply_priority: "normal",
    demand_priority: "normal",
    claim_pressure: "moderate",
    monetization_strategy: "full_stack_subscriptions_ads_leads_data",
    content_strategy: "hyperlocal_depth_and_freshness",
    matching_behavior: "full_ranked_matching",
    sponsor_behavior: "all_inventory_types_active",
  },
  shortage: {
    mode: "shortage",
    supply_priority: "critical",
    demand_priority: "normal",
    claim_pressure: "aggressive",
    monetization_strategy: "surge_pricing_and_urgent_fill_fees",
    content_strategy: "urgency_surfaces_and_recruitment",
    matching_behavior: "rescue_mode_wider_radius_fallbacks",
    sponsor_behavior: "shortage_premium_and_urgency_sponsors",
  },
  rescue: {
    mode: "rescue",
    supply_priority: "critical",
    demand_priority: "critical",
    claim_pressure: "aggressive",
    monetization_strategy: "concierge_fees_and_rescue_markup",
    content_strategy: "emergency_surfaces",
    matching_behavior: "cross_market_rescue_matching",
    sponsor_behavior: "emergency_sponsor_slots_at_premium",
  },
};

// ═══════════════════════════════════════════════════════════════
// EVALUATE MARKET MODE — pure function, no side effects
// ═══════════════════════════════════════════════════════════════

export function evaluateMarketMode(state: Omit<MarketState, "mode" | "last_evaluated">): MarketMode {
  const { supply_count, claimed_count, demand_signals_30d, match_rate_30d, fill_rate_30d } = state;

  // === RESCUE: Critical failure state ===
  if (demand_signals_30d > 20 && fill_rate_30d < 0.1 && supply_count < 3) {
    return "rescue";
  }

  // === SHORTAGE: Demand outpacing supply ===
  if (demand_signals_30d > 10 && fill_rate_30d < 0.3 && supply_count < demand_signals_30d * 0.5) {
    return "shortage";
  }

  // === SEEDING: No meaningful supply or demand ===
  if (supply_count < 3 && demand_signals_30d < 3) {
    return "seeding";
  }

  // === WAITLIST: Some supply but can't fill demand ===
  if (demand_signals_30d > 5 && fill_rate_30d < 0.4 && claimed_count < 5) {
    return "waitlist";
  }

  // === DEMAND CAPTURE: Supply exists, need more demand ===
  if (supply_count >= 3 && demand_signals_30d < 5) {
    return "demand_capture";
  }

  // === LIVE: Healthy market ===
  return "live";
}

// ═══════════════════════════════════════════════════════════════
// GET MARKET STATE — read from Supabase
// ═══════════════════════════════════════════════════════════════

export async function getMarketState(marketKey: string): Promise<MarketState | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("market_states")
    .select("*")
    .eq("market_key", marketKey)
    .maybeSingle();

  return data as MarketState | null;
}

export async function getMarketPolicy(marketKey: string): Promise<ModePolicy> {
  const state = await getMarketState(marketKey);
  if (!state) return MODE_POLICIES.seeding; // Default to seeding for unknown markets
  return MODE_POLICIES[state.mode];
}

// ═══════════════════════════════════════════════════════════════
// BATCH EVALUATE — recompute all market modes (cron job)
// ═══════════════════════════════════════════════════════════════

export async function batchEvaluateMarketModes(): Promise<{
  evaluated: number;
  mode_changes: { market_key: string; old_mode: MarketMode; new_mode: MarketMode }[];
}> {
  const supabase = getSupabaseAdmin();
  const { data: markets } = await supabase
    .from("market_states")
    .select("*");

  const allMarkets = (markets ?? []) as MarketState[];
  const changes: { market_key: string; old_mode: MarketMode; new_mode: MarketMode }[] = [];

  for (const market of allMarkets) {
    const newMode = evaluateMarketMode(market);
    if (newMode !== market.mode) {
      changes.push({
        market_key: market.market_key,
        old_mode: market.mode,
        new_mode: newMode,
      });

      await supabase
        .from("market_states")
        .update({
          mode: newMode,
          last_evaluated: new Date().toISOString(),
        })
        .eq("market_key", market.market_key);

      // Log the transition for the swarm activity feed — with revenue attribution
      // Revenue is estimated based on mode's monetization strategy value
      const revenueModel = AGENT_REVENUE_MODELS['market_mode_governor'] ?? {};
      const estimatedRevenue = newMode === 'shortage' || newMode === 'rescue'
        ? revenueModel.sponsor_placed ?? null   // Urgent modes unlock premium sponsor slots
        : newMode === 'live'
        ? revenueModel.claim_converted ?? null  // Live mode unlocks standard claims
        : null;

      await supabase.from("swarm_activity_log").insert({
        agent_name: "market_mode_governor",
        trigger_reason: `mode_transition:${market.mode}→${newMode}`,
        action_taken: `Market ${market.market_key} mode changed → ${newMode} (${MODE_POLICIES[newMode].monetization_strategy})`,
        surfaces_touched: ["market_states", "monetization_surfaces"],
        revenue_impact: estimatedRevenue,
        trust_impact: null,
        country: market.country_code,
        market_key: market.market_key,
        status: "completed",
      });
    }
  }

  return { evaluated: allMarkets.length, mode_changes: changes };
}

// ═══════════════════════════════════════════════════════════════
// BUILD MARKET KEY HELPERS
// ═══════════════════════════════════════════════════════════════

export function buildMarketKey(countryCode: string, region?: string, city?: string): string {
  const parts = [countryCode.toLowerCase()];
  if (region) parts.push(region.toLowerCase().replace(/\s+/g, "-"));
  if (city) parts.push(city.toLowerCase().replace(/\s+/g, "-"));
  return parts.join("-");
}
