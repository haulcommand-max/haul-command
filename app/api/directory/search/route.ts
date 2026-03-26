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
            is_claimed: true, rating: 5.0, review_count: 999, rank_score: 100, is_featured: true, profile_completeness: 100
          },
          {
            id: 'honeytoken-02', slug: 'titan-escort-fake', name: 'Titan Escort Services', 
            city: 'Void', state: 'XX', country_code: 'US', services: ['flagger_traffic_control'],
            is_claimed: false, rating: 4.8, review_count: 50, rank_score: 80, is_featured: false, profile_completeness: 50
          }
        ],
        total: 2, page: 1, limit: 48, total_pages: 1, has_more: false
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

    // Build query on `directory_listings`
    let query = supabase
      .from('directory_listings')
      .select(
        'id, name, city, region_code, country_code, claim_status, metadata, rank_score, profile_completeness, slug',
        { count: 'exact' }
      )
      .eq('is_visible', true)
      .not('region_code', 'is', null) // Ensure we only get real locations
      .not('city', 'is', null);

    // Text search
    if (q) {
      query = query.or(
        `name.ilike.%${q}%,city.ilike.%${q}%,region_code.ilike.%${q}%`
      );
    }

    // Apply filters
    if (country) query = query.eq('country_code', country.toUpperCase());
    if (state) query = query.eq('region_code', state.toUpperCase());
    if (service) query = query.contains('metadata->services', [service]);
    if (claimedOnly) query = query.eq('claim_status', 'claimed');

    // Sort
    if (sortBy === 'name') {
      query = query.order('name', { ascending: true });
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
    const sanitizedData = (rawData || []).map((operator) => {
      // Create a safely cloned metadata object
      let safeMetadata = operator.metadata ? JSON.parse(JSON.stringify(operator.metadata)) : {};
      
      if (!isAuthenticated) {
        // Censor high-value fields (Data Value Score > 8)
        if (safeMetadata.phone) safeMetadata.phone = "[LOCKED - LOGIN TO VIEW]";
        if (safeMetadata.email) safeMetadata.email = "[LOCKED - LOGIN TO VIEW]";
        if (safeMetadata.exact_address) safeMetadata.exact_address = "Address Hidden (Geo-Fenced)";
        safeMetadata.is_censored = true;
      }

      return {
        id: operator.id,
        slug: operator.slug,
        name: operator.name,
        city: operator.city,
        state: operator.region_code,
        country_code: operator.country_code,
        services: safeMetadata?.services || [],
        is_claimed: operator.claim_status === 'claimed',
        rating: 5.0, // Default for now
        review_count: 0,
        rank_score: operator.rank_score,
        is_featured: operator.rank_score > 80,
        profile_completeness: safeMetadata?.phone ? 80 : 40,
        metadata: safeMetadata
      };
    });

    return NextResponse.json({
      operators: sanitizedData,
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
