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
        const [quoteStages, quoteCounts, quoteRows, contactCountry, contactType, bookingStages, bookingCounts, dispatchStage] = await Promise.all([
            readRows('v_hc_quote_revenue_stage'),
            readRows('v_hc_quote_revenue_counts'),
            readRows('v_hc_quote_queue_rows'),
            readRows('v_hc_contact_pipeline_country'),
            readRows('v_hc_contact_pipeline_type'),
            readRows('v_hc_booking_revenue_stage'),
            readRows('v_hc_booking_revenue_counts'),
            readRows('v_hc_dispatch_stage'),
        ]);

        return NextResponse.json({ ok: true, quoteStages, quoteCounts, quoteRows, contactCountry, contactType, bookingStages, bookingCounts, dispatchStage });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: 'Revenue pipeline query failed', details: error?.message }, { status: 500 });
    }
}
