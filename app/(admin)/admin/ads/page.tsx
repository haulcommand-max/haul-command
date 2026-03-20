'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminTopBar } from '@/components/admin/AdminTopBar';

// ═══════════════════════════════════════════════════════════════
// ADMIN — AdGrid Campaign Dashboard
// Shows live campaign health: impressions, clicks, CTR, spend,
// and the compliance copilot cache stats.
// ═══════════════════════════════════════════════════════════════

const T = {
    bg: '#070707', surface: '#0c0c0c', border: '#1a1a1a',
    text: '#e5e5e5', muted: '#555', gold: '#ffb400',
    green: '#22c55e', red: '#ef4444', blue: '#3b82f6',
};

interface Campaign {
    id: string;
    slot_id: string;
    entity_type: string | null;
    target_corridor: string | null;
    budget_usd_month: number;
    status: string;
    starts_at: string | null;
    ends_at: string | null;
    created_at: string;
    impressions: number;
    clicks: number;
    ctr: string;
    spend_est: string;
}

interface CopilotStats {
    total_answers: number;
    total_views: number;
    cached_answers: number;
    top_jurisdictions: { jurisdiction_code: string; count: number }[];
}

export default function AdsAdminPage() {
    const supabase = createClient();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [copilot, setCopilot] = useState<CopilotStats | null>(null);
    const [totals, setTotals] = useState({ campaigns: 0, impressions: 0, clicks: 0, revenue: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'campaigns' | 'copilot' | 'house'>('campaigns');

    useEffect(() => {
        async function load() {
            // ── Campaigns
            const { data: camps } = await supabase
                .from('adgrid_campaigns')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            // ── Events (impressions + clicks per campaign)
            const { data: events } = await supabase
                .from('adgrid_events')
                .select('campaign_id, event_type')
                .in('event_type', ['impression', 'click']);

            // Aggregate events by campaign
            const eventMap: Record<string, { impressions: number; clicks: number }> = {};
            (events ?? []).forEach((e: any) => {
                if (!eventMap[e.campaign_id]) eventMap[e.campaign_id] = { impressions: 0, clicks: 0 };
                if (e.event_type === 'impression') eventMap[e.campaign_id].impressions++;
                if (e.event_type === 'click') eventMap[e.campaign_id].clicks++;
            });

            const mapped: Campaign[] = (camps ?? []).map((c: any) => {
                const ev = eventMap[c.id] ?? { impressions: 0, clicks: 0 };
                const ctr = ev.impressions > 0
                    ? ((ev.clicks / ev.impressions) * 100).toFixed(2) + '%'
                    : '—';
                // CPM estimate: $8/1000 impressions
                const spend = ev.impressions > 0
                    ? `$${((ev.impressions / 1000) * 8).toFixed(2)}`
                    : '$0.00';
                return {
                    id: c.id,
                    slot_id: c.slot_id ?? '—',
                    entity_type: c.entity_type ?? null,
                    target_corridor: c.target_corridor ?? null,
                    budget_usd_month: Number(c.budget_usd_month ?? 0),
                    status: c.status ?? 'unknown',
                    starts_at: c.starts_at ?? null,
                    ends_at: c.ends_at ?? null,
                    created_at: c.created_at,
                    impressions: ev.impressions,
                    clicks: ev.clicks,
                    ctr,
                    spend_est: spend,
                };
            });

            setCampaigns(mapped);
            setTotals({
                campaigns: mapped.filter(c => c.status === 'active').length,
                impressions: mapped.reduce((s, c) => s + c.impressions, 0),
                clicks: mapped.reduce((s, c) => s + c.clicks, 0),
                revenue: mapped.reduce((s, c) => s + c.budget_usd_month, 0),
            });

            // ── Compliance Copilot stats
            const { data: copData, count: copCount } = await supabase
                .from('compliance_copilot_cache')
                .select('jurisdiction_code, view_count', { count: 'exact' });

            if (copData) {
                const totalViews = copData.reduce((s: number, r: any) => s + (r.view_count ?? 0), 0);
                const jurisdictionMap: Record<string, number> = {};
                copData.forEach((r: any) => {
                    const jx = r.jurisdiction_code ?? 'General';
                    jurisdictionMap[jx] = (jurisdictionMap[jx] ?? 0) + 1;
                });
                const top = Object.entries(jurisdictionMap)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([jurisdiction_code, count]) => ({ jurisdiction_code, count }));

                setCopilot({
                    total_answers: copCount ?? 0,
                    total_views: totalViews,
                    cached_answers: copCount ?? 0,
                    top_jurisdictions: top,
                });
            }

            setLoading(false);
        }
        load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.bg }}>
            <AdminTopBar title="AdGrid · Revenue Dashboard" />

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, padding: '0 32px', borderBottom: `1px solid ${T.border}` }}>
                {(['campaigns', 'copilot', 'house'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        padding: '14px 20px',
                        fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em',
                        color: activeTab === tab ? T.gold : T.muted,
                        background: 'none', border: 'none', borderBottom: activeTab === tab ? `2px solid ${T.gold}` : '2px solid transparent',
                        cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                        {tab === 'campaigns' ? 'Paid Campaigns' : tab === 'copilot' ? 'Copilot Cache' : 'House Ads'}
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>

                {/* KPI row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
                    {[
                        { label: 'Active Campaigns', value: loading ? '—' : String(totals.campaigns), color: T.gold },
                        { label: 'Total Impressions', value: loading ? '—' : totals.impressions.toLocaleString(), color: T.blue },
                        { label: 'Total Clicks', value: loading ? '—' : totals.clicks.toLocaleString(), color: T.green },
                        { label: 'Monthly Budget', value: loading ? '—' : `$${totals.revenue.toLocaleString()}/mo`, color: T.green },
                    ].map(kpi => (
                        <div key={kpi.label} style={{
                            background: T.surface, border: `1px solid ${T.border}`,
                            borderRadius: 10, padding: '20px 24px',
                        }}>
                            <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: T.muted, margin: '0 0 8px' }}>
                                {kpi.label}
                            </p>
                            <p style={{ fontSize: 24, fontWeight: 900, color: kpi.color, margin: 0, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
                                {kpi.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ── CAMPAIGNS TAB */}
                {activeTab === 'campaigns' && (
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: 12, fontWeight: 800, color: T.text, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                All Campaigns ({campaigns.length})
                            </p>
                            <a href="/sponsor" target="_blank" style={{
                                padding: '6px 14px', borderRadius: 7,
                                background: 'rgba(255,180,0,0.12)',
                                border: '1px solid rgba(255,180,0,0.25)',
                                color: T.gold, fontSize: 11, fontWeight: 700,
                                textDecoration: 'none',
                            }}>
                                + New Campaign
                            </a>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                                <tr style={{ background: '#0f0f0f' }}>
                                    {['Slot / Corridor', 'Type', 'Budget', 'Impressions', 'Clicks', 'CTR', 'Est. Spend', 'Status', 'Expires'].map(h => (
                                        <th key={h} style={{
                                            padding: '10px 16px', textAlign: 'left',
                                            fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                                            letterSpacing: '0.12em', color: T.muted,
                                            borderBottom: `1px solid ${T.border}`,
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: T.muted }}>Loading campaigns...</td></tr>
                                ) : campaigns.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} style={{ padding: '48px', textAlign: 'center' }}>
                                            <div style={{ fontSize: 28, marginBottom: 12 }}>📡</div>
                                            <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>
                                                No paid campaigns yet. <a href="/sponsor" style={{ color: T.gold }}>Launch one at /sponsor</a>
                                            </p>
                                        </td>
                                    </tr>
                                ) : campaigns.map(c => (
                                    <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#111'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                                    >
                                        <td style={{ padding: '10px 16px', color: T.text, fontWeight: 600 }}>
                                            {c.target_corridor ?? c.slot_id}
                                        </td>
                                        <td style={{ padding: '10px 16px', color: T.muted }}>
                                            {c.entity_type ?? 'generic'}
                                        </td>
                                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: T.gold }}>
                                            ${c.budget_usd_month}/mo
                                        </td>
                                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: T.blue }}>
                                            {c.impressions.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: T.text }}>
                                            {c.clicks.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: c.ctr === '—' ? T.muted : T.green }}>
                                            {c.ctr}
                                        </td>
                                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: T.muted }}>
                                            {c.spend_est}
                                        </td>
                                        <td style={{ padding: '10px 16px' }}>
                                            <span style={{
                                                padding: '3px 8px', borderRadius: 5,
                                                fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                                                background: c.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(85,85,85,0.15)',
                                                color: c.status === 'active' ? T.green : T.muted,
                                                border: `1px solid ${c.status === 'active' ? 'rgba(34,197,94,0.25)' : 'rgba(85,85,85,0.25)'}`,
                                            }}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 16px', color: T.muted, fontSize: 11 }}>
                                            {c.ends_at ? new Date(c.ends_at).toLocaleDateString() : '∞'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── COPILOT CACHE TAB */}
                {activeTab === 'copilot' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                            {[
                                { label: 'Cached Answers', value: copilot?.total_answers ?? '—', color: T.gold },
                                { label: 'Total Views', value: copilot?.total_views.toLocaleString() ?? '—', color: T.blue },
                                { label: 'Cache Hit Rate', value: copilot ? '100%' : '—', color: T.green },
                            ].map(kpi => (
                                <div key={kpi.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '20px 24px' }}>
                                    <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: T.muted, margin: '0 0 8px' }}>
                                        {kpi.label}
                                    </p>
                                    <p style={{ fontSize: 24, fontWeight: 900, color: kpi.color, margin: 0, fontFamily: 'monospace' }}>
                                        {String(kpi.value)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24 }}>
                            <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: T.muted, margin: '0 0 16px' }}>
                                Top Jurisdictions Asked
                            </p>
                            {!copilot || copilot.top_jurisdictions.length === 0 ? (
                                <p style={{ color: T.muted, fontSize: 13 }}>
                                    No questions answered yet. <a href="/tools/compliance-copilot" style={{ color: T.gold }}>Open the Copilot →</a>
                                </p>
                            ) : copilot.top_jurisdictions.map((jx, i) => (
                                <div key={jx.jurisdiction_code} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '10px 0',
                                    borderBottom: i < copilot.top_jurisdictions.length - 1 ? `1px solid ${T.border}` : 'none',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{
                                            width: 24, height: 24,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: 'rgba(255,180,0,0.1)',
                                            borderRadius: 6, fontSize: 10, fontWeight: 900, color: T.gold,
                                        }}>{i + 1}</span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                                            {jx.jurisdiction_code}
                                        </span>
                                    </div>
                                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: T.muted }}>
                                        {jx.count} {jx.count === 1 ? 'answer' : 'answers'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '16px 20px' }}>
                            <p style={{ fontSize: 12, color: '#93c5fd', margin: 0, lineHeight: 1.6 }}>
                                <strong style={{ color: '#3b82f6' }}>SEO Note:</strong> Every cached answer is publicly readable via{' '}
                                <code style={{ background: 'rgba(59,130,246,0.15)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>
                                    GET /api/copilot/compliance?q=...&jx=US-TX
                                </code>{' '}
                                and indexed by search engines. Each unique question becomes a crawlable page.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── HOUSE ADS TAB */}
                {activeTab === 'house' && (
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 24 }}>
                        <p style={{ fontSize: 12, color: T.muted, margin: '0 0 20px', lineHeight: 1.6 }}>
                            House ads run automatically when no paid campaign fills a slot. They promote internal features and drive signups.
                            They rotate deterministically by surface + placement so the same ad doesn't repeat across the page.
                        </p>
                        <div style={{ display: 'grid', gap: 10 }}>
                            {[
                                { id: 'house-001', headline: 'Claim Your Operator Profile', cta: '/claim', surface: 'All surfaces' },
                                { id: 'house-002', headline: 'Need an Escort? Post Your Load', cta: '/loads/post', surface: 'All surfaces' },
                                { id: 'house-003', headline: 'Route IQ — Free Complexity Scoring', cta: '/tools/route-iq', surface: 'All surfaces' },
                                { id: 'house-004', headline: 'Get the Verified Badge ✓', cta: '/onboarding', surface: 'All surfaces' },
                                { id: 'house-005', headline: 'State Escort Rules Just Changed ⚠️', cta: '/tools/state-requirements', surface: 'All surfaces' },
                                { id: 'house-006', headline: 'Join 1,247+ Operators on the Network', cta: '/onboarding', surface: 'All surfaces' },
                                { id: 'house-007', headline: 'What Should You Charge?', cta: '/tools/rate-lookup', surface: 'All surfaces' },
                                { id: 'house-008', headline: 'Pilot Car Gear & Equipment', cta: '/gear', surface: 'All surfaces' },
                            ].map(ad => (
                                <div key={ad.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '12px 16px',
                                    background: '#0f0f0f',
                                    border: `1px solid ${T.border}`,
                                    borderRadius: 8,
                                }}>
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: '0 0 2px' }}>{ad.headline}</p>
                                        <p style={{ fontSize: 10, color: T.muted, margin: 0, fontFamily: 'monospace' }}>{ad.cta}</p>
                                    </div>
                                    <span style={{
                                        padding: '3px 8px', borderRadius: 5,
                                        fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                                        background: 'rgba(34,197,94,0.08)',
                                        color: T.green,
                                        border: '1px solid rgba(34,197,94,0.2)',
                                    }}>
                                        Active
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
