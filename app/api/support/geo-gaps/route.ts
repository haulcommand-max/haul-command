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
        const [allGaps, zeroSupply, priority, counts] = await Promise.all([
            readRows('v_hc_support_geo_supply_gap'),
            readRows('v_hc_support_geo_zero_supply_gap'),
            readRows('v_hc_support_geo_gap_priority'),
            readRows('v_hc_support_geo_gap_counts'),
        ]);

        return NextResponse.json({ ok: true, allGaps, zeroSupply, priority, counts });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: 'Geo support gap query failed', details: error?.message }, { status: 500 });
    }
}
