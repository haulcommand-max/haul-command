/**
 * Motive Sync Cron Job — HAUL COMMAND
 *
 * POST /api/cron/motive-sync
 *
 * Triggered by Vercel Cron or GitHub Actions data-jobs.yml
 * Syncs vehicles, drivers, locations, HOS from all connected Motive accounts.
 *
 * Schedule: Every 15 minutes (*/15 * * * *)
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncAllMotiveConnections } from '@/lib/motive/sync';

// Vercel cron config
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Motive Cron] Starting sync...');
    const results = await syncAllMotiveConnections();

    const summary = {
      timestamp: new Date().toISOString(),
      connections_synced: results.length,
      total_vehicles: results.reduce((sum, r) => sum + r.vehicles_synced, 0),
      total_drivers: results.reduce((sum, r) => sum + r.drivers_synced, 0),
      total_locations: results.reduce((sum, r) => sum + r.locations_synced, 0),
      total_errors: results.reduce((sum, r) => sum + r.errors.length, 0),
    };

    console.log('[Motive Cron] Complete:', JSON.stringify(summary));
    return NextResponse.json(summary);
  } catch (err: any) {
    console.error('[Motive Cron] Fatal error:', err.message);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

// Also support GET for manual triggers
export async function GET(request: NextRequest) {
  return POST(request);
}
