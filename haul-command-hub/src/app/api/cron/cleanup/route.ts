/**
 * POST /api/cron/cleanup
 *
 * Periodic cleanup cron job. Runs via Vercel Cron or external scheduler.
 * - Purges stale operator locations (> 5 minutes old)
 * - Cleans up old breadcrumbs (> 30 days)
 * - Removes processed webhook events (> 7 days)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sb = supabaseServer();
    const results: Record<string, string> = {};

    // 1. Clean stale operator locations
    const { error: locError } = await sb
      .from('operator_locations')
      .delete()
      .lt('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());
    results.operator_locations = locError ? `error: ${locError.message}` : 'cleaned';

    // 2. Clean old breadcrumbs (> 30 days)
    const { error: crumbError } = await sb
      .from('gps_breadcrumbs')
      .delete()
      .lt('recorded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    results.gps_breadcrumbs = crumbError ? `error: ${crumbError.message}` : 'cleaned';

    // 3. Clean processed Stripe events (> 7 days)
    const { error: stripeError } = await sb
      .from('stripe_webhook_events')
      .delete()
      .eq('processed', true)
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    results.stripe_webhook_events = stripeError ? `error: ${stripeError.message}` : 'cleaned';

    // 4. Clean processed Motive events (> 7 days)
    const { error: motiveError } = await sb
      .from('motive_webhook_events')
      .delete()
      .eq('processed', true)
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    results.motive_webhook_events = motiveError ? `error: ${motiveError.message}` : 'cleaned';

    console.log('[Cron Cleanup] Results:', results);
    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error('[Cron Cleanup] Error:', err);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'haul-command-cleanup-cron',
    description: 'Purges stale locations, old breadcrumbs, processed webhook events',
  });
}
