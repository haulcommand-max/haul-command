import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /v1/loads/{load_id}/matches — Get matches for a load
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(
    _req: NextRequest,
    { params }: { params: { load_id: string } },
) {
    try {
        const db = supabase();

        const { data: matches, error } = await db
            .from('hc_load_matches')
            .select(`
                id, entity_id, match_score, distance_score, trust_score,
                availability_score, experience_score,
                contact_status, contacted_at, responded_at,
                match_reason, deadhead_miles, created_at
            `)
            .eq('load_id', params.load_id)
            .order('match_score', { ascending: false });

        if (error) throw error;

        // Enrich with entity names
        const enriched = [];
        for (const m of matches || []) {
            const { data: entity } = await db
                .from('hc_entities')
                .select('canonical_name, entity_type, country_code, region_code, trust_score')
                .eq('id', m.entity_id)
                .single();

            enriched.push({
                ...m,
                entity_name: entity?.canonical_name || 'Unknown',
                entity_type: entity?.entity_type,
                entity_trust: entity?.trust_score,
                entity_location: entity ? `${entity.region_code}, ${entity.country_code}` : null,
            });
        }

        return NextResponse.json({ matches: enriched });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
