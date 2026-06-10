import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function readRows(view: string, limit = 50) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from(view).select('*').limit(limit);
    return { view, rows: data || [], error: error?.message || null };
}

export async function GET() {
    try {
        const [missingPages, weakResolution, noMoneyRoute, nearMe, urgent] = await Promise.all([
            readRows('v_hc_search_missing_pages'),
            readRows('v_hc_search_weak_resolution'),
            readRows('v_hc_search_needs_money_route'),
            readRows('v_hc_search_near_me_intents'),
            readRows('v_hc_search_urgent_intents'),
        ]);

        return NextResponse.json({ ok: true, missingPages, weakResolution, noMoneyRoute, nearMe, urgent });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: 'Search intent gap query failed', details: error?.message }, { status: 500 });
    }
}
