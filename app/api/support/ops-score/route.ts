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
        const [scores, highPriority, counts] = await Promise.all([
            readRows('v_hc_support_operational_score'),
            readRows('v_hc_support_high_priority_ops'),
            readRows('v_hc_support_ops_score_counts'),
        ]);

        return NextResponse.json({ ok: true, scores, highPriority, counts });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: 'Support ops score query failed', details: error?.message }, { status: 500 });
    }
}
