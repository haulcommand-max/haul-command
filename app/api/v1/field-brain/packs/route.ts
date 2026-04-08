import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET  /v1/field-brain/packs — List published offline packs
// POST /v1/field-brain/offline-actions/sync — Sync offline actions
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(req: NextRequest) {
    try {
        const db = supabase();
        const country = req.nextUrl.searchParams.get('country_code');
        const language = req.nextUrl.searchParams.get('language_code');

        let query = db
            .from('hc_offline_packs')
            .select('pack_type, country_code, language_code, version, file_size_bytes, content_summary, published_at')
            .eq('is_published', true);

        if (country) query = query.eq('country_code', country);
        if (language) query = query.eq('language_code', language);

        const { data, error } = await query.order('pack_type').order('country_code');

        if (error) throw error;

        return NextResponse.json({ packs: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
