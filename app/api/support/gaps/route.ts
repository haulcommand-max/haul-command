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
        const [allGaps, zeroSupply, positiveSupply, priority, counts, adgridQueue, claimQueue] = await Promise.all([
            readRows('v_hc_support_supply_gap'),
            readRows('v_hc_support_zero_supply_gap'),
            readRows('v_hc_support_positive_supply_gap'),
            readRows('v_hc_support_gap_priority'),
            readRows('v_hc_support_gap_counts'),
            readRows('v_hc_support_to_adgrid_queue'),
            readRows('v_hc_support_to_claim_queue'),
        ]);

        return NextResponse.json({ ok: true, allGaps, zeroSupply, positiveSupply, priority, counts, adgridQueue, claimQueue });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: 'Support gap query failed', details: error?.message }, { status: 500 });
    }
}
