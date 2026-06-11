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
        const [summary, cleanInternal, spamReview, readyForMatching, readyForUnlock, missingLocation, duplicates] = await Promise.all([
            readRows('v_hc_support_request_summary_rows'),
            readRows('v_hc_support_request_clean_internal'),
            readRows('v_hc_support_request_spam_review'),
            readRows('v_hc_support_request_ready_for_matching'),
            readRows('v_hc_support_request_ready_for_unlock'),
            readRows('v_hc_support_missing_location'),
            readRows('v_hc_support_request_duplicates'),
        ]);

        return NextResponse.json({ ok: true, summary, cleanInternal, spamReview, readyForMatching, readyForUnlock, missingLocation, duplicates });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: 'Support request review query failed', details: error?.message }, { status: 500 });
    }
}
