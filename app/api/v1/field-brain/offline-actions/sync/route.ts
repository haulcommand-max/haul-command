import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /v1/field-brain/offline-actions/sync — Sync offline actions from device
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
    try {
        const db = supabase();
        const body = await req.json();
        const { device_id, actions, user_id } = body;

        if (!device_id || !actions || !Array.isArray(actions)) {
            return NextResponse.json(
                { error: 'device_id and actions array required' },
                { status: 400 },
            );
        }

        const rows = actions.map((a: any) => ({
            device_id,
            user_id: user_id || null,
            action_type: a.action_type,
            payload: a.payload || {},
            recorded_at: a.recorded_at || new Date().toISOString(),
            synced_at: new Date().toISOString(),
            processing_status: 'pending',
        }));

        const { error } = await db.from('hc_offline_actions').insert(rows);

        if (error) throw error;

        // Create sync job record
        await db.from('hc_device_sync_jobs').insert({
            device_id,
            user_id: user_id || '00000000-0000-0000-0000-000000000000',
            sync_type: 'actions_only',
            status: 'completed',
            actions_uploaded: rows.length,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
        });

        return NextResponse.json({ imported: rows.length });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
