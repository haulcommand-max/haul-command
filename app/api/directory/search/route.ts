import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/directory/search
 *
 * FIXED: Was using directory_listings (old table). Now unified on `listings`.
 * Removed status='active' bug — was filtering to only ~60 rows with explicit status.
 * Now uses active=true which is set on all 7,821 rows after migration.
 *
 * Full-text + column search with proper pagination.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(req.url);

    const q = searchParams.get('q') || '';
    const country = searchParams.get('country') || '';
    const state = searchParams.get('state') || '';
    const service = searchParams.get('service') || '';
    const claimedOnly = searchParams.get('claimed') === 'true';
    const ratedOnly = searchParams.get('rated') === 'true';
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '48'), 100);
    const offset = (page - 1) * limit;
    const sortBy = searchParams.get('sort') ?? 'rank';

    // Build query on `listings` (single source of truth)
    let query = supabase
      .from('listings')
      .select(
        'id, full_name, city, state, country_code, services, claimed, rating, review_count, rank_score, featured, profile_completeness, slug',
        { count: 'exact' }
      )
      .eq('active', true);

    // Text search
    if (q) {
      query = query.or(
        `full_name.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%,bio.ilike.%${q}%`
      );
    }

    // Filters
    if (country) query = query.eq('country_code', country.toLowerCase());
    if (state) query = query.eq('state', state.toUpperCase());
    if (service) query = query.contains('services', [service]);
    if (claimedOnly) query = query.eq('claimed', true);
    if (ratedOnly) query = query.not('rating', 'is', null);

    // Sort
    if (sortBy === 'rating') {
      query = query
        .order('rating', { ascending: false, nullsFirst: false })
        .order('review_count', { ascending: false, nullsFirst: false });
    } else if (sortBy === 'reviews') {
      query = query.order('review_count', { ascending: false, nullsFirst: false });
    } else if (sortBy === 'name') {
      query = query.order('full_name', { ascending: true });
    } else {
      // Default rank: featured → rank_score → claimed
      query = query
        .order('featured', { ascending: false, nullsFirst: false })
        .order('rank_score', { ascending: false, nullsFirst: false })
        .order('claimed', { ascending: false, nullsFirst: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      operators: (data ?? []).map(op => ({
        id: op.id,
        slug: op.slug,
        name: op.full_name,
        city: op.city,
        state: op.state,
        country_code: op.country_code ?? 'us',
        services: op.services ?? [],
        is_claimed: op.claimed,
        rating: op.rating,
        review_count: op.review_count ?? 0,
        rank_score: op.rank_score ?? 0,
        is_featured: op.featured ?? false,
        profile_completeness: op.profile_completeness ?? 0,
      })),
      total: count ?? 0,
      page,
      limit,
      total_pages: Math.ceil((count ?? 0) / limit),
      has_more: page < Math.ceil((count ?? 0) / limit),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
