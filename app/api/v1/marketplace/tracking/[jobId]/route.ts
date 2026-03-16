// app/api/v1/marketplace/tracking/[jobId]/route.ts
// GET — get live positions for a job
// GET ?history=true&from=...&to=... — get route history
// ============================================================

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getJobLivePositions, getJobRouteHistory } from '@/lib/telematics/job-tracking';
import { isEnabled } from '@/lib/feature-flags';

export const runtime = 'nodejs';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    const { jobId } = await params;

    if (!isEnabled('TRACCAR')) {
        return NextResponse.json({
            enabled: false,
            message: 'Tracking is not enabled. Deploy Traccar and set TRACCAR_API_URL.',
        });
    }

    const url = new URL(req.url);
    const history = url.searchParams.get('history') === 'true';

    if (history) {
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');

        if (!from || !to) {
            return NextResponse.json({ error: 'from and to params required for history' }, { status: 400 });
        }

        const routes = await getJobRouteHistory(jobId, new Date(from), new Date(to));
        return NextResponse.json({
            job_id: jobId,
            mode: 'history',
            routes,
            device_count: Object.keys(routes).length,
        });
    }

    const positions = await getJobLivePositions(jobId);
    return NextResponse.json({
        job_id: jobId,
        mode: 'live',
        positions,
        device_count: positions.length,
        timestamp: new Date().toISOString(),
    });
}
