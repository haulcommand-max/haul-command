// ══════════════════════════════════════════════════════════════
// PAYWALL GATE — wires evaluatePaywall() to monetization_flags
//
// The monetization-engine.ts has evaluatePaywall() with hardcoded
// thresholds. This module reads monetization_flags from Supabase
// and merges DB-driven eligibility with local decision logic.
//
// Result: The paywall checks what the entity is ELIGIBLE for
// (DB), then decides whether to SHOW the wall (logic).
// ══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { evaluatePaywall, type PaywallDecision } from './monetization-engine';

// ── DB types ──

export interface MonetizationFlags {
  id: string;
  entity_id: string;
  country_id: string | null;
  country_role_id: string | null;
  can_receive_jobs: boolean;
  can_pay_take_rate: boolean;
  lead_unlockable: boolean;
  subscription_eligible: boolean;
  featured_listing_eligible: boolean;
  territory_sponsor_eligible: boolean;
  corridor_sponsor_eligible: boolean;
  training_eligible: boolean;
  insurance_referral_eligible: boolean;
  financing_referral_eligible: boolean;
  equipment_marketplace_eligible: boolean;
  rush_fee_eligible: boolean;
  standby_margin_eligible: boolean;
  data_sale_eligible: boolean;
  api_exposure_eligible: boolean;
  revenue_priority_score: number;
  lifecycle_stage: string;
}

export interface PaywallContext {
  entity_id: string;
  user_type: 'escort' | 'broker' | 'carrier';
  current_tier: 'free' | 'pro' | 'business' | 'elite' | 'enterprise';
  usage: {
    searches: number;
    leads: number;
    routes: number;
    daysActive: number;
  };
  country_code?: string;
}

export interface EnrichedPaywallDecision extends PaywallDecision {
  // DB-enriched fields
  entity_eligible: boolean;
  lifecycle_stage: string;
  revenue_priority: number;
  eligible_surfaces: string[];
  // Override controls
  force_blocked: boolean;
  force_reason: string | null;
}

// ══════════════════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════════════════

/**
 * evaluatePaywallWithFlags — The production paywall evaluator.
 *
 * 1. Fetches monetization_flags from DB for the entity
 * 2. Runs the local evaluatePaywall() logic
 * 3. Merges: DB eligibility gates override local decisions
 */
export async function evaluatePaywallWithFlags(
  ctx: PaywallContext
): Promise<EnrichedPaywallDecision> {
  // Step 1: Get entity flags from DB
  const flags = await fetchMonetizationFlags(ctx.entity_id);

  // Step 2: Run local logic
  const localDecision = evaluatePaywall(
    ctx.user_type,
    ctx.current_tier,
    ctx.usage
  );

  // Step 3: Build eligible surfaces list
  const eligible_surfaces = buildEligibleSurfaces(flags);

  // Step 4: Check if DB blocks the paywall
  const force_blocked = flags !== null && !flags.subscription_eligible;
  const force_reason = force_blocked
    ? `Entity ${ctx.entity_id} is not subscription_eligible (lifecycle: ${flags?.lifecycle_stage})`
    : null;

  // Step 5: Merge
  return {
    ...localDecision,
    // If DB says not eligible, don't show paywall
    show: force_blocked ? false : localDecision.show,
    entity_eligible: flags?.subscription_eligible ?? true,
    lifecycle_stage: flags?.lifecycle_stage ?? 'unknown',
    revenue_priority: flags?.revenue_priority_score ?? 0,
    eligible_surfaces,
    force_blocked,
    force_reason,
  };
}

/**
 * fetchMonetizationFlags — Read flags for a specific entity.
 */
export async function fetchMonetizationFlags(
  entity_id: string
): Promise<MonetizationFlags | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('monetization_flags')
    .select('*')
    .eq('entity_id', entity_id)
    .order('revenue_priority_score', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = not found (expected for new entities)
    console.error('[paywall] Failed to fetch flags:', error.message);
  }

  return (data as MonetizationFlags) || null;
}

/**
 * upsertMonetizationFlags — Create or update flags for an entity.
 * Used by admin tools and lifecycle automation.
 */
export async function upsertMonetizationFlags(
  entity_id: string,
  updates: Partial<Omit<MonetizationFlags, 'id' | 'entity_id'>>
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('monetization_flags')
    .upsert(
      {
        entity_id,
        ...updates,
      },
      { onConflict: 'entity_id,country_id,country_role_id' }
    );

  if (error) {
    console.error('[paywall] Failed to upsert flags:', error.message);
    return false;
  }
  return true;
}

/**
 * evaluatePagePaywall — Simplified call for middleware/page-level checks.
 * Reads entity from session, returns show/don't-show.
 */
export async function evaluatePagePaywall(params: {
  entity_id: string;
  page_type: string;
  user_type: 'escort' | 'broker' | 'carrier';
  current_tier: 'free' | 'pro' | 'business' | 'elite' | 'enterprise';
}): Promise<{ show_paywall: boolean; reason: string; suggested_tier: string }> {
  const flags = await fetchMonetizationFlags(params.entity_id);

  // If entity has no flags yet (new user), use conservative defaults
  if (!flags) {
    return { show_paywall: false, reason: 'no_flags_found', suggested_tier: '' };
  }

  // Check lifecycle stage — only show paywall to activated/sell/dispatch stage entities
  const paywallStages = ['activate', 'sell', 'dispatch', 'retain', 'expand'];
  if (!paywallStages.includes(flags.lifecycle_stage)) {
    return { show_paywall: false, reason: 'lifecycle_not_ready', suggested_tier: '' };
  }

  // Check subscription eligibility
  if (!flags.subscription_eligible) {
    return { show_paywall: false, reason: 'not_subscription_eligible', suggested_tier: '' };
  }

  // Determine suggested tier based on user type and priority
  let suggested_tier = 'Pro';
  if (params.user_type === 'broker') suggested_tier = 'Business';
  if (flags.revenue_priority_score >= 80) suggested_tier = 'Elite';
  if (flags.api_exposure_eligible) suggested_tier = 'Enterprise';

  return {
    show_paywall: true,
    reason: `ready_lifecycle_${flags.lifecycle_stage}_priority_${flags.revenue_priority_score}`,
    suggested_tier,
  };
}

// ── Helpers ──

function buildEligibleSurfaces(flags: MonetizationFlags | null): string[] {
  if (!flags) return [];
  const surfaces: string[] = [];
  if (flags.subscription_eligible) surfaces.push('subscription');
  if (flags.featured_listing_eligible) surfaces.push('featured_listing');
  if (flags.territory_sponsor_eligible) surfaces.push('territory_sponsor');
  if (flags.corridor_sponsor_eligible) surfaces.push('corridor_sponsor');
  if (flags.training_eligible) surfaces.push('training');
  if (flags.insurance_referral_eligible) surfaces.push('insurance_referral');
  if (flags.financing_referral_eligible) surfaces.push('financing_referral');
  if (flags.equipment_marketplace_eligible) surfaces.push('equipment_marketplace');
  if (flags.rush_fee_eligible) surfaces.push('rush_fee');
  if (flags.standby_margin_eligible) surfaces.push('standby_margin');
  if (flags.data_sale_eligible) surfaces.push('data_sale');
  if (flags.api_exposure_eligible) surfaces.push('api_exposure');
  if (flags.lead_unlockable) surfaces.push('lead_unlock');
  return surfaces;
}
