import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function readRows(view: string) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from(view).select('*');
    return { view, rows: data || [], error: error?.message || null };
}

export async function GET() {
    try {
        const [countries, roles, sources, urgency] = await Promise.all([
            readRows('v_hc_demand_country_counts'),
            readRows('v_hc_demand_role_counts'),
            readRows('v_hc_demand_source_counts'),
            readRows('v_hc_demand_urgency_counts'),
        ]);

        return NextResponse.json({ ok: true, countries, roles, sources, urgency });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: 'Demand signal summary failed', details: error?.message }, { status: 500 });
    }
}
