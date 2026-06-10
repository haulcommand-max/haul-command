import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || '50'), 100);

    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('v_hc_intent_to_dispatch_opportunities')
            .select('*')
            .order('activation_score', { ascending: false })
            .limit(limit);

        if (error) {
            return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
        }

        return NextResponse.json({ ok: true, opportunities: data || [], limit });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: 'Intent opportunity query failed', details: error?.message }, { status: 500 });
    }
}
