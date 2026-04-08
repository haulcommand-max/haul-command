import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /v1/seo/surfaces/{surface_run_id} — Get surface run details
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(
    _req: NextRequest,
    { params }: { params: { surface_run_id: string } },
) {
    try {
        const db = supabase();

        const { data, error } = await db
            .from('seo_surface_runs')
            .select(`
                id, blueprint_key, slug, url_path, country_code, language_code,
                title, meta_description, h1, word_count,
                quality_score, readability_score, uniqueness_score,
                status, published_at, last_indexed_at,
                model_used, generation_cost_usd, content_hash,
                created_at, updated_at
            `)
            .eq('id', params.surface_run_id)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Surface run not found' }, { status: 404 });
        }

        // Get link count
        const { count: linkCount } = await db
            .from('seo_internal_links')
            .select('id', { count: 'exact', head: true })
            .eq('from_surface_run_id', params.surface_run_id);

        // Get FAQ count
        const { count: faqCount } = await db
            .from('seo_faq_blocks')
            .select('id', { count: 'exact', head: true })
            .eq('surface_run_id', params.surface_run_id);

        return NextResponse.json({
            surface_run_id: data.id,
            ...data,
            internal_links_count: linkCount || 0,
            faq_count: faqCount || 0,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
