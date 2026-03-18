import { supabaseServer } from '@/lib/supabase-server';

/**
 * Directory loader — must read:
 *   - hc_provider_search_index (ranked browse results)
 *   - hc_page_seo_contracts (SEO metadata)
 */

export async function getDirectoryStats() {
  const sb = supabaseServer();
  const { count } = await sb.from('hc_places').select('id', { count: 'exact', head: true }).eq('status', 'published');
  return { totalPlaces: count ?? 0 };
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
    .from('hc_provider_search_index')
    .select('provider_id, provider_slug, title, subtitle, location_label, badges_json, organic_rank_score, quality_guardrail_pass')
    .eq('quality_guardrail_pass', true);

  if (filters.countrySlug) q = q.eq('country_slug', filters.countrySlug);
  if (filters.jurisdictionSlug) q = q.eq('jurisdiction_slug', filters.jurisdictionSlug);
  if (filters.metroSlug) q = q.eq('metro_slug', filters.metroSlug);
  if (filters.serviceSlug) q = q.eq('service_slug', filters.serviceSlug);

  const { data } = await q
    .order('organic_rank_score', { ascending: false })
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
