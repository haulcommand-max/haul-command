import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('v_hc_unlock_rows').select('*').limit(100);
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
        return NextResponse.json({ ok: true, rows: data || [] });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: 'Contact pipeline query failed', details: error?.message }, { status: 500 });
    }
}
