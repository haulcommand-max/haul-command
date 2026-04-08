import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /v1/entities/{entity_id}/relationships — Add relationship
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(
    req: NextRequest,
    { params }: { params: { entity_id: string } },
) {
    try {
        const db = supabase();
        const body = await req.json();
        const { to_entity_id, relationship_type, strength_score, metadata } = body;

        if (!to_entity_id || !relationship_type) {
            return NextResponse.json(
                { error: 'to_entity_id and relationship_type required' },
                { status: 400 },
            );
        }

        if (to_entity_id === params.entity_id) {
            return NextResponse.json(
                { error: 'Self-relationships not allowed' },
                { status: 400 },
            );
        }

        // Verify both entities exist
        const { data: entities } = await db
            .from('hc_entities')
            .select('id')
            .in('id', [params.entity_id, to_entity_id]);

        if (!entities || entities.length < 2) {
            return NextResponse.json({ error: 'One or both entities not found' }, { status: 404 });
        }

        const { data, error } = await db
            .from('hc_entity_relationships')
            .upsert({
                from_entity_id: params.entity_id,
                to_entity_id,
                relationship_type,
                strength_score: strength_score ?? 0.5,
                metadata: metadata || {},
            }, { onConflict: 'from_entity_id,to_entity_id,relationship_type' })
            .select('id')
            .single();

        if (error) throw error;

        return NextResponse.json({
            relationship_id: data.id,
        }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
