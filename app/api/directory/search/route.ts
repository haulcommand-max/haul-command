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
    const ua = req.headers.get("user-agent") || "";
    const isBot = ua.includes("Headless") || ua.includes("Python") || ua.includes("curl") || ua.includes("scrapy") || ua.includes("bot");

    // 🍯 RESPONSE POISONING
    // If we detect a headless scraper, silently feed them fake competitor data
    if (isBot && !req.url.includes("webhook")) {
      return NextResponse.json({
        operators: [
          {
            id: 'honeytoken-01', slug: 'apex-logistics-fake', name: 'Apex Logistics (Honeytrap)', 
            city: 'Nowhere', state: 'ZZ', country_code: 'US', services: ['pilot_car_operator'],
            is_claimed: true, rating: 5.0, review_count: 999, rank_score: 100, is_featured: true, profile_completeness: 100, phone: '(555) 000-0000'
          },
          {
            id: 'honeytoken-02', slug: 'titan-escort-fake', name: 'Titan Escort Services', 
            city: 'Void', state: 'XX', country_code: 'US', services: ['flagger_traffic_control'],
            is_claimed: false, rating: 4.8, review_count: 50, rank_score: 80, is_featured: false, profile_completeness: 50, phone: '(555) 000-0000'
          }
        ],
        total: 2, page: 1, limit: 48, total_pages: 1, has_more: false, censored: true
      }, {
        headers: {
          'Cache-Control': 'no-store', // Don't cache poisoned data for real users!
        }
      });
    }

    const supabase = createClient();
    const { searchParams } = new URL(req.url);

    // Filter params
    const q = searchParams.get('q') || '';
    const country = searchParams.get('country') || '';
    const state = searchParams.get('state') || '';
    const service = searchParams.get('service') || '';
    const claimedOnly = searchParams.get('claimed') === 'true';
    const ratedOnly = searchParams.get('rated') === 'true';
    
    // Pagination params
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '48'), 100);
    const startRange = (page - 1) * limit;
    const endRange = startRange + limit - 1;
    const sortBy = searchParams.get('sort') ?? 'rank';

    // 💰 Profit-Aware Defense Check (Is the requester Authenticated?)
    const authHeader = req.headers.get('authorization');
    const isAuthenticated = !!authHeader;

    // Build query on `listings` — single source of truth (unified per audit 2026-03-28)
    let query = supabase
      .from('listings')
      .select(
        'id, full_name, city, state, country_code, phone_raw, claimed, claim_status, services, rank_score, profile_completeness, slug',
        { count: 'exact' }
      )
      .eq('active', true)
      .not('state', 'is', null)
      .not('city', 'is', null);

    // Text search
    if (q) {
      query = query.or(
        `full_name.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%`
      );
    }

    // Apply filters
    if (country) query = query.eq('country_code', country.toUpperCase());
    if (state) query = query.eq('state', state.toUpperCase());
    if (service) query = query.contains('services', [service]);
    if (claimedOnly) query = query.eq('claimed', true);

    // Sort
    if (sortBy === 'name') {
      query = query.order('full_name', { ascending: true });
    } else {
      // Default rank: rank_score
      query = query.order('rank_score', { ascending: false, nullsFirst: false });
    }

    query = query.range(startRange, endRange);

    const { data: rawData, error, count } = await query;

    if (error) {
      console.error("Directory Search Error:", error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    // 💰 PROFIT-AWARE CENSORSHIP ENGINE 💰
    // High-value data is heavily protected. Low-value stays open.
    const isCensored = !isAuthenticated;
    const sanitizedData = (rawData || []).map((operator: any, index: number) => {
      return {
        id: operator.id,
        slug: operator.slug,
        name: operator.full_name,
        city: operator.city,
        state: operator.state,
        location: `${operator.city}, ${operator.state}`,
        region_code: operator.state, // ← alias for mobile compatibility
        country_code: operator.country_code,
        services: operator.services || [],
        is_claimed: operator.claimed === true || operator.claim_status === 'claimed',
        rating: 5.0, // Default for now
        review_count: 0,
        rank_score: operator.rank_score,
        score: operator.rank_score ?? 50,
        is_featured: operator.rank_score > 80,
        profile_completeness: operator.profile_completeness ?? 40,
        // Censor phone for unauthenticated users (only show first 2 as teaser)
        phone: (isCensored && index >= 2) ? '(XXX) XXX-XXXX' : (operator.phone_raw || '(555) 000-0000')
      };
    });

    return NextResponse.json({
      operators: sanitizedData,
      censored: isCensored,
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
      has_more: (startRange + limit) < (count || 0)
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
