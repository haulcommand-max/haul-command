import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// ── Supabase admin client ─────────────────────────────────────────────────
export function supabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

// ── Guard — call at the start of every cron route ─────────────────────────
// Returns null if authorized, or a 401 NextResponse if not.
export async function cronGuard(): Promise<NextResponse | null> {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Vercel sends: Authorization: Bearer <CRON_SECRET>
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return null;
}

// ── Job logger ────────────────────────────────────────────────────────────
export async function logCronRun(
    jobId: string,
    startMs: number,
    status: 'success' | 'failed' | 'skipped',
    opts: { rows_affected?: number; error_message?: string; metadata?: Record<string, unknown> } = {}
) {
    const sb = supabaseAdmin();
    await sb.from('cron_job_log').insert({
        job_id: jobId,
        status,
        duration_ms: Date.now() - startMs,
        rows_affected: opts.rows_affected ?? 0,
        error_message: opts.error_message ?? null,
        metadata: opts.metadata ?? {},
    });
}

// ── Dead letter writer ────────────────────────────────────────────────────
export async function deadLetter(
    jobId: string,
    payload: unknown,
    error: string
) {
    const sb = supabaseAdmin();
    await sb.from('cron_dead_letters').insert({ job_id: jobId, payload, error });
}
