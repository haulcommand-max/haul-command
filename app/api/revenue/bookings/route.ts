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
        const [open, active, completed, lost, stages, counts] = await Promise.all([
            readRows('v_hc_revenue_open_bookings'),
            readRows('v_hc_revenue_active_bookings'),
            readRows('v_hc_revenue_completed_bookings'),
            readRows('v_hc_revenue_lost_bookings'),
            readRows('v_hc_booking_revenue_stage'),
            readRows('v_hc_booking_revenue_counts'),
        ]);

        return NextResponse.json({ ok: true, open, active, completed, lost, stages, counts });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: 'Booking revenue query failed', details: error?.message }, { status: 500 });
    }
}
