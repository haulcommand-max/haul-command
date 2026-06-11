import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function readRows(view: string, limit = 200) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from(view).select('*').limit(limit);
    return { view, rows: data || [], error: error?.message || null };
}

export async function GET() {
    try {
        const [actions, counts, pageRepair, moneyRoute, resolution] = await Promise.all([
            readRows('v_hc_search_action_queue'),
            readRows('v_hc_search_action_counts'),
            readRows('v_hc_search_page_repair_queue'),
            readRows('v_hc_search_money_route_queue'),
            readRows('v_hc_search_resolution_queue'),
        ]);

        return NextResponse.json({ ok: true, actions, counts, pageRepair, moneyRoute, resolution });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: 'Search intent action queue failed', details: error?.message }, { status: 500 });
    }
}
