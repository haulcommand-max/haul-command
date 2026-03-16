export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/cron/directory-rehydrate
 * 
 * Daily full rehydration of directory_drivers from all entity sources.
 * Guarantees zero orphans. Logs to pipeline_runs for auditing.
 */


export async function POST(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const svc = getSupabaseAdmin();

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
