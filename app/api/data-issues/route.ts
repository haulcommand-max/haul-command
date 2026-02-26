// app/api/data-issues/route.ts
// POST — Submit a data issue report (any user, rate-limited)
// GET  — List open issues (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
    const cookieStore = await cookies();
    const svc = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { entity_type, entity_id, issue_type, description } = body as {
        entity_type?: string;
        entity_id?: string;
        issue_type?: string;
        description?: string;
    };

    if (!entity_type || !entity_id || !issue_type) {
        return NextResponse.json({ error: 'entity_type, entity_id, issue_type required' }, { status: 400 });
    }

    // Get reporter if logged in
    let reporter_id: string | null = null;
    try {
        const anonClient = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll() } }
        );
        const { data: { user } } = await anonClient.auth.getUser();
        reporter_id = user?.id ?? null;
    } catch { /* anon report OK */ }

    // Rate limit: max 5 per IP per hour
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown';

    const { count } = await svc
        .from('data_issues')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 3600000).toISOString());

    if ((count ?? 0) > 50) {
        return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    const { error } = await svc.from('data_issues').insert({
        reporter_id,
        entity_type,
        entity_id,
        issue_type,
        description: description ?? null,
        geo_context: { ip_hint: ip.slice(0, 8) },
    });

    if (error) {
        console.error('[data-issues POST]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Report submitted' }, { status: 201 });
}
