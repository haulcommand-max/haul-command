import { getCanonicalStats } from '@/lib/hc-loaders/stats';
import { supabaseServer } from '@/lib/supabase-server';

/**
 * Directory loader — stats now come from get_canonical_stats() RPC only.
 * directory_listings is quarantined (654K synthetic rows). Do NOT count it.
 */

export async function getDirectoryStats() {
  const stats = await getCanonicalStats();
  return { totalPlaces: stats.total_real_operators };
}

export async function getDirectoryByCountry() {
  const sb = supabaseServer();
  const { data } = await sb.rpc('hc_places_by_country');
  return data ?? [];
}

export async function getDirectorySearchResults(filters: {
  countrySlug?: string;
  jurisdictionSlug?: string;
  metroSlug?: string;
  serviceSlug?: string;
  limit?: number;
}) {
  const sb = supabaseServer();
  let q = sb
    .from('hc_public_operators')
    .select('id, slug, display_name, entity_type, phone, email, city, state_code, country_code, trust_classification, claim_status');

  if (filters.countrySlug) q = q.eq('country_code', filters.countrySlug.toUpperCase());
  if (filters.metroSlug) q = q.ilike('city', `%${filters.metroSlug}%`);

  const { data } = await q
    .order('trust_score', { ascending: false, nullsFirst: false })
    .limit(filters.limit ?? 50);

  return data ?? [];
}

export async function getDirectorySeoContract(canonicalUrl: string) {
  const sb = supabaseServer();
  const { data } = await sb
    .from('hc_page_seo_contracts')
    .select('title, meta_description, h1, intro_copy, breadcrumb_json')
    .eq('canonical_url', canonicalUrl)
    .single();
  return data;
}
