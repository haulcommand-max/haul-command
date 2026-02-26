export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { trackServer } from '@/lib/telemetry';

/**
 * GET /api/loads/[id]/shortlist
 * Blocker #4: Wire BrokerShortlist RPC to a real API route.
 * Returns ranked escort candidates for a given load.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const start = Date.now();
    const { id: load_id } = await params;

    const supabase = createClient();

    // Verify caller is authenticated
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify caller owns this load or is admin
    const { data: load } = await supabase
        .from('loads')
        .select('id, broker_id, status')
        .eq('id', load_id)
        .single();

    if (!load) {
        return NextResponse.json({ error: 'Load not found' }, { status: 404 });
    }
    const role = user.user_metadata?.role as string | undefined;
    if (load.broker_id !== user.id && role !== 'admin' && role !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Call the shortlist RPC
    const { data, error } = await supabase.rpc('generate_broker_shortlist', {
        p_load_id: load_id,
        p_limit: 20,
    });

    if (error) {
        await trackServer('api_error', {
            user_id: user.id,
            entity_type: 'load',
            entity_id: load_id,
            route: `/api/loads/${load_id}/shortlist`,
            status_code: 500,
            metadata: { error: error.message }
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await trackServer('shortlist_generated', {
        user_id: user.id,
        entity_type: 'load',
        entity_id: load_id,
        latency_ms: Date.now() - start,
        route: `/api/loads/${load_id}/shortlist`,
        status_code: 200,
        metadata: { candidate_count: Array.isArray(data) ? data.length : 0 }
    });

    return NextResponse.json({
        load_id,
        candidates: data ?? [],
        generated_at: new Date().toISOString(),
        latency_ms: Date.now() - start,
    });
}
