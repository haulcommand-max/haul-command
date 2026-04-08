import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /v1/entities/{entity_id}/aliases — Add aliases
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
        const { aliases } = body;

        if (!aliases || !Array.isArray(aliases) || aliases.length === 0) {
            return NextResponse.json(
                { error: 'aliases array required' },
                { status: 400 },
            );
        }

        // Verify entity exists
        const { data: entity } = await db
            .from('hc_entities')
            .select('id')
            .eq('id', params.entity_id)
            .single();

        if (!entity) {
            return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
        }

        const rows = aliases.map((a: any) => ({
            entity_id: params.entity_id,
            alias: a.alias,
            alias_type: a.alias_type || 'trading_name',
            language_code: a.language_code || 'en',
            confidence: a.confidence ?? 1.0,
            source: a.source || 'api',
        }));

        const { error } = await db
            .from('hc_entity_aliases')
            .upsert(rows, { onConflict: 'entity_id,alias,language_code' });

        if (error) throw error;

        return NextResponse.json({ added: rows.length });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
