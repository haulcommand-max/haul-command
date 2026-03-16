export const dynamic = 'force-dynamic';

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

/**
 * POST /api/cron/directory-incremental
 * 
 * Runs every 15 minutes. Only re-indexes entities updated in the last 20 min.
 * Prevents drift between source tables and search index.
 */

export async function POST(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const svc = getSupabaseAdmin();

    try {
        const { data, error } = await svc.rpc('incremental_directory_update');

        if (error) {
            return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
        }

        return NextResponse.json({ status: 'success', data });
    } catch (err: any) {
        return NextResponse.json({ status: 'error', error: err?.message }, { status: 500 });
    }
}
