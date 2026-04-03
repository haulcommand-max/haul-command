/**
 * POST /api/capture/save-search
 * Saves a visitor's search intent to Supabase for later re-engagement.
 * Feeds the capture router's saved-intent system.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { query, filters, visitor_id, email, country_code, state_code } = body;

        if (!query && !filters) {
            return NextResponse.json({ error: 'Missing query or filters' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('saved_searches')
            .insert({
                visitor_id: visitor_id || null,
                email: email || null,
                query: query || '',
                filters: filters || {},
                country_code: country_code || null,
                state_code: state_code || null,
                source: 'capture_overlay',
                created_at: new Date().toISOString(),
            })
            .select('id')
            .single();

        if (error) {
            console.error('Save search error:', error);
            return NextResponse.json({ error: 'Failed to save search' }, { status: 500 });
        }

        return NextResponse.json({ ok: true, saved_search_id: data?.id });
    } catch (err) {
        console.error('Save search error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
