import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('v_hc_available_now_counts')
            .select('*')
            .limit(500);

        if (error) {
            return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
        }

        return NextResponse.json({ ok: true, supply: data || [] });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: 'Available now summary failed', details: error?.message }, { status: 500 });
    }
}
