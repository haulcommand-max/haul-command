export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * POST /api/cron/directory-rehydrate
 * 
 * Daily full rehydration of directory_drivers from all entity sources.
 * Guarantees zero orphans. Logs to pipeline_runs for auditing.
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
        const { data, error } = await svc.rpc('run_directory_rehydration');

        if (error) {
            return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
        }

        // Check assertion: orphans must be zero
        if (data?.orphans_remaining > 0) {
            return NextResponse.json({
                status: 'warning',
                message: `Rehydration complete but ${data.orphans_remaining} orphans remain`,
                data,
            }, { status: 207 });
        }

        return NextResponse.json({ status: 'success', data });
    } catch (err: any) {
        return NextResponse.json({ status: 'error', error: err?.message }, { status: 500 });
    }
}
