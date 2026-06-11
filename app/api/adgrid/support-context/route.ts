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
        const [support, scarcity, urgency] = await Promise.all([
            readRows('v_hc_adgrid_support_context'),
            readRows('v_hc_adgrid_scarcity_context'),
            readRows('v_hc_adgrid_urgency_context'),
        ]);

        return NextResponse.json({ ok: true, support, scarcity, urgency });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: 'AdGrid support context query failed', details: error?.message }, { status: 500 });
    }
}
