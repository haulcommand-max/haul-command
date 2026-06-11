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
        const [summary, emptyPipes, activePipes] = await Promise.all([
            readRows('v_hc_revenue_gap_summary'),
            readRows('v_hc_revenue_empty_pipes'),
            readRows('v_hc_revenue_active_pipes'),
        ]);

        return NextResponse.json({ ok: true, summary, emptyPipes, activePipes });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: 'Revenue gap summary failed', details: error?.message }, { status: 500 });
    }
}
