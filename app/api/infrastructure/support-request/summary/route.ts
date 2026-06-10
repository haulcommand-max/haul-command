import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function readView(name: string) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from(name).select('*');
    return { data: data || [], error: error?.message || null };
}

export async function GET() {
    try {
        const [typeCounts, statusCounts, urgencyCounts, countryCounts] = await Promise.all([
            readView('v_hc_support_type_counts'),
            readView('v_hc_support_status_counts'),
            readView('v_hc_support_urgency_counts'),
            readView('v_hc_support_request_by_country'),
        ]);

        return NextResponse.json({
            ok: true,
            type_counts: typeCounts.data,
            status_counts: statusCounts.data,
            urgency_counts: urgencyCounts.data,
            country_counts: countryCounts.data,
            errors: [typeCounts.error, statusCounts.error, urgencyCounts.error, countryCounts.error].filter(Boolean),
        });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: 'Support request summary failed', details: error?.message }, { status: 500 });
    }
}
