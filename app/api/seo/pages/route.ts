export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ─────────────────────────────────────────────────
// GET /api/seo/pages?type=region&status=published&region=florida
// Public: published pages only
// Admin: all pages
// ─────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const type = searchParams.get('type');
    const status = searchParams.get('status') || 'published';
    const region = searchParams.get('region');
    const country = searchParams.get('country');

    let query = supabase
        .from('seo_pages')
        .select('id, slug, type, region, corridor_slug, city, country, title, h1, meta_description, status, canonical_url, updated_at')
        .order('slug');

    if (status !== 'all') query = query.eq('status', status);
    if (type) query = query.eq('type', type);
    if (region) query = query.eq('region', region);
    if (country) query = query.eq('country', country);

    const { data, error } = await query.limit(200);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ pages: data });
}
