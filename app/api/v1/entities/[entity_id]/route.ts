import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /v1/entities/{entity_id} — Get entity details
// POST /v1/entities/{entity_id}/aliases — Add aliases
// POST /v1/entities/{entity_id}/relationships — Add relationship
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(
    _req: NextRequest,
    { params }: { params: { entity_id: string } },
) {
    try {
        const db = supabase();

        const { data: entity, error } = await db
            .from('hc_entities')
            .select(`
                id, entity_type, canonical_name, slug,
                country_code, region_code, city_name,
                phone, email, website, external_ids,
                status, claim_status, claimed_at,
                trust_score, freshness_score, confidence_score, completeness_score,
                tags, data_sources, created_at, updated_at
            `)
            .eq('id', params.entity_id)
            .single();

        if (error || !entity) {
            return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
        }

        // Fetch aliases
        const { data: aliases } = await db
            .from('hc_entity_aliases')
            .select('alias, alias_type, language_code, confidence')
            .eq('entity_id', params.entity_id);

        // Fetch relationship count
        const { count: relCount } = await db
            .from('hc_entity_relationships')
            .select('id', { count: 'exact', head: true })
            .or(`from_entity_id.eq.${params.entity_id},to_entity_id.eq.${params.entity_id}`);

        return NextResponse.json({
            ...entity,
            entity_id: entity.id,
            aliases: aliases || [],
            relationship_count: relCount || 0,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
