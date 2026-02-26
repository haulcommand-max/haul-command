export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * POST /api/cron/directory-incremental
 * 
 * Runs every 15 minutes. Only re-indexes entities updated in the last 20 min.
 * Prevents drift between source tables and search index.
 */

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

export async function POST(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const svc = getSupabase();

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
