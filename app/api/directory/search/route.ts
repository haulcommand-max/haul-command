import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchOperators } from '@/lib/typesense/sync';

/**
 * GET /api/directory/search
 *
 * Unified search now backed by Typesense for blazing fast retrieval,
 * gracefully falling back to Supabase if the index is unreachable.
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
    
    // Hard filter params (certification / equipment / availability)
    const filterTwic = searchParams.get('twic') === 'true';
    const filterHazmat = searchParams.get('hazmat') === 'true';
    const filterHighPole = searchParams.get('highPole') === 'true';
    const filterSuperload = searchParams.get('superload') === 'true';
    const filterAvCertified = searchParams.get('avCertified') === 'true';
    const filterGpsTracked = searchParams.get('gpsTracked') === 'true';
    const filterVerified = searchParams.get('verified') === 'true';
    const filterAvailableNow = searchParams.get('availableNow') === 'true';
    const filterEquipment = searchParams.getAll('equipment');
    
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
    // TYPESENSE FAST-PATH EXECUTION
    // ═════════════════════════════════════════
    if (process.env.NEXT_PUBLIC_FEATURE_TYPESENSE === 'true' || process.env.FEATURE_TYPESENSE === 'true') {
      try {
        const tsRes = await searchOperators(q, {
          country: country || undefined,
          state: state || undefined,
          category: category || undefined,
          page,
          perPage: limit
        });

        if (tsRes && tsRes.hits && tsRes.hits.length > 0) {
          const operators = tsRes.hits.map((hit: any, index: number) => {
            const doc = hit.document;
            return {
              id: doc.id,
              slug: doc.id, // Fallback if slug isn't present
              name: doc.company_name || doc.display_name || 'Operator',
              city: doc.city,
              state: doc.state || doc.state_province,
              location: `${doc.city || ''}, ${doc.state || doc.state_province || ''}`,
              region_code: doc.state || doc.state_province,
              country_code: doc.country || doc.country_code,
              services: doc.service_categories || [],
              category: (doc.service_categories && doc.service_categories[0]) || 'heavy_haul',
              is_claimed: doc.is_claimed,
              rating: doc.reputation_score ? (doc.reputation_score / 20) : null,
              review_count: 0,
              rank_score: doc.reputation_score || doc.trust_score || 50,
              score: doc.reputation_score || doc.trust_score || 50,
              is_featured: (doc.reputation_score || doc.trust_score) > 80,
              profile_completeness: doc.completion_pct || 40,
              phone: (isCensored && index >= 2) ? '(XXX) XXX-XXXX' : (doc.phone_e164 || ''),
              source: 'typesense',
            };
          });

          return NextResponse.json({
            operators,
            censored: isCensored,
            total: tsRes.found,
            page: tsRes.page,
            limit,
            total_pages: Math.ceil(tsRes.found / limit),
            has_more: (page * limit) < tsRes.found,
            sources: { typesense: tsRes.found },
          }, {
            headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
          });
        }
      } catch (tsErr) {
        console.error('[Typesense] Fast-path failed, falling back to Supabase:', tsErr);
      }
    }

    // ═════════════════════════════════════════
    // FALLBACK 1: hc_places (23,281+ businesses)
    // ═════════════════════════════════════════
    let hcQuery = supabase
      .from('hc_places')
      .select(
        'id, name, locality, admin1_code, country_code, phone, surface_category_key, slug, claim_status, demand_score, twic_certified, hazmat_endorsed, high_pole_certified, superload_rated, av_escort_certified, gps_tracked, hc_verified, equipment_tags',
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
    
    // Hard filters — certification boolean columns
    if (filterTwic) hcQuery = hcQuery.eq('twic_certified', true);
    if (filterHazmat) hcQuery = hcQuery.eq('hazmat_endorsed', true);
    if (filterHighPole) hcQuery = hcQuery.eq('high_pole_certified', true);
    if (filterSuperload) hcQuery = hcQuery.eq('superload_rated', true);
    if (filterAvCertified) hcQuery = hcQuery.eq('av_escort_certified', true);
    if (filterGpsTracked) hcQuery = hcQuery.eq('gps_tracked', true);
    if (filterVerified) hcQuery = hcQuery.eq('hc_verified', true);
    // Equipment array containment (all selected equipment must be present)
    if (filterEquipment.length > 0) {
      hcQuery = hcQuery.contains('equipment_tags', filterEquipment);
    }

    if (sortBy === 'name') {
      hcQuery = hcQuery.order('name', { ascending: true });
    } else {
      hcQuery = hcQuery.order('demand_score', { ascending: false, nullsFirst: false });
    }

    hcQuery = hcQuery.range(startRange, endRange);

    const { data: hcData, count: hcCount } = await hcQuery;

    // ═══ Available Now: fetch live operator IDs ═══
    let liveOperatorIds: Set<string> | null = null;
    if (filterAvailableNow) {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: liveOps } = await supabase
        .from('operator_live_status')
        .select('operator_id')
        .eq('status', 'available')
        .gte('last_pinged_at', thirtyMinAgo);
      liveOperatorIds = new Set((liveOps || []).map((r: any) => r.operator_id));
    }

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
      // Certification badges (new)
      badges: {
        twic: row.twic_certified ?? false,
        hazmat: row.hazmat_endorsed ?? false,
        highPole: row.high_pole_certified ?? false,
        superload: row.superload_rated ?? false,
        avCertified: row.av_escort_certified ?? false,
        gpsTracked: row.gps_tracked ?? false,
        verified: row.hc_verified ?? false,
      },
      equipment_tags: row.equipment_tags ?? [],
      is_available_now: liveOperatorIds ? liveOperatorIds.has(row.id) : false,
    })).filter((row: any) => {
      // If availability filter is on, only keep operators who are live
      if (filterAvailableNow && !row.is_available_now) return false;
      return true;
    });

    // ═════════════════════════════════════════
    // QUERY 2: hc_global_operators (legacy)
    // Skip when hard filters are active — legacy table has no cert columns
    // ═════════════════════════════════════════
    const hasHardFilters = filterTwic || filterHazmat || filterHighPole || filterSuperload ||
      filterAvCertified || filterGpsTracked || filterVerified || filterAvailableNow ||
      filterEquipment.length > 0;

    let opResults: any[] = [];
    let opCount = 0;

    if (!category && !hasHardFilters) {
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
        badges: {},
        equipment_tags: [],
        is_available_now: false,
      }));
    }

    // ═════════════════════════════════════════
    // MERGE
    // ═════════════════════════════════════════
    const allResults = [...hcResults, ...opResults];

    // Sort merged — available operators bubble to top when filter is active
    allResults.sort((a, b) => {
      // Available now operators always first
      if (a.is_available_now !== b.is_available_now) return Number(b.is_available_now) - Number(a.is_available_now);
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
      filters_applied: hasHardFilters ? {
        twic: filterTwic, hazmat: filterHazmat, highPole: filterHighPole,
        superload: filterSuperload, avCertified: filterAvCertified,
        gpsTracked: filterGpsTracked, verified: filterVerified,
        availableNow: filterAvailableNow, equipment: filterEquipment,
      } : null,
    }, {
      headers: { 'Cache-Control': hasHardFilters ? 'private, no-cache' : 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

