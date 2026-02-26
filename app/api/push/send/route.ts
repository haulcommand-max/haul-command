export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sendPushToUser } from '@/lib/push-send';
import { createClient } from '@supabase/supabase-js';
import { trackServer } from '@/lib/telemetry';

export async function POST(req: Request) {
    // Auth guard: require valid Bearer JWT + admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Validate caller's JWT
    const anonClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Require admin role
    const role = user.user_metadata?.role as string | undefined;
    if (role !== 'admin' && role !== 'super_admin') {
        await trackServer('api_error', { user_id: user.id, role, route: '/api/push/send', status_code: 403, metadata: { reason: 'insufficient_role' } });
        return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 });
    }

    const { user_id, payload } = await req.json();
    if (!user_id || !payload) {
        return NextResponse.json({ error: 'Bad request — missing user_id or payload' }, { status: 400 });
    }

    try {
        const result = await sendPushToUser(user_id, payload);

        // Track push send for delivery rate measurement
        await trackServer('push_sent', {
            user_id: user.id,
            role,
            entity_type: 'user',
            entity_id: user_id,
            client: 'api',
            route: '/api/push/send',
            status_code: 200,
            metadata: { payload_type: payload?.type ?? 'manual' }
        });

        return NextResponse.json(result);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        await trackServer('push_failed', { user_id: user.id, entity_id: user_id, route: '/api/push/send', status_code: 500, metadata: { error: msg } });
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
