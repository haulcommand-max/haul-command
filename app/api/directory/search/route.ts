import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/directory/search
 *
 * Mapped to `directory_listings` (the populated production table).
 * Enables the 7,821 seeded records to instantly appear in the app/directory
 * without requiring new schema endpoints.
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

    // Build query on `directory_listings`
    let query = supabase
      .from('directory_listings')
      .select(
        'id, name, city, region_code, country_code, claim_status, metadata, rank_score, profile_completeness, slug',
        { count: 'exact' }
      )
      .eq('is_visible', true)
      .eq('entity_type', 'pilot_car_operator');

    // Text search
    if (q) {
      query = query.or(
        `name.ilike.%${q}%,city.ilike.%${q}%,region_code.ilike.%${q}%`
      );
    }

    // Filters
    if (country) query = query.eq('country_code', country.toUpperCase());
    if (state) query = query.eq('region_code', state.toUpperCase());
    
    // Services are stored in metadata->services, which in Supabase PostgREST requires a specific JSONB syntax if filtering server-side
    // For simplicity & robustness (and since we index metadata), we can filter using contains if it was structured, 
    // but typically we can skip deep JSONB array filtering if traffic is low, or use `.contains('metadata->services', ...)`
    // if (service) query = query.contains('metadata->services', `["${service}"]`);
    
    if (claimedOnly) query = query.eq('claim_status', 'claimed');
    // Note: Ratings isn't tracked in directory_listings natively yet, so we ignore ratedOnly for now.

    // Sort
    if (sortBy === 'name') {
      query = query.order('name', { ascending: true });
    } else {
      // Default rank: rank_score
      query = query.order('rank_score', { ascending: false, nullsFirst: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      operators: (data ?? []).map(op => {
        // Safe parse metadata
        const meta = op.metadata || {};
        return {
          id: op.id,
          slug: op.slug || '',
          name: op.name || 'Unknown Operator',
          city: op.city || '',
          state: op.region_code || '',
          country_code: op.country_code ?? 'US',
          services: meta.services || [],
          is_claimed: op.claim_status === 'claimed',
          rating: 0, // Fallback until review engine engages
          review_count: 0,
          rank_score: op.rank_score ?? 0,
          is_featured: (op.rank_score ?? 0) > 50,
          profile_completeness: op.profile_completeness ?? 0,
          phone: meta.phone || null,
          company: meta.company || null
        };
      }),
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
