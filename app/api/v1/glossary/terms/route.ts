import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /v1/glossary/terms — Create a glossary term
// GET  /v1/glossary/terms?term_key=... — Get term by key
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
    try {
        const db = supabase();
        const body = await req.json();
        const {
            canonical_term, term_type, base_definition, extended_definition,
            category, subcategory, industry_vertical, source, tags,
        } = body;

        if (!canonical_term || !base_definition) {
            return NextResponse.json(
                { error: 'canonical_term and base_definition required' },
                { status: 400 },
            );
        }

        const termKey = canonical_term
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        const { data, error } = await db
            .from('glo_terms')
            .insert({
                term_key: termKey,
                canonical_term,
                term_type: term_type || 'definition',
                base_definition,
                extended_definition: extended_definition || null,
                category: category || null,
                subcategory: subcategory || null,
                industry_vertical: industry_vertical || 'heavy_haul',
                seo_title: `${canonical_term} — Glossary | Haul Command`,
                seo_description: base_definition.slice(0, 155),
                source: source || null,
                tags: tags || [],
                status: 'active',
            })
            .select('id')
            .single();

        if (error) throw error;

        return NextResponse.json({ term_id: data.id }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const termKey = req.nextUrl.searchParams.get('term_key');
    if (!termKey) {
        return NextResponse.json({ error: 'term_key required' }, { status: 400 });
    }

    try {
        const db = supabase();

        const { data: term, error } = await db
            .from('glo_terms')
            .select('*')
            .eq('term_key', termKey)
            .eq('status', 'active')
            .single();

        if (error || !term) {
            return NextResponse.json({ error: 'Term not found' }, { status: 404 });
        }

        // Fetch localizations
        const { data: localizations } = await db
            .from('glo_term_localizations')
            .select('country_code, language_code, localized_term, translation_quality')
            .eq('term_id', term.id);

        // Fetch aliases
        const { data: aliases } = await db
            .from('glo_term_aliases')
            .select('alias, alias_type, language_code')
            .eq('term_id', term.id);

        // Fetch related terms
        const { data: related } = await db
            .from('glo_related_terms')
            .select('to_term_id, relationship_type, relevance_score')
            .eq('from_term_id', term.id);

        return NextResponse.json({
            term_key: term.term_key,
            canonical_term: term.canonical_term,
            term_type: term.term_type,
            base_definition: term.base_definition,
            category: term.category,
            industry_vertical: term.industry_vertical,
            localizations: localizations || [],
            aliases: aliases || [],
            related_terms: related || [],
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
