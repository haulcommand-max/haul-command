import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/directory/search
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(req.url);
    
    const q = searchParams.get('q') || '';
    const country = searchParams.get('country') || '';
    const state = searchParams.get('state') || '';
    const corridor = searchParams.get('corridor') || '';
    const verified_only = searchParams.get('verified') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('directory_listings')
      .select('id, name, company_name, country_code, city, state, corridors, verified, rating, response_time_minutes, runs_completed, featured', { count: 'exact' })
      .eq('status', 'active');

    if (q) {
      query = query.or(`name.ilike.%${q}%,company_name.ilike.%${q}%,city.ilike.%${q}%`);
    }
    if (country) {
      query = query.eq('country_code', country.toLowerCase());
    }
    if (state) {
      query = query.eq('state', state.toUpperCase());
    }
    if (corridor) {
      query = query.contains('corridors', [corridor]);
    }
    if (verified_only) {
      query = query.eq('verified', true);
    }

    // Featured first, then by rating
    query = query
      .order('featured', { ascending: false, nullsFirst: false })
      .order('rating', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      operators: data || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
