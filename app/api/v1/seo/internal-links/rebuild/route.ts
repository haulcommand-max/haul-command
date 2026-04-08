import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /v1/seo/internal-links/rebuild — Rebuild internal links for a surface
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
    try {
        const db = supabase();
        const body = await req.json();
        const { surface_run_id } = body;

        if (!surface_run_id) {
            return NextResponse.json({ error: 'surface_run_id required' }, { status: 400 });
        }

        // Verify surface exists
        const { data: surface } = await db
            .from('seo_surface_runs')
            .select('id, blueprint_key, country_code, url_path')
            .eq('id', surface_run_id)
            .single();

        if (!surface) {
            return NextResponse.json({ error: 'Surface run not found' }, { status: 404 });
        }

        // Clear existing links for this surface
        await db
            .from('seo_internal_links')
            .delete()
            .eq('from_surface_run_id', surface_run_id);

        // Find related surfaces in same country for linking
        const { data: relatedSurfaces } = await db
            .from('seo_surface_runs')
            .select('id, url_path, title, blueprint_key')
            .eq('country_code', surface.country_code)
            .eq('status', 'published')
            .neq('id', surface_run_id)
            .limit(20);

        const links = (relatedSurfaces || []).map((rs, i) => ({
            from_surface_run_id: surface_run_id,
            to_surface_run_id: rs.id,
            to_url_path: rs.url_path,
            anchor_text: rs.title || rs.blueprint_key,
            link_type: rs.blueprint_key === surface.blueprint_key ? 'related' : 'see_also',
            relevance_score: Math.max(0.3, 1 - i * 0.05),
            position_in_content: i < 3 ? 'intro' : 'body',
        }));

        if (links.length > 0) {
            await db.from('seo_internal_links').insert(links);
        }

        return NextResponse.json({ links_created: links.length });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
