import React from 'react';
import { supabaseServer } from '@/lib/supabase/server';
import Link from 'next/link';
import { Zap, DollarSign, Clock, TrendingUp, User, RefreshCw } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   /admin/ads — Admin Ads Dashboard
   Shows all active boosts, revenue per day, operator info, expiry
   ═══════════════════════════════════════════════════════════════════ */

export const metadata = {
  title: 'Ad Boosts — Admin | Haul Command',
};

interface BoostRow {
  id: string;
  profile_id: string;
  duration_days: number;
  amount_cents: number;
  status: string;
  starts_at: string;
  expires_at: string;
  created_at: string;
  profiles?: { full_name: string; city: string; state: string } | null;
}

export default async function AdminAdsPage() {
  const sb = supabaseServer();

  let boosts: BoostRow[] = [];
  let totalRevenue = 0;
  let activeCount = 0;

  try {
    const { data } = await sb
      .from('ad_boosts')
      .select('*, profiles!profile_id(full_name, city, state)')
      .order('created_at', { ascending: false })
      .limit(100);

    boosts = (data ?? []) as BoostRow[];
    totalRevenue = boosts
      .filter(b => b.status === 'active' || b.status === 'completed')
      .reduce((sum, b) => sum + (b.amount_cents || 0), 0);
    activeCount = boosts.filter(b => b.status === 'active' && new Date(b.expires_at) > new Date()).length;
  } catch {
    // Table may not exist yet
  }

  const thirtyDaysAgo = Date.now() - 30 * 86400000;
  const recentRevenue = boosts
    .filter(b => new Date(b.created_at).getTime() > thirtyDaysAgo && (b.status === 'active' || b.status === 'completed'))
    .reduce((sum, b) => sum + (b.amount_cents || 0), 0);
  const dailyAvg = Math.round(recentRevenue / 30);

  return (
    <div className="min-h-screen bg-hc-bg text-hc-text p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-hc-gold-500" />
              <span className="text-xs font-bold text-hc-gold-500 uppercase tracking-widest">AdGrid Boosts</span>
            </div>
            <h1 className="text-2xl font-black">Boost Revenue Dashboard</h1>
          </div>
          <Link href="/admin" className="text-xs font-bold text-hc-muted hover:text-white transition-colors">← Back to Admin</Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Revenue', value: `$${(totalRevenue / 100).toLocaleString()}`, icon: DollarSign, color: '#22c55e' },
            { label: 'Active Boosts', value: String(activeCount), icon: Zap, color: '#f5b942' },
            { label: 'Daily Avg', value: `$${(dailyAvg / 100).toFixed(0)}/day`, icon: TrendingUp, color: '#3ba4ff' },
            { label: 'Total Boosts', value: String(boosts.length), icon: RefreshCw, color: '#a78bfa' },
          ].map(stat => (
            <div key={stat.label} className="bg-hc-surface border border-hc-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={14} style={{ color: stat.color }} />
                <span className="text-[10px] font-bold text-hc-subtle uppercase tracking-widest">{stat.label}</span>
              </div>
              <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-hc-surface border border-hc-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-hc-border">
            <h2 className="text-lg font-bold">All Boosts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hc-border text-hc-subtle text-[10px] uppercase tracking-widest">
                  <th className="text-left p-4">Operator</th>
                  <th className="text-left p-4">Duration</th>
                  <th className="text-left p-4">Amount</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Expires</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {boosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-hc-muted">
                      No boosts yet. Operators can boost from{' '}
                      <Link href="/boost" className="text-hc-gold-500 underline">/boost</Link>
                    </td>
                  </tr>
                ) : (
                  boosts.map(boost => {
                    const isExpired = new Date(boost.expires_at) < new Date();
                    const status = isExpired ? 'expired' : boost.status;
                    const statusColors: Record<string, string> = {
                      active: '#22c55e', pending: '#f59e0b', expired: '#6b7280', completed: '#3ba4ff',
                    };
                    return (
                      <tr key={boost.id} className="border-b border-hc-border/50 hover:bg-white/[0.02]">
                        <td className="p-4">
                          <div className="font-bold text-white">{(boost.profiles as any)?.full_name || 'Unknown'}</div>
                          <div className="text-[11px] text-hc-subtle">{(boost.profiles as any)?.city}, {(boost.profiles as any)?.state}</div>
                        </td>
                        <td className="p-4 text-hc-muted font-bold">{boost.duration_days} days</td>
                        <td className="p-4"><span className="font-mono font-bold text-hc-gold-500">${(boost.amount_cents / 100).toFixed(0)}</span></td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: statusColors[status] || '#6b7280', background: `${statusColors[status] || '#6b7280'}15`, border: `1px solid ${statusColors[status] || '#6b7280'}30` }}>
                            {status}
                          </span>
                        </td>
                        <td className="p-4 text-hc-muted text-xs">{new Date(boost.expires_at).toLocaleDateString()}</td>
                        <td className="p-4">
                          {status === 'expired' && (
                            <Link href="/boost" className="text-[11px] font-bold text-hc-gold-500 hover:underline">Renew →</Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
