// lib/data/paywall-engine.ts — HAUL COMMAND Money OS Paywall Engine
// Wires the monetization_flags table into content access control.
//
// evaluatePaywall() checks whether a given entity/feature requires payment,
// and returns the paywall verdict along with pricing info for the UI.

import { supabaseAdmin } from '@/lib/supabase/admin';

export type PaywallFeature =
  | 'contact_reveal'
  | 'bulk_export'
  | 'route_survey_download'
  | 'api_access'
  | 'enterprise_dashboard'
  | 'priority_dispatch'
  | 'corridor_intelligence'
  | 'competitor_analysis'
  | 'ad_placement'
  | 'claim_activation';

export type PaywallVerdict = {
  allowed: boolean;
  reason: 'free' | 'trial' | 'subscribed' | 'paywall_blocked' | 'country_gated';
  feature: PaywallFeature;
  upgrade_url?: string;
  price_hint?: string;
  trial_remaining_days?: number;
};

/**
 * Evaluate whether a user can access a paywalled feature.
 * Checks monetization_flags table for feature-level overrides,
 * then falls back to the user's subscription tier.
 *
 * @param userId - Auth user ID (null for anonymous)
 * @param feature - Feature to evaluate
 * @param countryCode - Optional country context for country-gated features
 */
export async function evaluatePaywall(
  userId: string | null,
  feature: PaywallFeature,
  countryCode?: string
): Promise<PaywallVerdict> {
  // 1. Check monetization_flags for feature-level rules
  const { data: flag } = await supabaseAdmin
    .from('monetization_flags')
    .select('*')
    .eq('feature_key', feature)
    .maybeSingle();

  // If feature isn't flagged at all, it's free
  if (!flag) {
    return { allowed: true, reason: 'free', feature };
  }

  // 2. Check if the flag is active
  if (!flag.is_active) {
    return { allowed: true, reason: 'free', feature };
  }

  // 3. Anonymous users: always blocked on paywalled features
  if (!userId) {
    return {
      allowed: false,
      reason: 'paywall_blocked',
      feature,
      upgrade_url: '/auth/register',
      price_hint: flag.price_hint || undefined,
    };
  }

  // 4. Check user subscription status
  const { data: sub } = await supabaseAdmin
    .from('user_subscriptions')
    .select('plan_id, status, current_period_end')
    .eq('user_id', userId)
    .maybeSingle();

  // Active subscriber with qualifying plan
  if (sub && sub.status === 'active') {
    const qualifyingPlans = flag.qualifying_plans || ['pro', 'enterprise', 'premium'];
    if (qualifyingPlans.includes(sub.plan_id)) {
      return { allowed: true, reason: 'subscribed', feature };
    }
  }

  // 5. Check trial status
  if (sub && sub.status === 'trialing') {
    const periodEnd = new Date(sub.current_period_end);
    const now = new Date();
    const daysLeft = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / 86400000));
    
    if (daysLeft > 0) {
      return { allowed: true, reason: 'trial', feature, trial_remaining_days: daysLeft };
    }
  }

  // 6. Country-gated check
  if (countryCode && flag.country_gates) {
    const gates = flag.country_gates as string[];
    if (gates.length > 0 && !gates.includes(countryCode.toUpperCase())) {
      return {
        allowed: false,
        reason: 'country_gated',
        feature,
        price_hint: `Not available in ${countryCode}`,
      };
    }
  }

  // 7. Default: blocked
  return {
    allowed: false,
    reason: 'paywall_blocked',
    feature,
    upgrade_url: '/pricing',
    price_hint: flag.price_hint || undefined,
  };
}

/**
 * Batch evaluate multiple features for a user.
 * Useful for rendering a dashboard with mixed free/paid elements.
 */
export async function evaluatePaywallBatch(
  userId: string | null,
  features: PaywallFeature[],
  countryCode?: string
): Promise<Record<PaywallFeature, PaywallVerdict>> {
  const results: Record<string, PaywallVerdict> = {};
  
  // Single query for all flags
  const { data: flags } = await supabaseAdmin
    .from('monetization_flags')
    .select('*')
    .in('feature_key', features);

  const flagMap = new Map((flags || []).map((f: any) => [f.feature_key, f]));

  // Single query for user subscription
  let sub: any = null;
  if (userId) {
    const { data } = await supabaseAdmin
      .from('user_subscriptions')
      .select('plan_id, status, current_period_end')
      .eq('user_id', userId)
      .maybeSingle();
    sub = data;
  }

  for (const feature of features) {
    const flag = flagMap.get(feature);
    
    if (!flag || !flag.is_active) {
      results[feature] = { allowed: true, reason: 'free', feature };
      continue;
    }

    if (!userId) {
      results[feature] = { allowed: false, reason: 'paywall_blocked', feature, upgrade_url: '/auth/register' };
      continue;
    }

    if (sub?.status === 'active') {
      const qualifying = flag.qualifying_plans || ['pro', 'enterprise', 'premium'];
      if (qualifying.includes(sub.plan_id)) {
        results[feature] = { allowed: true, reason: 'subscribed', feature };
        continue;
      }
    }

    results[feature] = { allowed: false, reason: 'paywall_blocked', feature, upgrade_url: '/pricing', price_hint: flag.price_hint };
  }

  return results as Record<PaywallFeature, PaywallVerdict>;
}
