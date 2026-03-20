/**
 * GET /api/directory/listings
 * Returns paginated directory_listings for the mobile directory.
 * Shows claimed/unclaimed status per listing to create claim pressure.
 * Boosted operators (active ad_boosts) sort to top with sponsored flag.
 *
 * Query:
 *   ?limit=30   — max 50
 *   ?offset=0
 *   ?state=TX   — filter by region_code
 *   ?q=name     — fuzzy name search
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
    const svc = getSupabaseAdmin();
    const sp = req.nextUrl.searchParams;
    const limit = Math.min(parseInt(sp.get('limit') ?? '30'), 50);
    const offset = parseInt(sp.get('offset') ?? '0');
    // BUG FIX: Client sends 'region', accept both param names
    const state = (sp.get('state') ?? sp.get('region'))?.toUpperCase();
    const q = sp.get('q');

    // Get total count
    let countQ = svc.from('directory_listings').select('*', { count: 'exact', head: true });
    if (state) countQ = countQ.eq('region_code', state);
    if (q) countQ = countQ.ilike('name', `%${q}%`);
    const { count: total } = await countQ;

    // Get active boost profile IDs
    const now = new Date().toISOString();
    let boostedIds: Set<string> = new Set();
    try {
        const { data: activeBoosts } = await svc
            .from('ad_boosts')
            .select('profile_id')
            .eq('status', 'active')
            .gt('expires_at', now);
        (activeBoosts ?? []).forEach(b => boostedIds.add(b.profile_id));
    } catch { /* ad_boosts may not exist yet */ }

    // Get listings — select actual schema fields
    // BUG FIX: Use neq(false) instead of eq(true) to include rows where is_visible is null
    let query = svc
        .from('directory_listings')
        .select('id, slug, name, city, region_code, country_code, claim_status, rank_score, profile_completeness')
        .neq('is_visible', false)
        .order('rank_score', { ascending: false, nullsFirst: false })
        .range(offset, offset + limit - 1);

    if (state) query = query.eq('region_code', state);
    if (q) query = query.ilike('name', `%${q}%`);

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ listings: [], total: 0, error: error.message }, { status: 500 });
    }

    // Transform for mobile consumption + mark sponsored
    const listings = (data ?? []).map(row => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        city: row.city,
        region_code: row.region_code,
        country_code: row.country_code,
        is_claimed: row.claim_status === 'claimed',
        rank_score: row.rank_score ?? 0,
        completeness: row.profile_completeness ?? 0,
        metadata: {
            is_sponsored: boostedIds.has(row.id),
        },
    }));

    // Sort: boosted operators first, then by rank
    listings.sort((a, b) => {
        const aSponsored = a.metadata.is_sponsored ? 1 : 0;
        const bSponsored = b.metadata.is_sponsored ? 1 : 0;
        if (bSponsored !== aSponsored) return bSponsored - aSponsored;
        return (b.rank_score ?? 0) - (a.rank_score ?? 0);
    });

    return NextResponse.json({
        listings,
        total: total ?? 0,
        limit,
        offset,
    }, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
}
