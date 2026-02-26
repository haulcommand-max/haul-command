import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/ops/acknowledge
 * Mark an ops event as acknowledged.
 */

export async function POST(req: NextRequest) {
    const secret = req.headers.get('x-ops-secret') || req.headers.get('authorization')?.replace('Bearer ', '');
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event_id } = await req.json();
    if (!event_id) {
        return NextResponse.json({ error: 'event_id required' }, { status: 400 });
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { error } = await supabase
        .from('ops_events')
        .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
        .eq('id', event_id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
