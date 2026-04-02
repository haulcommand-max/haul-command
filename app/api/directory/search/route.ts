import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/directory/search
 *
 * Unified search across BOTH:
 *   1. hc_global_operators (legacy operators)
 *   2. hc_places (23,281+ claimable service businesses)
 *
 * Full-text + column search with pagination.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(req.url);

    // Filter params
    const q = searchParams.get('q') || '';
    const country = searchParams.get('country') || '';
    const state = searchParams.get('state') || '';
    const category = searchParams.get('category') || '';
    const claimedOnly = searchParams.get('claimed') === 'true';
    
    // Pagination params
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '48'), 100);
    const startRange = (page - 1) * limit;
    const endRange = startRange + limit - 1;
    const sortBy = searchParams.get('sort') ?? 'rank';

    // Auth check for censorship
    const authHeader = req.headers.get('authorization');
    const isAuthenticated = !!authHeader;
    const isCensored = !isAuthenticated;

    // ═════════════════════════════════════════
    // QUERY 1: hc_places (23,281+ businesses)
    // ═════════════════════════════════════════
    let hcQuery = supabase
      .from('hc_places')
      .select(
        'id, name, locality, admin1_code, country_code, phone, surface_category_key, slug, claim_status, demand_score',
        { count: 'exact' }
      )
      .eq('status', 'published')
      .eq('is_search_indexable', true);

    if (q) {
      hcQuery = hcQuery.or(
        `name.ilike.%${q}%,locality.ilike.%${q}%,admin1_code.ilike.%${q}%,description.ilike.%${q}%`
      );
    }
    if (country) hcQuery = hcQuery.eq('country_code', country.toUpperCase());
    if (state) hcQuery = hcQuery.eq('admin1_code', state.toUpperCase());
    if (category) hcQuery = hcQuery.eq('surface_category_key', category);
    if (claimedOnly) hcQuery = hcQuery.eq('claim_status', 'claimed');

    if (sortBy === 'name') {
      hcQuery = hcQuery.order('name', { ascending: true });
    } else {
      hcQuery = hcQuery.order('demand_score', { ascending: false, nullsFirst: false });
    }

    hcQuery = hcQuery.range(startRange, endRange);

    const { data: hcData, count: hcCount } = await hcQuery;

    // Map hc_places → unified shape
    const hcResults = (hcData || []).map((row: any, index: number) => ({
      id: row.id,
      slug: row.slug,
      name: row.name || 'Service Business',
      city: row.locality,
      state: row.admin1_code,
      location: `${row.locality}, ${row.admin1_code}`,
      region_code: row.admin1_code,
      country_code: row.country_code,
      services: [row.surface_category_key].filter(Boolean),
      category: row.surface_category_key,
      is_claimed: row.claim_status === 'claimed',
      rating: null,
      review_count: 0,
      rank_score: row.demand_score ?? 0,
      score: row.demand_score ?? 50,
      is_featured: false,
      profile_completeness: row.phone ? 50 : 20,
      phone: (isCensored && index >= 2) ? '(XXX) XXX-XXXX' : (row.phone || ''),
      source: 'hc_places',
    }));

    // ═════════════════════════════════════════
    // QUERY 2: hc_global_operators (legacy)
    // ═════════════════════════════════════════
    let opQuery = supabase
      .from('hc_global_operators')
      .select(
        'id, name, city, admin1_code, country_code, phone_normalized, is_claimed, role_primary, confidence_score, slug',
        { count: 'exact' }
      )
      .not('admin1_code', 'is', null)
      .not('city', 'is', null);

    if (q) {
      opQuery = opQuery.or(
        `name.ilike.%${q}%,city.ilike.%${q}%,admin1_code.ilike.%${q}%`
      );
    }
    if (country) opQuery = opQuery.eq('country_code', country.toUpperCase());
    if (state) opQuery = opQuery.eq('admin1_code', state.toUpperCase());
    if (claimedOnly) opQuery = opQuery.eq('is_claimed', true);

    if (sortBy === 'name') {
      opQuery = opQuery.order('name', { ascending: true });
    } else {
      opQuery = opQuery.order('confidence_score', { ascending: false, nullsFirst: false });
    }

    // Only fetch legacy if no category filter (legacy doesn't have categories)
    let opResults: any[] = [];
    let opCount = 0;
    if (!category) {
      opQuery = opQuery.range(startRange, endRange);
      const { data: opData, count: opTotal } = await opQuery;
      opCount = opTotal ?? 0;

      opResults = (opData || []).map((op: any, index: number) => ({
        id: op.id,
        slug: op.slug,
        name: op.name || 'Escort Operator',
        city: op.city,
        state: op.admin1_code,
        location: `${op.city}, ${op.admin1_code}`,
        region_code: op.admin1_code,
        country_code: op.country_code,
        services: op.role_primary ? [op.role_primary] : [],
        category: op.role_primary || 'pilot_car',
        is_claimed: op.is_claimed === true,
        rating: op.confidence_score ? (op.confidence_score / 20) : null,
        review_count: 0,
        rank_score: op.confidence_score ?? 0,
        score: op.confidence_score ?? 50,
        is_featured: (op.confidence_score ?? 0) > 80,
        profile_completeness: 40,
        phone: (isCensored && index >= 2) ? '(XXX) XXX-XXXX' : (op.phone_normalized || ''),
        source: 'operators',
      }));
    }

    // ═════════════════════════════════════════
    // MERGE
    // ═════════════════════════════════════════
    const allResults = [...hcResults, ...opResults];

    // Sort merged
    allResults.sort((a, b) => {
      if (b.is_claimed !== a.is_claimed) return Number(b.is_claimed) - Number(a.is_claimed);
      return (b.rank_score ?? 0) - (a.rank_score ?? 0);
    });

    const combinedTotal = (hcCount ?? 0) + opCount;
    const operators = allResults.slice(0, limit);

    return NextResponse.json({
      operators,
      censored: isCensored,
      total: combinedTotal,
      page,
      limit,
      total_pages: Math.ceil(combinedTotal / limit),
      has_more: (startRange + limit) < combinedTotal,
      sources: { hc_places: hcCount ?? 0, operators: opCount },
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

