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
        const [dispatchReady, livePing, verifiedCountry, trustBands, missingCoordinates, hasCoordinates, synthetic, paidBoost] = await Promise.all([
            readRows('v_hc_supply_dispatch_ready_rows'),
            readRows('v_hc_supply_live_ping_rows'),
            readRows('v_hc_supply_verified_by_country'),
            readRows('v_hc_supply_trust_bands'),
            readRows('v_hc_supply_missing_coordinates'),
            readRows('v_hc_supply_has_coordinates'),
            readRows('v_hc_supply_synthetic_rows'),
            readRows('v_hc_supply_paid_boost_rows'),
        ]);

        return NextResponse.json({ ok: true, dispatchReady, livePing, verifiedCountry, trustBands, missingCoordinates, hasCoordinates, synthetic, paidBoost });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: 'Available now quality query failed', details: error?.message }, { status: 500 });
    }
}
