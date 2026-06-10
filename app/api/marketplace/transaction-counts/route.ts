import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function countView(name: string) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from(name).select('*').maybeSingle();
    return { name, rows: data?.rows ?? 0, error: error?.message || null };
}

export async function GET() {
    try {
        const counts = await Promise.all([
            countView('v_hc_quote_request_count'),
            countView('v_hc_lead_unlock_count'),
            countView('v_hc_dispatch_job_count'),
            countView('v_hc_dispatch_match_count'),
            countView('v_hc_booking_count'),
            countView('v_hc_wallet_ledger_count'),
        ]);

        return NextResponse.json({ ok: true, counts });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: 'Transaction count query failed', details: error?.message }, { status: 500 });
    }
}
