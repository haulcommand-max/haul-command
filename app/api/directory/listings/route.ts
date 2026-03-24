/**
 * GET /api/directory/listings
 *
 * FIXED: Now queries `listings` table (the single source of truth).
 * Previous bug: queried `directory_listings` which had a different schema
 * and only ~60 rows from imported data.
 *
 * Supports full pagination, infinite scroll, state/country/search filters.
 * Max limit raised from 50 to 100 for faster page loads.
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
  const claimedOnly = sp.get('claimed') === 'true';
  const ratedOnly = sp.get('rated') === 'true';
  const sortBy = sp.get('sort') ?? 'rank'; // rank | rating | reviews | name

  // --- Count query ---
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

  // --- Main query ---
  let query = supabase
    .from('listings')
    .select('id, full_name, city, state, country_code, rating, review_count, claimed, services, rank_score, featured, profile_completeness, slug, claim_status')
    .eq('active', true);

  if (state) query = query.eq('state', state);
  if (country && country !== 'us') query = query.eq('country_code', country);
  if (q) query = query.or(`full_name.ilike.%${q}%,city.ilike.%${q}%,bio.ilike.%${q}%`);
  if (claimedOnly) query = query.eq('claimed', true);
  if (ratedOnly) query = query.not('rating', 'is', null);

  // Sort
  if (sortBy === 'rating') {
    query = query.order('rating', { ascending: false, nullsFirst: false });
  } else if (sortBy === 'reviews') {
    query = query.order('review_count', { ascending: false, nullsFirst: false });
  } else if (sortBy === 'name') {
    query = query.order('full_name', { ascending: true });
  } else {
    // Default: rank (featured first, then rank_score)
    query = query
      .order('featured', { ascending: false, nullsFirst: false })
      .order('rank_score', { ascending: false, nullsFirst: false })
      .order('claimed', { ascending: false, nullsFirst: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ listings: [], total: 0, error: error.message }, { status: 500 });
  }

  // Transform + mark sponsored
  const listings = (data ?? []).map(row => ({
    id: row.id,
    slug: row.slug,
    name: row.full_name,
    city: row.city,
    state: row.state,
    country_code: row.country_code ?? 'us',
    rating: row.rating,
    review_count: row.review_count ?? 0,
    is_claimed: row.claimed,
    claim_status: row.claim_status ?? (row.claimed ? 'claimed' : 'unclaimed'),
    services: row.services ?? [],
    rank_score: row.rank_score ?? 0,
    profile_completeness: row.profile_completeness ?? 0,
    is_sponsored: boostedIds.has(row.id),
    is_featured: row.featured ?? false,
  }));

  // Sponsored always first
  listings.sort((a, b) => {
    if (b.is_sponsored !== a.is_sponsored) return Number(b.is_sponsored) - Number(a.is_sponsored);
    if (b.is_featured !== a.is_featured) return Number(b.is_featured) - Number(a.is_featured);
    return (b.rank_score ?? 0) - (a.rank_score ?? 0);
  });

  const totalPages = Math.ceil((total ?? 0) / limit);

  return NextResponse.json({
    listings,
    total: total ?? 0,
    page,
    limit,
    total_pages: totalPages,
    has_more: page < totalPages,
    filters: { state, country, q, sortBy },
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
  });
}
