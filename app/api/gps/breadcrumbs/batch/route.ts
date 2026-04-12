/**
 * HAUL COMMAND — GPS Breadcrumbs Batch Upload API
 * POST /api/gps/breadcrumbs/batch
 *
 * OPUS-02 S2-04: GPS Proof Engine Integration.
 * - Accuracy hard-stop: rejects breadcrumbs with accuracy > 50m
 * - Geofence match: triggers job_milestones.gps_verified on 500m hit
 * - Downstream: sets hc_escrows.status = 'DELIVERED_HOLDBACK' on delivery
 */
import { NextRequest, NextResponse } from 'next/server';
import { GPSProofEngine } from '@/lib/escrow/gps-engine';

export const runtime = 'nodejs';

interface BreadcrumbInput {
  job_id: string;
  operator_id: string;
  lat: number;
  lng: number;
  accuracy_m: number;
  heading?: number;
  speed?: number;
  timestamp?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { breadcrumbs } = await req.json();
    if (!Array.isArray(breadcrumbs) || breadcrumbs.length === 0) {
      return NextResponse.json({ error: 'No breadcrumbs provided' }, { status: 400 });
    }

    const results: Array<{ job_id: string; outcome: string | false }> = [];
    const rejected: Array<{ job_id: string; reason: string }> = [];

    for (const b of breadcrumbs as BreadcrumbInput[]) {
      // OPUS-02: Accuracy hard-stop — reject if > 50m
      if (!b.accuracy_m || b.accuracy_m > 50) {
        rejected.push({ job_id: b.job_id, reason: `accuracy_m=${b.accuracy_m} exceeds 50m threshold` });
        continue;
      }

      // Route through GPSProofEngine: inserts breadcrumb + triggers geofence validation
      const outcome = await GPSProofEngine.recordBreadcrumb(
        b.job_id,
        b.operator_id,
        b.lat,
        b.lng,
        b.accuracy_m
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
  } catch (err: any) {
    console.error('[GPS Breadcrumbs] Error:', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
