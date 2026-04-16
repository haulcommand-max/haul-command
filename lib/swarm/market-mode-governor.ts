/**
 * lib/swarm/market-mode-governor.ts
 * Market Mode Governor — reads and evaluates market expansion states from Supabase.
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin';

export type MarketMode = 'seeding' | 'growing' | 'live' | 'saturated';

export interface MarketState {
  market_key: string;
  mode: MarketMode;
  supply_count: number;
  demand_signals_30d: number;
  fill_rate_30d: number;
  last_evaluated: string;
}

export const MODE_POLICIES: Record<MarketMode, Record<string, unknown>> = {
  seeding: {
    ads_enabled: false,
    claim_pressure_active: true,
    outreach_multiplier: 1.5,
    description: 'Market is new — focus on supply acquisition.',
  },
  growing: {
    ads_enabled: true,
    claim_pressure_active: true,
    outreach_multiplier: 1.2,
    description: 'Market is growing — ads enabled at low spend.',
  },
  live: {
    ads_enabled: true,
    claim_pressure_active: true,
    outreach_multiplier: 1.0,
    description: 'Market is live — full monetization.',
  },
  saturated: {
    ads_enabled: true,
    claim_pressure_active: false,
    outreach_multiplier: 0.5,
    description: 'Market is saturated — reduce outreach costs.',
  },
};

export async function getMarketState(marketKey: string): Promise<MarketState | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('market_mode_states')
    .select('*')
    .eq('market_key', marketKey)
    .maybeSingle();
  return data ?? null;
}

export async function getMarketPolicy(marketKey: string): Promise<Record<string, unknown>> {
  const state = await getMarketState(marketKey);
  return MODE_POLICIES[state?.mode ?? 'seeding'];
}

export async function batchEvaluateMarketModes(): Promise<{ evaluated: number }> {
  const supabase = getSupabaseAdmin();
  const { count } = await supabase
    .from('market_mode_states')
    .select('*', { count: 'exact', head: true });
  return { evaluated: count ?? 0 };
}
