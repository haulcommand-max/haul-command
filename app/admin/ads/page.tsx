'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AdStat {
  total_revenue: number;
  active_campaigns: number;
  total_impressions: number;
  total_clicks: number;
  avg_ctr: number;
  mrr: number;
  projected_monthly: number;
}

interface Campaign {
  id: string;
  name: string;
  company_name: string;
  plan_type: string;
  status: string;
  plan_monthly_fee: number;
  spend_to_date: number;
  impressions: number;
  clicks: number;
  start_date: string;
}

interface TopPlacement {
  placement: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

const STATUS_COLOR: Record<string, string> = {
  active:          '#00ff88',
  pending_review:  '#f5c842',
  draft:           '#8fa3c0',
  paused:          '#ff9500',
  rejected:        '#ef4444',
  completed:       '#8fa3c0',
};

const PLAN_COLOR: Record<string, string> = {
  run_of_network:       '#00ccff',
  corridor_targeted:    '#f5c842',
  corridor_exclusive:   '#ff9500',
};

export default function AdminAdsPage() {
  const [stats, setStats] = useState<AdStat | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [topPlacements, setTopPlacements] = useState<TopPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview'|'campaigns'|'revenue'>('overview');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, campsRes] = await Promise.all([
          fetch('/api/adgrid/admin-stats'),
          fetch('/api/adgrid/admin-campaigns'),
        ]);
        const statsData = await statsRes.json();
        const campsData = await campsRes.json();
        setStats(statsData.stats);
        setCampaigns(campsData.campaigns || []);
        setTopPlacements(campsData.top_placements || []);
      } catch(e){ console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/adgrid/admin-campaigns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign_id: id, status }),
    });
    setCampaigns(p => p.map(c => c.id === id ? { ...c, status } : c));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#07090f', color: '#e0e0e6', fontFamily: "'Inter',sans-serif" }}>

      {/* Header */}
      <div style={{ background: '#0a0d16', borderBottom: '1px solid #1a223a', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>📣 Ad Revenue Dashboard</h1>
          <div style={{ fontSize: 13, color: '#8fa3c0', marginTop: 4 }}>Haul Command AdGrid OS · Self-serve + internal campaigns</div>
        </div>
        <Link aria-label="Navigation Link" href="/advertise/dashboard" style={{
          background: 'linear-gradient(90deg, #f5c842, #ff9500)', color: '#07090f',
          borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 800, textDecoration: 'none',
        }}>+ New Campaign</Link>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'flex', gap: 14, padding: '20px 28px', borderBottom: '1px solid #1a223a', flexWrap: 'wrap' }}>
          {[
            { val: `$${stats.mrr.toLocaleString()}`, label: 'Monthly Recurring Revenue', color: '#00ff88', sub: 'from active subscriptions' },
            { val: `$${stats.projected_monthly.toLocaleString()}`, label: 'Projected This Month', color: '#f5c842', sub: 'if churn = 0%' },
            { val: stats.active_campaigns, label: 'Active Campaigns', color: '#00ccff', sub: '' },
            { val: `${(stats.total_impressions / 1000).toFixed(1)}K`, label: 'Total Impressions', color: '#e0e0e6', sub: 'all time' },
            { val: `${(stats.avg_ctr * 100).toFixed(2)}%`, label: 'Avg CTR', color: '#a78bfa', sub: 'click-through rate' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '14px 20px',
            }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 12, color: '#f0f4f8', fontWeight: 600, marginTop: 4 }}>{s.label}</div>
              {s.sub && <div style={{ fontSize: 11, color: '#8fa3c0' }}>{s.sub}</div>}
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: '24px 28px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'campaigns', label: '📋 Campaigns' },
            { id: 'revenue', label: '💰 Revenue Projections' },
          ].map(t => (
            <button aria-label="Interactive Button" key={t.id} onClick={() => setTab(t.id as 'overview'|'campaigns'|'revenue')} style={{
              padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: tab === t.id ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: tab === t.id ? '#f0f4f8' : '#8fa3c0',
              borderBottom: tab === t.id ? '2px solid #f5c842' : '2px solid transparent',
            }}>{t.label}</button>
          ))}
        </div>

        {loading && <div style={{ color: '#8fa3c0', textAlign: 'center', padding: 40 }}>Loading...</div>}

        {/* OVERVIEW TAB */}
        {!loading && tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

            {/* Top Placements */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Best Performing Placements</h3>
              {topPlacements.length === 0 && <div style={{ color: '#8fa3c0', fontSize: 13 }}>No data yet</div>}
              {topPlacements.map((p, i) => (
                <div key={p.placement} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < topPlacements.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4f8' }}>{p.placement}</div>
                    <div style={{ fontSize: 11, color: '#8fa3c0' }}>{(p.impressions / 1000).toFixed(1)}K impressions</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, color: '#00ff88', fontWeight: 700 }}>{(p.ctr * 100).toFixed(2)}% CTR</div>
                    <div style={{ fontSize: 11, color: '#8fa3c0' }}>{p.clicks} clicks</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pending Review */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(245,200,66,0.2)', borderRadius: 16, padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#f5c842' }}>⏳ Pending Review</h3>
              {campaigns.filter(c => c.status === 'pending_review').length === 0 && (
                <div style={{ color: '#8fa3c0', fontSize: 13 }}>No pending campaigns</div>
              )}
              {campaigns.filter(c => c.status === 'pending_review').map(c => (
                <div key={c.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#f0f4f8' }}>{c.company_name}</div>
                  <div style={{ fontSize: 12, color: '#8fa3c0' }}>{c.name} · ${c.plan_monthly_fee}/mo</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button aria-label="Interactive Button" onClick={() => updateStatus(c.id, 'active')} style={{
                      background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)',
                      color: '#00ff88', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 700,
                    }}>Approve</button>
                    <button aria-label="Interactive Button" onClick={() => updateStatus(c.id, 'rejected')} style={{
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                      color: '#ef4444', borderRadius: 8, padding: '5px 10px', fontSize: 12, cursor: 'pointer',
                    }}>Reject</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Revenue by plan */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Revenue by Plan Type</h3>
              {[
                { plan: 'Run of Network ($19/mo)', count: campaigns.filter(c => c.plan_type === 'run_of_network' && c.status === 'active').length, rate: 19 },
                { plan: 'Corridor Targeted ($59/mo)', count: campaigns.filter(c => c.plan_type === 'corridor_targeted' && c.status === 'active').length, rate: 59 },
                { plan: 'Exclusive Corridor ($149/mo)', count: campaigns.filter(c => c.plan_type === 'corridor_exclusive' && c.status === 'active').length, rate: 149 },
              ].map(row => (
                <div key={row.plan} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#b0bcd0' }}>{row.plan}</span>
                    <span style={{ color: '#f5c842', fontWeight: 700 }}>${(row.count * row.rate).toLocaleString()}/mo</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#8fa3c0' }}>{row.count} active campaigns</div>
                  <div style={{ marginTop: 4, height: 4, background: '#1a1a28', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${Math.min(row.count * 10, 100)}%`, background: '#f5c842', borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CAMPAIGNS TAB */}
        {!loading && tab === 'campaigns' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {campaigns.length === 0 && <div style={{ color: '#8fa3c0', textAlign: 'center', padding: 40 }}>No campaigns yet. Share /advertise/dashboard with potential advertisers.</div>}
            {campaigns.map(c => (
              <div key={c.id} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#f0f4f8' }}>{c.company_name}</div>
                  <div style={{ fontSize: 13, color: '#8fa3c0' }}>{c.name}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: STATUS_COLOR[c.status] || '#8fa3c0', fontWeight: 700 }}>● {c.status.replace(/_/g,' ')}</span>
                    <span style={{ fontSize: 11, color: PLAN_COLOR[c.plan_type] || '#8fa3c0' }}>{c.plan_type.replace(/_/g,' ')}</span>
                    <span style={{ fontSize: 11, color: '#00ff88', fontWeight: 700 }}>${c.plan_monthly_fee}/mo</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#8fa3c0' }}>{(c.impressions || 0).toLocaleString()} impressions</div>
                  <div style={{ fontSize: 12, color: '#8fa3c0' }}>{(c.clicks || 0).toLocaleString()} clicks</div>
                  <div style={{ fontSize: 12, color: '#f5c842', fontWeight: 700 }}>${(c.spend_to_date || 0).toLocaleString()} spent</div>
                </div>
                {c.status === 'pending_review' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button aria-label="Interactive Button" onClick={() => updateStatus(c.id, 'active')} style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>Approve</button>
                    <button aria-label="Interactive Button" onClick={() => updateStatus(c.id, 'rejected')} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Reject</button>
                  </div>
                )}
                {c.status === 'active' && (
                  <button aria-label="Interactive Button" onClick={() => updateStatus(c.id, 'paused')} style={{ background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.2)', color: '#ff9500', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Pause</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* REVENUE PROJECTIONS TAB */}
        {!loading && tab === 'revenue' && (
          <div style={{ maxWidth: 700 }}>
            <div style={{
              background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)',
              borderRadius: 16, padding: 24, marginBottom: 24,
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#00ff88', margin: '0 0 16px' }}>Revenue Scenarios</h3>
              {[
                { label: '5 RON + 2 Corridor + 1 Exclusive', rev: 5*19 + 2*59 + 1*149 },
                { label: '20 RON + 10 Corridor + 5 Exclusive', rev: 20*19 + 10*59 + 5*149 },
                { label: '50 RON + 25 Corridor + 10 Exclusive', rev: 50*19 + 25*59 + 10*149 },
                { label: '100 RON + 50 Corridor + 20 Exclusive', rev: 100*19 + 50*59 + 20*149 },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 14, color: '#b0bcd0' }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#00ff88' }}>${s.rev.toLocaleString()}/mo</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Best Advertiser Targets</h3>
              {[
                { type: 'Fuel Card Providers', why: 'Every operator needs fuel. 7,700+ targets.', value: '$59–$149/mo', examples: 'EFS, Comdata, WEX, Mudflap' },
                { type: 'Commercial Insurance', why: 'Unverified operators = hot insurance leads.', value: '$59–$149/mo', examples: 'Progressive Commercial, Canal Insurance' },
                { type: 'Equipment Dealers', why: 'New operators need light bars, flags, signs.', value: '$19–$59/mo', examples: 'Truckers Supply, Amazon Business' },
                { type: 'Hotel Chains', why: 'Multi-day corridor operators need lodging.', value: '$19–$59/mo', examples: 'Choice Hotels, Super 8, Motel 6' },
                { type: 'AV Technology Companies', why: 'AV-ready certified operators = AV partners.', value: '$149/mo exclusive', examples: 'Aurora, Kodiak, Waabi' },
              ].map(tgt => (
                <div key={tgt.type} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#f0f4f8' }}>{tgt.type}</div>
                    <div style={{ fontSize: 13, color: '#f5c842', fontWeight: 700 }}>{tgt.value}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#8fa3c0' }}>{tgt.why}</div>
                  <div style={{ fontSize: 11, color: '#8fa3c0', marginTop: 2 }}>Examples: {tgt.examples}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
