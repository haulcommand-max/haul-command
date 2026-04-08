import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /v1/glossary/terms/{term_id}/localize — Add localization
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(
    req: NextRequest,
    { params }: { params: { term_id: string } },
) {
    try {
        const db = supabase();
        const body = await req.json();
        const {
            country_code, language_code, localized_term, localized_definition,
            regulatory_context, local_usage_notes, translation_quality,
        } = body;

        if (!country_code || !localized_term || !localized_definition) {
            return NextResponse.json(
                { error: 'country_code, localized_term, and localized_definition required' },
                { status: 400 },
            );
        }

        const { data, error } = await db
            .from('glo_term_localizations')
            .upsert({
                term_id: params.term_id,
                country_code,
                language_code: language_code || 'en',
                localized_term,
                localized_definition,
                regulatory_context: regulatory_context || null,
                local_usage_notes: local_usage_notes || null,
                translation_quality: translation_quality || 'machine',
            }, { onConflict: 'term_id,country_code,language_code' })
            .select('id')
            .single();

        if (error) throw error;

        return NextResponse.json({ localization_id: data.id }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
