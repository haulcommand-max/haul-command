/**
 * GET /api/directory/listings
 *
 * Unified directory API: queries BOTH the `listings` table (legacy operators)
 * AND `hc_places` (23,281+ claimable service businesses).
 * Merges results into a single paginated response.
 *
 * Supports full pagination, infinite scroll, state/country/search/category filters.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const sp = req.nextUrl.searchParams;

  // Pagination
  const limit = Math.min(parseInt(sp.get('limit') ?? '48'), 100);
  const page = Math.max(parseInt(sp.get('page') ?? '1'), 1);
  const offset = (page - 1) * limit;

  // Filters
  const state = (sp.get('state') ?? sp.get('region'))?.toUpperCase();
  const country = sp.get('country')?.toLowerCase();
  const q = sp.get('q')?.trim();
  const category = sp.get('category')?.trim(); // NEW: filter by surface_category_key
  const claimedOnly = sp.get('claimed') === 'true';
  const ratedOnly = sp.get('rated') === 'true';
  const source = sp.get('source'); // 'listings', 'hc_places', or null (both)
  const sortBy = sp.get('sort') ?? 'rank'; // rank | rating | reviews | name

  // --- Boosted IDs ---
  let boostedIds = new Set<string>();
  try {
    const { data: boosts } = await supabase
      .from('ad_boosts')
      .select('profile_id')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());
    (boosts ?? []).forEach(b => boostedIds.add(b.profile_id));
  } catch { /* ad_boosts may not exist yet, non-fatal */ }

  // ══════════════════════════════════════════════════
  // QUERY 1: hc_places (23,281+ claimable businesses)
  // ══════════════════════════════════════════════════
  let hcPlacesListings: any[] = [];
  let hcTotal = 0;

  if (source !== 'listings') {
    // Count
    let hcCountQ = supabase
      .from('hc_places')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('is_search_indexable', true);

    if (state) hcCountQ = hcCountQ.eq('admin1_code', state);
    if (country) hcCountQ = hcCountQ.eq('country_code', country.toUpperCase());
    if (category) hcCountQ = hcCountQ.eq('surface_category_key', category);
    if (q) hcCountQ = hcCountQ.or(`name.ilike.%${q}%,locality.ilike.%${q}%,description.ilike.%${q}%`);
    if (claimedOnly) hcCountQ = hcCountQ.eq('claim_status', 'claimed');

    const { count: hcCount } = await hcCountQ;
    hcTotal = hcCount ?? 0;

    // Data
    let hcQuery = supabase
      .from('hc_places')
      .select('id, name, locality, admin1_code, country_code, surface_category_key, slug, claim_status, description, phone, website, demand_score, seo_score')
      .eq('status', 'published')
      .eq('is_search_indexable', true);

    if (state) hcQuery = hcQuery.eq('admin1_code', state);
    if (country) hcQuery = hcQuery.eq('country_code', country.toUpperCase());
    if (category) hcQuery = hcQuery.eq('surface_category_key', category);
    if (q) hcQuery = hcQuery.or(`name.ilike.%${q}%,locality.ilike.%${q}%,description.ilike.%${q}%`);
    if (claimedOnly) hcQuery = hcQuery.eq('claim_status', 'claimed');

    // Sort
    if (sortBy === 'name') {
      hcQuery = hcQuery.order('name', { ascending: true });
    } else {
      hcQuery = hcQuery
        .order('demand_score', { ascending: false, nullsFirst: false })
        .order('seo_score', { ascending: false, nullsFirst: false });
    }

    hcQuery = hcQuery.range(offset, offset + limit - 1);

    const { data: hcData } = await hcQuery;

    // Map hc_places → listings shape
    hcPlacesListings = (hcData ?? []).map(row => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      city: row.locality,
      state: row.admin1_code,
      region_code: row.admin1_code,
      country_code: row.country_code?.toLowerCase() ?? 'us',
      rating: null,
      review_count: 0,
      is_claimed: row.claim_status === 'claimed',
      claim_status: row.claim_status ?? 'unclaimed',
      services: [row.surface_category_key].filter(Boolean),
      rank_score: (row.demand_score ?? 0) + (row.seo_score ?? 0),
      profile_completeness: row.phone ? 0.5 : 0.2,
      completeness: row.phone ? 0.5 : 0.2,
      is_sponsored: boostedIds.has(row.id),
      is_featured: false,
      source: 'hc_places',
      category: row.surface_category_key,
      description: row.description,
    }));
  }

  // ══════════════════════════════════════════════════
  // QUERY 2: Legacy listings table (operators)
  // ══════════════════════════════════════════════════
  let legacyListings: any[] = [];
  let legacyTotal = 0;

  if (source !== 'hc_places') {
    let countQ = supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    if (state) countQ = countQ.eq('state', state);
    if (country && country !== 'us') countQ = countQ.eq('country_code', country);
    if (q) countQ = countQ.or(`full_name.ilike.%${q}%,city.ilike.%${q}%,bio.ilike.%${q}%`);
    if (claimedOnly) countQ = countQ.eq('claimed', true);
    if (ratedOnly) countQ = countQ.not('rating', 'is', null);

    const { count: total } = await countQ;
    legacyTotal = total ?? 0;

    let query = supabase
      .from('listings')
      .select('id, full_name, city, state, country_code, rating, review_count, claimed, services, rank_score, featured, profile_completeness, slug, claim_status')
      .eq('active', true);

    if (state) query = query.eq('state', state);
    if (country && country !== 'us') query = query.eq('country_code', country);
    if (q) query = query.or(`full_name.ilike.%${q}%,city.ilike.%${q}%,bio.ilike.%${q}%`);
    if (claimedOnly) query = query.eq('claimed', true);
    if (ratedOnly) query = query.not('rating', 'is', null);

    if (sortBy === 'rating') {
      query = query.order('rating', { ascending: false, nullsFirst: false });
    } else if (sortBy === 'reviews') {
      query = query.order('review_count', { ascending: false, nullsFirst: false });
    } else if (sortBy === 'name') {
      query = query.order('full_name', { ascending: true });
    } else {
      query = query
        .order('featured', { ascending: false, nullsFirst: false })
        .order('rank_score', { ascending: false, nullsFirst: false })
        .order('claimed', { ascending: false, nullsFirst: false });
    }

    query = query.range(offset, offset + limit - 1);
    const { data } = await query;

    legacyListings = (data ?? []).map(row => ({
      id: row.id,
      slug: row.slug,
      name: row.full_name,
      city: row.city,
      state: row.state,
      region_code: row.state,
      country_code: row.country_code ?? 'us',
      rating: row.rating,
      review_count: row.review_count ?? 0,
      is_claimed: row.claimed,
      claim_status: row.claim_status ?? (row.claimed ? 'claimed' : 'unclaimed'),
      services: row.services ?? [],
      rank_score: row.rank_score ?? 0,
      profile_completeness: row.profile_completeness ?? 0,
      completeness: row.profile_completeness ?? 0,
      is_sponsored: boostedIds.has(row.id),
      is_featured: row.featured ?? false,
      source: 'listings',
    }));
  }

  // ══════════════════════════════════════════════════
  // MERGE: Combine both sources, sort, paginate
  // ══════════════════════════════════════════════════
  const allListings = [...legacyListings, ...hcPlacesListings];

  // Sort merged results
  allListings.sort((a, b) => {
    if (b.is_sponsored !== a.is_sponsored) return Number(b.is_sponsored) - Number(a.is_sponsored);
    if (b.is_featured !== a.is_featured) return Number(b.is_featured) - Number(a.is_featured);
    // Claimed listings rank higher
    if (b.is_claimed !== a.is_claimed) return Number(b.is_claimed) - Number(a.is_claimed);
    return (b.rank_score ?? 0) - (a.rank_score ?? 0);
  });

  // Take only the limit
  const listings = allListings.slice(0, limit);
  const combinedTotal = legacyTotal + hcTotal;
  const totalPages = Math.ceil(combinedTotal / limit);

  return NextResponse.json({
    listings,
    total: combinedTotal,
    page,
    limit,
    total_pages: totalPages,
    has_more: page < totalPages,
    filters: { state, country, q, category, sortBy },
    sources: { listings: legacyTotal, hc_places: hcTotal },
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
  });
}
