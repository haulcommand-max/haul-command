import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET  /v1/skills — List skills (filterable)
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(req: NextRequest) {
    try {
        const db = supabase();
        const sp = req.nextUrl.searchParams;

        let query = db
            .from('hc_skills')
            .select('skill_key, display_name, operating_group, skill_type, is_enabled, version, cost_tier');

        const group = sp.get('operating_group');
        if (group) query = query.eq('operating_group', group);

        const enabled = sp.get('enabled');
        if (enabled === 'true') query = query.eq('is_enabled', true);
        if (enabled === 'false') query = query.eq('is_enabled', false);

        const { data, error } = await query.order('operating_group').order('skill_key');

        if (error) throw error;

        return NextResponse.json({ skills: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
