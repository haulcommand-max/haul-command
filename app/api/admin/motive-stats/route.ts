/**
 * HAUL COMMAND — Admin Motive Stats API
 * GET /api/admin/motive-stats
 */
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = getSupabaseAdmin();

  const [connResult, webhookResult, syncResult, errorResult] = await Promise.all([
    supabase.from('motive_connections').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('motive_webhook_events').select('id', { count: 'exact', head: true })
      .gte('occurred_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('motive_connections').select('last_sync_at').eq('status', 'active')
      .order('last_sync_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('motive_webhook_events').select('id', { count: 'exact', head: true })
      .not('error', 'is', null),
  ]);

  return NextResponse.json({
    connectedCount: connResult.count || 0,
    webhookEventsLast24h: webhookResult.count || 0,
    lastSyncAt: syncResult.data?.last_sync_at || null,
    syncErrors: errorResult.count || 0,
  });
}
