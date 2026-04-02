// ══════════════════════════════════════════════════════════════
// DIRECTORY CARDS SERVICE — wired to v_public_directory_cards
//
// Replaces the raw hc_global_operators query with the purpose-built
// production view that joins market_entities + countries +
// provider_performance_rollups with proper RLS.
// ══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';

export interface DirectoryCard {
  id: string;
  display_name: string;
  entity_type: string;
  claim_status: 'claimed' | 'verified' | 'unclaimed';
  hq_lat: number | null;
  hq_lng: number | null;
  country_code: string | null;
  country_name: string | null;
  country_tier: string | null;
  trust_score: number | null;
  completed_jobs_count: number | null;
  response_rate: number | null;
}

export interface DirectoryFilters {
  country_code?: string;
  entity_type?: string;
  min_trust_score?: number;
  claimed_only?: boolean;
  search_query?: string;
  limit?: number;
  offset?: number;
}

export interface DirectoryStats {
  total: number;
  verified_count: number;
  claimed_count: number;
  country_counts: Record<string, number>;
}

/**
 * fetchDirectoryCards — Primary read path for directory pages.
 * Reads from v_public_directory_cards (the production view).
 */
export async function fetchDirectoryCards(
  filters: DirectoryFilters = {}
): Promise<{ cards: DirectoryCard[]; total: number }> {
  const supabase = createClient();
  const limit = filters.limit ?? 24;
  const offset = filters.offset ?? 0;

  let query = supabase
    .from('v_public_directory_cards')
    .select('*', { count: 'estimated' });

  if (filters.country_code) {
    query = query.eq('country_code', filters.country_code.toUpperCase());
  }
  if (filters.entity_type) {
    query = query.eq('entity_type', filters.entity_type);
  }
  if (filters.min_trust_score) {
    query = query.gte('trust_score', filters.min_trust_score);
  }
  if (filters.claimed_only) {
    query = query.eq('claim_status', 'claimed');
  }
  if (filters.search_query) {
    query = query.ilike('display_name', `%${filters.search_query}%`);
  }

  query = query
    .order('trust_score', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('[directory-cards] Query error:', error.message);
    return { cards: [], total: 0 };
  }

  return {
    cards: (data ?? []) as DirectoryCard[],
    total: count ?? 0,
  };
}

/**
 * fetchTopDirectoryCards — Fetch highest-trust cards for homepage/hero.
 */
export async function fetchTopDirectoryCards(
  limit: number = 12
): Promise<DirectoryCard[]> {
  const { cards } = await fetchDirectoryCards({ limit, claimed_only: false });
  return cards;
}

/**
 * fetchDirectoryStats — Aggregate counts for hero metrics.
 * Falls back to hc_global_operators if the view has no data yet.
 */
export async function fetchDirectoryStats(): Promise<DirectoryStats> {
  const supabase = createClient();

  // Try production view first
  const [totalRes, verifiedRes, claimedRes] = await Promise.all([
    supabase.from('v_public_directory_cards').select('*', { count: 'estimated', head: true }),
    supabase.from('v_public_directory_cards').select('*', { count: 'estimated', head: true }).eq('claim_status', 'verified'),
    supabase.from('v_public_directory_cards').select('*', { count: 'estimated', head: true }).eq('claim_status', 'claimed'),
  ]);

  const total = totalRes.count ?? 0;

  // If view has data, use it
  if (total > 0) {
    // Get per-country counts
    const { data: countryData } = await supabase
      .from('v_public_directory_cards')
      .select('country_code');

    const country_counts: Record<string, number> = {};
    if (countryData) {
      for (const row of countryData) {
        const cc = (row.country_code || 'unknown').toLowerCase();
        country_counts[cc] = (country_counts[cc] || 0) + 1;
      }
    }

    return {
      total,
      verified_count: verifiedRes.count ?? 0,
      claimed_count: claimedRes.count ?? 0,
      country_counts,
    };
  }

  // Fallback: use hc_global_operators (legacy path)
  const fallback = await supabase
    .from('hc_global_operators')
    .select('*', { count: 'estimated', head: true });

  return {
    total: fallback.count ?? 0,
    verified_count: 0,
    claimed_count: 0,
    country_counts: { us: fallback.count ?? 0 },
  };
}

/**
 * fetchDirectoryCardsByState — US state-specific directory query.
 */
export async function fetchDirectoryCardsByState(
  stateCode: string,
  limit: number = 24
): Promise<{ cards: DirectoryCard[]; total: number }> {
  const supabase = createClient();

  // State-level queries still use hc_global_operators (has admin1_code)
  // until v_public_directory_cards gains region columns
  const { data, count, error } = await supabase
    .from('hc_global_operators')
    .select('id, name, city, admin1_code, country_code, is_claimed, role_primary, confidence_score', { count: 'estimated' })
    .eq('admin1_code', stateCode.toUpperCase())
    .order('confidence_score', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error('[directory-cards] State query error:', error.message);
    return { cards: [], total: 0 };
  }

  // Map legacy format to DirectoryCard
  const cards: DirectoryCard[] = (data ?? []).map((op: any) => ({
    id: op.id,
    display_name: op.name || 'Escort Operator',
    entity_type: op.role_primary || 'pilot_car',
    claim_status: op.is_claimed ? 'claimed' : ('unclaimed' as const),
    hq_lat: null,
    hq_lng: null,
    country_code: op.country_code?.toUpperCase() || 'US',
    country_name: 'United States',
    country_tier: 'A',
    trust_score: op.confidence_score ? op.confidence_score / 20 : null,
    completed_jobs_count: null,
    response_rate: null,
  }));

  return { cards, total: count ?? 0 };
}
