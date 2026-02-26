export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ─────────────────────────────────────────────────
// POST /api/admin/directory/seeds/process
// Trigger bulk processing of all pending seed entries
// Body: { limit?: number } (default 100)
// ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const limit = body.limit ?? 100;

    const { data, error } = await supabase.rpc('bulk_process_seeds', { p_limit: limit });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ result: data });
}
