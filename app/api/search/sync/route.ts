// app/api/search/sync/route.ts
// POST — trigger full or incremental Typesense sync
// GET  — check sync status
// ============================================================

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { fullSync, incrementalSync, ensureCollection } from '@/lib/typesense/sync';
import { isEnabled } from '@/lib/feature-flags';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    if (!isEnabled('TYPESENSE')) {
        return NextResponse.json({ error: 'Typesense is not enabled' }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'incremental';
    const since = body.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const start = Date.now();

    if (mode === 'full') {
        const result = await fullSync();
        return NextResponse.json({
            ok: true,
            mode: 'full',
            ...result,
            duration_ms: Date.now() - start,
        });
    }

    const result = await incrementalSync(since);
    return NextResponse.json({
        ok: true,
        mode: 'incremental',
        since,
        ...result,
        duration_ms: Date.now() - start,
    });
}

export async function GET() {
    if (!isEnabled('TYPESENSE')) {
        return NextResponse.json({
            enabled: false,
            message: 'Typesense is not enabled. Set TYPESENSE_API_KEY env var.',
        });
    }

    const collectionReady = await ensureCollection();

    return NextResponse.json({
        enabled: true,
        collection_ready: collectionReady,
        config: {
            host: process.env.TYPESENSE_HOST || 'not set',
            port: process.env.TYPESENSE_PORT || '8108',
            has_admin_key: !!process.env.TYPESENSE_ADMIN_KEY,
            has_search_key: !!process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY,
        },
    });
}
