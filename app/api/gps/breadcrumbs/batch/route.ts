/**
 * HAUL COMMAND - GPS Breadcrumbs Batch Upload API
 * POST /api/gps/breadcrumbs/batch
 *
 * GPS breadcrumbs are proof/dispute evidence. The route must bind writes to
 * the authenticated operator and to jobs assigned to that operator before the
 * service-role proof engine performs geofence/escrow side effects.
 */
import { NextRequest, NextResponse } from 'next/server';
import { GPSProofEngine } from '@/lib/escrow/gps-engine';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const MAX_BATCH_SIZE = 250;

interface BreadcrumbInput {
  job_id?: string;
  operator_id?: string;
  lat?: number;
  lng?: number;
  accuracy_m?: number;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { breadcrumbs } = await req.json();
    if (!Array.isArray(breadcrumbs) || breadcrumbs.length === 0) {
      return NextResponse.json({ error: 'No breadcrumbs provided' }, { status: 400 });
    }
    if (breadcrumbs.length > MAX_BATCH_SIZE) {
      return NextResponse.json({ error: `Maximum ${MAX_BATCH_SIZE} breadcrumbs per batch` }, { status: 413 });
    }

    const results: Array<{ job_id: string; outcome: string | false }> = [];
    const rejected: Array<{ job_id: string; reason: string }> = [];
    const authorizedJobs = new Map<string, boolean>();

    for (const b of breadcrumbs as BreadcrumbInput[]) {
      if (!b.job_id || !isFiniteNumber(b.lat) || !isFiniteNumber(b.lng) || !isFiniteNumber(b.accuracy_m)) {
        rejected.push({ job_id: b.job_id ?? 'unknown', reason: 'job_id, lat, lng, and accuracy_m are required' });
        continue;
      }

      if (b.operator_id && b.operator_id !== user.id) {
        rejected.push({ job_id: b.job_id, reason: 'operator_id must match the authenticated user' });
        continue;
      }

      if (!authorizedJobs.has(b.job_id)) {
        const { data: job } = await supabase
          .from('jobs')
          .select('id')
          .eq('id', b.job_id)
          .eq('assigned_operator_id', user.id)
          .maybeSingle();
        authorizedJobs.set(b.job_id, Boolean(job));
      }

      if (!authorizedJobs.get(b.job_id)) {
        rejected.push({ job_id: b.job_id, reason: 'job is not assigned to the authenticated operator' });
        continue;
      }

      if (b.accuracy_m > 50) {
        rejected.push({ job_id: b.job_id, reason: `accuracy_m=${b.accuracy_m} exceeds 50m threshold` });
        continue;
      }

      const outcome = await GPSProofEngine.recordBreadcrumb(
        b.job_id,
        user.id,
        b.lat,
        b.lng,
        b.accuracy_m,
      );

      results.push({ job_id: b.job_id, outcome: outcome || 'RECORDED' });
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      rejected: rejected.length,
      results,
      rejected_detail: rejected,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[GPS Breadcrumbs] Error:', message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
