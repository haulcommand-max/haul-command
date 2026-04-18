/**
 * lib/swarm/revenue-attribution.ts
 * Revenue Attribution — tracks and attributes revenue to autonomous agents.
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function attributeClaimRevenue(
  agentName: string,
  marketKey: string,
  country: string,
  entityId: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from('agent_revenue_events').insert({
    agent_name: agentName,
    event_type: 'claim_completed',
    market_key: marketKey,
    country,
    entity_id: entityId,
    amount_usd: 0, // actual value determined by subscription tier
    recorded_at: new Date().toISOString(),
  });
}

export async function attributeDataSaleRevenue(
  agentName: string,
  productId: string,
  amountUsd: number,
  country: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from('agent_revenue_events').insert({
    agent_name: agentName,
    event_type: 'data_sale',
    market_key: productId,
    country,
    amount_usd: amountUsd,
    recorded_at: new Date().toISOString(),
  });
}

export async function trackAgentRevenue(params: {
  agent_name: string;
  event_type: string;
  amount_usd: number;
  country: string;
  entity_id?: string;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from('agent_revenue_events').insert({
    ...params,
    recorded_at: new Date().toISOString(),
  });
}
