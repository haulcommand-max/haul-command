// components/motive/AdminMotiveStats.tsx
// Admin dashboard panel showing Motive connection statistics

'use client';

import { useState, useEffect } from 'react';

interface MotiveStats {
  motive: {
    total_connections: number;
    active_connections: number;
    expired_connections: number;
    last_sync_at: string | null;
    webhook_events_24h: number;
    sync_errors: { profile_id: string; errors: any }[];
  };
  live_tracking: {
    operators_broadcasting: number;
  };
  timestamp: string;
}

export default function AdminMotiveStats() {
  const [stats, setStats] = useState<MotiveStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/motive-stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#8b949e', padding: 16 }}>Loading Motive stats...</div>;

  return (
    <div style={{
      background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 20 }}>📡</span>
        <h3 style={{ margin: 0, fontSize: 16, color: '#e0e0e6' }}>Motive Integration</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Active Connections', value: stats?.motive.active_connections || 0, color: '#22c55e' },
          { label: 'Webhooks (24h)', value: stats?.motive.webhook_events_24h || 0, color: '#00ccff' },
          { label: 'Live Broadcasting', value: stats?.live_tracking.operators_broadcasting || 0, color: '#ff9500' },
          { label: 'Sync Errors', value: stats?.motive.sync_errors?.length || 0, color: stats?.motive.sync_errors?.length ? '#ef4444' : '#8b949e' },
        ].map((item, i) => (
          <div key={i} style={{ background: '#0d1117', borderRadius: 8, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#8b949e', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      {stats?.motive.last_sync_at && (
        <div style={{ fontSize: 11, color: '#8b949e' }}>
          Last sync: {new Date(stats.motive.last_sync_at).toLocaleString()}
        </div>
      )}

      {stats?.motive.sync_errors && stats.motive.sync_errors.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <h4 style={{ fontSize: 12, color: '#ef4444', margin: '0 0 8px' }}>Sync Errors</h4>
          {stats.motive.sync_errors.map((err, i) => (
            <div key={i} style={{
              padding: '6px 10px', background: '#ef444410', borderRadius: 4,
              fontSize: 11, color: '#f87171', marginBottom: 4,
            }}>
              Profile: {err.profile_id?.slice(0, 8)}... — {JSON.stringify(err.errors)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
