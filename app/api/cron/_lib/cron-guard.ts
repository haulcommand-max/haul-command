import { headers } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { getInternalRequestAuthFailure } from '@/lib/security/internal-request-auth';

// ── Supabase admin client ─────────────────────────────────────────────────
export function supabaseAdmin() {
    return getSupabaseAdmin();
}

// ── Guard — call at the start of every cron route ─────────────────────────
// Returns null if authorized, or a 401 NextResponse if not.
export async function cronGuard(): Promise<NextResponse | null> {
    const headersList = await headers();
    return getInternalRequestAuthFailure({ headers: headersList } as Request);
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
