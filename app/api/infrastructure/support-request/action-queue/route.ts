import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function readRows(view: string, limit = 100) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from(view).select('*').limit(limit);
    return { view, rows: data || [], error: error?.message || null };
}

export async function GET() {
    try {
        const [actions, counts, acquisition, unlocks, locations, abuse, monitor] = await Promise.all([
            readRows('v_hc_support_action_queue'),
            readRows('v_hc_support_next_action_counts'),
            readRows('v_hc_support_provider_acquisition_queue'),
            readRows('v_hc_support_unlock_offer_queue'),
            readRows('v_hc_support_location_collection_queue'),
            readRows('v_hc_support_abuse_review_queue'),
            readRows('v_hc_support_monitor_queue'),
        ]);

        return NextResponse.json({ ok: true, actions, counts, acquisition, unlocks, locations, abuse, monitor });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: 'Support action queue query failed', details: error?.message }, { status: 500 });
    }
}
