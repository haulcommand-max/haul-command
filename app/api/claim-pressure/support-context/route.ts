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
        const [byLocation, byRole, byCountry] = await Promise.all([
            readRows('v_hc_claim_pressure_by_location'),
            readRows('v_hc_claim_pressure_by_role'),
            readRows('v_hc_claim_pressure_by_country'),
        ]);

        return NextResponse.json({ ok: true, byLocation, byRole, byCountry });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: 'Claim pressure support context failed', details: error?.message }, { status: 500 });
    }
}
