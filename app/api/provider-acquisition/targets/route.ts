import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('v_hc_provider_recruitment_priority')
            .select('*')
            .limit(200);

        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
        return NextResponse.json({ ok: true, targets: data || [] });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: 'Provider recruitment targets failed', details: error?.message }, { status: 500 });
    }
}
