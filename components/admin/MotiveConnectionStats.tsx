'use client';

import { useEffect, useState } from 'react';

interface MotiveStats {
  connectedCount: number;
  lastSyncAt: string | null;
  webhookEventsLast24h: number;
  syncErrors: number;
}

export function MotiveConnectionStats() {
  const [stats, setStats] = useState<MotiveStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/motive-stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-32 bg-gray-800/50 rounded-xl" />;
  if (!stats) return null;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-6">
      <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        Motive Integration
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Connected Operators" value={stats.connectedCount} color="emerald" />
        <StatCard label="Webhook Events (24h)" value={stats.webhookEventsLast24h} color="blue" />
        <StatCard label="Sync Errors" value={stats.syncErrors} color={stats.syncErrors > 0 ? 'red' : 'emerald'} />
        <div className="bg-gray-800/60 rounded-lg p-3">
          <p className="text-gray-400 text-xs font-medium mb-1">Last Sync</p>
          <p className="text-white text-sm font-semibold">
            {stats.lastSyncAt ? new Date(stats.lastSyncAt).toLocaleString() : 'Never'}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-400', blue: 'text-blue-400', red: 'text-red-400', amber: 'text-amber-400',
  };
  return (
    <div className="bg-gray-800/60 rounded-lg p-3">
      <p className="text-gray-400 text-xs font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colors[color] || 'text-white'}`}>{value}</p>
    </div>
  );
}
