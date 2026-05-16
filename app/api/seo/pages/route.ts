export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// ─────────────────────────────────────────────────
// GET /api/seo/pages?type=region&status=published&region=florida
// Public: published pages only
// Admin: all pages
// ─────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);

    const type = searchParams.get('type');
    const status = searchParams.get('status') || 'published';
    const region = searchParams.get('region');
    const country = searchParams.get('country');

    let canonicalQuery = supabase
        .from('hc_seo_pages' as never)
        .select('id, slug, page_type, country_code, geo_key, title, description, publish_status, index_state, published, canonical_url, updated_at')
        .order('slug');

    if (status !== 'all') {
        if (status === 'published') canonicalQuery = canonicalQuery.eq('published' as never, true as never);
        else canonicalQuery = canonicalQuery.eq('publish_status' as never, status as never);
    }
    if (type) canonicalQuery = canonicalQuery.eq('page_type' as never, type as never);
    if (region) canonicalQuery = canonicalQuery.eq('geo_key' as never, region as never);
    if (country) canonicalQuery = canonicalQuery.eq('country_code' as never, country.toUpperCase() as never);

    const { data: canonicalData, error: canonicalError } = await canonicalQuery.limit(200);
    if (!canonicalError) {
        const pages = ((canonicalData as any[]) ?? []).map((page) => ({
            id: page.id,
            slug: page.slug,
            type: page.page_type,
            region: page.geo_key,
            corridor_slug: page.corridor_id ?? null,
            city: null,
            country: page.country_code,
            title: page.title,
            h1: page.title,
            meta_description: page.description,
            status: page.published ? 'published' : (page.publish_status ?? page.index_state),
            canonical_url: page.canonical_url,
            updated_at: page.updated_at,
            source_table: 'hc_seo_pages',
        }));
        return NextResponse.json({ pages });
    }

    let legacyQuery = supabase
        .from('seo_pages' as never)
        .select('id, slug, type, region, corridor_slug, city, country, title, h1, meta_description, status, canonical_url, updated_at')
        .order('slug');

    if (status !== 'all') legacyQuery = legacyQuery.eq('status' as never, status as never);
    if (type) legacyQuery = legacyQuery.eq('type' as never, type as never);
    if (region) legacyQuery = legacyQuery.eq('region' as never, region as never);
    if (country) legacyQuery = legacyQuery.eq('country' as never, country as never);

    const { data, error } = await legacyQuery.limit(200);
    if (error) return NextResponse.json({ error: error.message, canonical_error: canonicalError.message }, { status: 500 });

    return NextResponse.json({ pages: ((data as any[]) ?? []).map((page) => ({ ...page, source_table: 'seo_pages' })) });
}
