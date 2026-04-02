// lib/data/directory-cards.ts — HAUL COMMAND Money OS Data Layer
// Wires the v_public_directory_cards Supabase view into the frontend.
//
// This replaces hardcoded COUNTRIES arrays and direct hc_global_operators queries
// with the canonical Money OS view that includes trust scores, claim status,
// and country tier data.

import { createClient } from '@/lib/supabase/server';

export type DirectoryCard = {
  id: string;
  display_name: string;
  entity_type: string;
  claim_status: string;
  hq_lat: number | null;
  hq_lng: number | null;
  country_code: string;
  country_name: string;
  country_tier: string;
  trust_score: number | null;
  completed_jobs_count: number | null;
  response_rate: number | null;
};

export type CountryDirectoryStats = {
  code: string;
  name: string;
  tier: string;
  entity_count: number;
  verified_count: number;
};

/**
 * Fetch directory cards from the Money OS v_public_directory_cards view.
 * Supports country filtering, pagination, and trust-score ordering.
 */
export async function getDirectoryCards(options?: {
  countryCode?: string;
  entityType?: string;
  limit?: number;
  offset?: number;
}): Promise<{ cards: DirectoryCard[]; total: number }> {
  const supabase = createClient();
  const limit = options?.limit || 24;
  const offset = options?.offset || 0;

  let query = supabase
    .from('v_public_directory_cards')
    .select('*', { count: 'estimated' })
    .order('trust_score', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (options?.countryCode) {
    query = query.eq('country_code', options.countryCode.toUpperCase());
  }
  if (options?.entityType) {
    query = query.eq('entity_type', options.entityType);
  }

  const { data, count, error } = await query;
  if (error) {
    console.error('[directory-cards] Query failed:', error.message);
    return { cards: [], total: 0 };
  }

  return { cards: (data as DirectoryCard[]) || [], total: count || 0 };
}

/**
 * Fetch country-level directory stats from the Money OS countries table.
 * Replaces hardcoded COUNTRIES array with live data.
 */
export async function getCountryDirectoryStats(): Promise<CountryDirectoryStats[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('countries')
    .select('code, name, tier')
    .not('tier', 'is', null)
    .order('name');

  if (error || !data) {
    console.error('[directory-cards] Country stats failed:', error?.message);
    return [];
  }

  // Get entity counts per country from market_entities
  const { data: entityCounts } = await supabase
    .from('market_entities')
    .select('country_id, claim_status');

  // Get country IDs
  const { data: countryIds } = await supabase
    .from('countries')
    .select('id, code');

  const countMap: Record<string, { total: number; verified: number }> = {};
  if (entityCounts && countryIds) {
    const idToCode: Record<string, string> = {};
    countryIds.forEach((c: any) => { idToCode[c.id] = c.code; });
    entityCounts.forEach((e: any) => {
      const code = idToCode[e.country_id];
      if (!code) return;
      if (!countMap[code]) countMap[code] = { total: 0, verified: 0 };
      countMap[code].total++;
      if (e.claim_status === 'verified') countMap[code].verified++;
    });
  }

  return data.map((c: any) => ({
    code: c.code,
    name: c.name,
    tier: c.tier,
    entity_count: countMap[c.code]?.total || 0,
    verified_count: countMap[c.code]?.verified || 0,
  }));
}

/**
 * Get directory stats summary — wired to Money OS tables.
 * Falls back to hc_global_operators for total count until migration is complete.
 */
export async function getDirectoryStatsSummary() {
  const supabase = createClient();

  const [totalRes, entityRes, countryRes] = await Promise.all([
    supabase.from('hc_global_operators').select('*', { count: 'estimated', head: true }),
    supabase.from('market_entities').select('*', { count: 'estimated', head: true }),
    supabase.from('countries').select('*', { count: 'exact', head: true }).not('tier', 'is', null),
  ]);

  return {
    totalOperators: totalRes.count || 0,
    totalEntities: entityRes.count || 0,
    totalCountries: countryRes.count || 0,
  };
}
