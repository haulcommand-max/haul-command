// app/api/admin/motive-stats/route.ts
// Admin dashboard: Motive connection stats

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();

  const [connectionsRes, webhookRes, errorsRes, locationsRes] = await Promise.all([
    supabase
      .from('motive_connections')
      .select('id, status, last_synced_at, connected_at, sync_errors', { count: 'exact' }),
    supabase
      .from('motive_webhook_events')
      .select('id', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('motive_connections')
      .select('id, profile_id, sync_errors')
      .not('sync_errors', 'is', null),
    supabase
      .from('operator_locations')
      .select('operator_id', { count: 'exact' })
      .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()),
  ]);

  const connections = connectionsRes.data || [];
  const active = connections.filter((c: any) => c.status === 'active').length;
  const expired = connections.filter((c: any) => c.status === 'expired').length;
  const lastSync = connections
    .map((c: any) => c.last_synced_at)
    .filter(Boolean)
    .sort()
    .pop();

  return NextResponse.json({
    motive: {
      total_connections: connections.length,
      active_connections: active,
      expired_connections: expired,
      last_sync_at: lastSync || null,
      webhook_events_24h: webhookRes.count || 0,
      sync_errors: (errorsRes.data || []).map((e: any) => ({
        profile_id: e.profile_id,
        errors: e.sync_errors,
      })),
    },
    live_tracking: {
      operators_broadcasting: locationsRes.count || 0,
    },
    timestamp: new Date().toISOString(),
  });
}
