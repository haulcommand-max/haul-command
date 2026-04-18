import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Fly.io Orchestrator — Background Worker Provisioning
 * POST /api/workers/orchestrator
 * 
 * Auto-scales background workers on Fly.io for autonomous compliance ingestion,
 * web scraping, and heavy background compute tasks.
 * Evaluates queue depths inside Supabase and awakens dormant Fly Machines via the Machines API.
 */

export async function POST(req: Request) {
    try {
        // Must be secured by an internal Cron secret or Auth token
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseAdmin();
        const FLY_API_TOKEN = process.env.FLY_API_TOKEN;
        const FLY_APP_NAME = process.env.FLY_APP_NAME || 'haulcommand-workers';
        const FLY_MACHINE_ID = process.env.FLY_WORKER_MACHINE_ID; // Pre-configured worker machine

        if (!FLY_API_TOKEN || !FLY_MACHINE_ID) {
            console.warn('[Fly] Missing FLY_API_TOKEN or FLY_WORKER_MACHINE_ID. Cannot orchestrate workers.');
            return NextResponse.json({ error: 'Fly orchestration not configured' }, { status: 500 });
        }

        // 1. Evaluate Compliance & Telemetry Queue Depths
        const { count: pendingClaims, error: queueErr } = await supabase
            .from('hc_workflow_queues')
            .select('*', { count: 'exact', head: true })
            .in('queue_name', ['compliance.ingest', 'claim.create_packet'])
            .eq('status', 'pending');

        if (queueErr) {
            console.error('[Fly] Queue Check Error:', queueErr.message);
            return NextResponse.json({ error: 'Failed to access queue' }, { status: 500 });
        }

        const activeQueueDepth = pendingClaims || 0;

        // 2. Orchestration Logic
        // If queue exceeds threshold, awaken the Fly.io background machine.
        // Once the machine finishes the queue, it terminates itself internally.
        const QUEUE_AWAKE_THRESHOLD = 5; 

        if (activeQueueDepth > QUEUE_AWAKE_THRESHOLD) {
            console.log(`[Fly] Queue depth at ${activeQueueDepth}. Threshold ${QUEUE_AWAKE_THRESHOLD} exceeded. Waking Fly Machine: ${FLY_MACHINE_ID}`);

            // Trigger Fly.io Machine State -> START
            const flyRes = await fetch(`https://api.machines.dev/v1/apps/${FLY_APP_NAME}/machines/${FLY_MACHINE_ID}/start`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${FLY_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!flyRes.ok) {
                const flyError = await flyRes.text();
                // 409 usually means the machine is already starting or started
                if (flyRes.status === 409) {
                    return NextResponse.json({ status: 'Machine already awake', activeQueueDepth });
                }
                throw new Error(`Fly API Error: ${flyError}`);
            }

            return NextResponse.json({
                status: 'Fly Machine Wakened',
                machine_id: FLY_MACHINE_ID,
                queue_depth: activeQueueDepth
            });
        }

        return NextResponse.json({ status: 'Queue dormant', queue_depth: activeQueueDepth });

    } catch (e: any) {
        console.error('[Fly Orchestrator Error]:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
