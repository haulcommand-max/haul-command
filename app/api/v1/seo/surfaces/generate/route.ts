import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /v1/seo/surfaces/generate — Queue surface generation
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
    try {
        const db = supabase();
        const body = await req.json();
        const { surface_type, surface_entity_id, country_code, language_code, variables } = body;

        if (!surface_type || !country_code) {
            return NextResponse.json(
                { error: 'surface_type and country_code required' },
                { status: 400 },
            );
        }

        // Resolve blueprint
        const { data: blueprint } = await db
            .from('seo_surface_blueprints')
            .select('id, blueprint_key, title_template, target_word_count, internal_link_budget, faq_count')
            .eq('blueprint_key', surface_type)
            .eq('is_active', true)
            .single();

        if (!blueprint) {
            return NextResponse.json(
                { error: `Blueprint '${surface_type}' not found or inactive` },
                { status: 404 },
            );
        }

        // Generate slug
        const slug = `${surface_type}-${country_code.toLowerCase()}-${Date.now().toString(36)}`;

        const { data: run, error } = await db
            .from('seo_surface_runs')
            .insert({
                blueprint_id: blueprint.id,
                blueprint_key: surface_type,
                surface_entity_id: surface_entity_id || null,
                slug,
                url_path: `/${country_code.toLowerCase()}/${surface_type}/${slug}`,
                country_code,
                language_code: language_code || 'en',
                variables_used: variables || {},
                status: 'draft',
            })
            .select('id')
            .single();

        if (error) throw error;

        // Initialize freshness record
        await db.from('seo_content_freshness').insert({
            surface_run_id: run.id,
        });

        return NextResponse.json({
            surface_run_id: run.id,
            status: 'queued',
        }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
