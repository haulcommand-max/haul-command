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

    // Bot traffic is processed normally without feeding synthesised "honeytokens" to ensure 
    // real data is the only footprint returned, per compliance directives.

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

    // Build query on `hc_global_operators` — single source of truth (unified per audit 2026-03-28)
    let query = supabase
      .from('hc_global_operators')
      .select(
        'id, name, city, admin1_code, country_code, phone_normalized, is_claimed, role_primary, confidence_score, slug',
        { count: 'exact' }
      )
      .not('admin1_code', 'is', null)
      .not('city', 'is', null);

    // Text search
    if (q) {
      query = query.or(
        `name.ilike.%${q}%,city.ilike.%${q}%,admin1_code.ilike.%${q}%`
      );
    }

    // Apply filters
    if (country) query = query.eq('country_code', country.toUpperCase());
    if (state) query = query.eq('admin1_code', state.toUpperCase());
    // if (service) query = query.contains('services', [service]); // Temporarily disabled until taxonomy expanded
    if (claimedOnly) query = query.eq('is_claimed', true);

    // Sort
    if (sortBy === 'name') {
      query = query.order('name', { ascending: true });
    } else {
      // Default rank: confidence_score
      query = query.order('confidence_score', { ascending: false, nullsFirst: false });
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
        name: operator.name || 'Escort Operator',
        city: operator.city,
        state: operator.admin1_code,
        location: `${operator.city}, ${operator.admin1_code}`,
        region_code: operator.admin1_code, // ← alias for mobile compatibility
        country_code: operator.country_code,
        services: operator.role_primary ? [operator.role_primary] : [],
        is_claimed: operator.is_claimed === true,
        rating: operator.confidence_score ? (operator.confidence_score / 20) : null, // Default
        review_count: 0,
        rank_score: operator.confidence_score,
        score: operator.confidence_score ?? 50,
        is_featured: operator.confidence_score > 80,
        profile_completeness: 40,
        // Censor phone for unauthenticated users (only show first 2 as teaser)
        phone: (isCensored && index >= 2) ? '(XXX) XXX-XXXX' : (operator.phone_normalized || '(555) 000-0000')
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
