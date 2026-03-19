import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { generateCreatives, type CreativeRequest } from '@/lib/ai/gemini-ad-factory';

const supabaseAdmin = getSupabaseAdmin();

/**
 * POST /api/adgrid/generate
 * Generate hyper-local ads using Gemini (primary) with template fallback.
 * Stores creatives in creative_versions with full scorecard.
 *
 * Body: { country_code, corridor_code?, city_name?, target_role?, surface?, count? }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            country_code,
            corridor_code,
            city_name,
            target_role = 'both',
            surface = 'directory',
            count = 3,
            parent_creative_id,
        } = body;

        if (!country_code) {
            return NextResponse.json({ error: 'country_code required' }, { status: 400 });
        }

        // Generate via Gemini factory (with template fallback built in)
        const request: CreativeRequest = {
            country_code,
            corridor_code,
            city_name,
            target_role,
            surface,
            count,
            parent_creative_id,
        };

        const result = await generateCreatives(request);

        if (!result.success || result.creatives.length === 0) {
            return NextResponse.json({ error: 'Creative generation failed' }, { status: 500 });
        }

        // Save to creative_versions table
        const savedCreatives = [];
        for (const creative of result.creatives) {
            const { data, error } = await supabaseAdmin
                .from('creative_versions')
                .insert({
                    variant_id: creative.variant_id,
                    parent_variant_id: creative.parent_id || null,
                    country_code: creative.country_code,
                    corridor_code: creative.corridor_code || null,
                    city_slug: creative.city_slug || null,
                    surface: creative.surface,
                    target_role: creative.target_role,
                    language: creative.language,
                    headline: creative.headline,
                    description: creative.description,
                    cta_text: creative.cta_text,
                    cta_url: creative.cta_url,
                    // Scorecard
                    score_clarity: creative.scorecard.clarity,
                    score_stop_power: creative.scorecard.stop_power,
                    score_trust: creative.scorecard.trust,
                    score_niche_fit: creative.scorecard.niche_fit,
                    score_cta_strength: creative.scorecard.cta_strength,
                    score_compliance: creative.scorecard.compliance,
                    score_mobile_readability: creative.scorecard.mobile_readability,
                    score_visual_hierarchy: creative.scorecard.visual_hierarchy,
                    score_expected_ctr: creative.scorecard.expected_ctr,
                    score_conversion_fit: creative.scorecard.conversion_fit,
                    score_composite: creative.scorecard.composite,
                    // Generation
                    generation_model: creative.generation_model,
                    generation_params: creative.generation_params,
                    status: 'active',
                })
                .select()
                .single();

            if (data) savedCreatives.push(data);
        }

        // Also save to legacy hc_ad_generated for backward compat
        for (const creative of result.creatives) {
            await supabaseAdmin
                .from('hc_ad_generated')
                .insert({
                    country_code: creative.country_code,
                    corridor_code: creative.corridor_code || null,
                    city_slug: creative.city_slug || null,
                    headline: creative.headline,
                    description: creative.description,
                    cta_text: creative.cta_text,
                    cta_url: creative.cta_url,
                    ai_model: creative.generation_model,
                    quality_score: creative.scorecard.composite,
                })
                .select()
                .single();
        }

        // Track creative_generated event
        await supabaseAdmin.from('hc_events').insert({
            event_type: 'creative_generated',
            properties: {
                country_code,
                corridor_code,
                city_name,
                target_role,
                surface,
                count: savedCreatives.length,
                source: result.source,
                model: result.model || 'template_fallback',
            },
        });

        return NextResponse.json({
            success: true,
            creatives: savedCreatives,
            count: savedCreatives.length,
            source: result.source,
            model: result.model || 'template_fallback',
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
