'use client';

/**
 * ADMIN ADGRID FILL/YIELD DASHBOARD
 *
 * Shows ad fill rates, CPM/CPC yields, creative performance,
 * and slot utilization across all surfaces and countries.
 */

import { useState, useEffect } from 'react';

interface FillMetrics {
    surface: string;
    total_requests: number;
    filled: number;
    fill_rate: number;
    avg_cpm: number;
    avg_cpc: number;
    total_impressions: number;
    total_clicks: number;
    ctr: number;
    revenue_usd: number;
}

interface CreativeMetrics {
    variant_id: string;
    headline: string;
    country_code: string;
    surface: string;
    model: string;
    impressions: number;
    clicks: number;
    ctr: number;
    score_composite: number;
    status: string;
}

export default function FillYieldDashboard() {
    const [fillData, setFillData] = useState<FillMetrics[]>([]);
    const [creatives, setCreatives] = useState<CreativeMetrics[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Placeholder data — would be populated from real metrics
        setFillData([
            { surface: 'Directory Inline', total_requests: 0, filled: 0, fill_rate: 0, avg_cpm: 0, avg_cpc: 0, total_impressions: 0, total_clicks: 0, ctr: 0, revenue_usd: 0 },
            { surface: 'Sidebar', total_requests: 0, filled: 0, fill_rate: 0, avg_cpm: 0, avg_cpc: 0, total_impressions: 0, total_clicks: 0, ctr: 0, revenue_usd: 0 },
            { surface: 'Corridor Page', total_requests: 0, filled: 0, fill_rate: 0, avg_cpm: 0, avg_cpc: 0, total_impressions: 0, total_clicks: 0, ctr: 0, revenue_usd: 0 },
            { surface: 'Load Board', total_requests: 0, filled: 0, fill_rate: 0, avg_cpm: 0, avg_cpc: 0, total_impressions: 0, total_clicks: 0, ctr: 0, revenue_usd: 0 },
            { surface: 'Map View', total_requests: 0, filled: 0, fill_rate: 0, avg_cpm: 0, avg_cpc: 0, total_impressions: 0, total_clicks: 0, ctr: 0, revenue_usd: 0 },
            { surface: 'Profile Page', total_requests: 0, filled: 0, fill_rate: 0, avg_cpm: 0, avg_cpc: 0, total_impressions: 0, total_clicks: 0, ctr: 0, revenue_usd: 0 },
        ]);
        setLoading(false);
    }, []);

    const totalImpressions = fillData.reduce((s, f) => s + f.total_impressions, 0);
    const totalClicks = fillData.reduce((s, f) => s + f.total_clicks, 0);
    const totalRevenue = fillData.reduce((s, f) => s + f.revenue_usd, 0);
    const avgFillRate = fillData.length > 0
        ? fillData.reduce((s, f) => s + f.fill_rate, 0) / fillData.length
        : 0;

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 4 }}>AdGrid Fill & Yield</h1>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 24 }}>Fill rates, CPM/CPC, and creative performance across all surfaces</p>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
                {[
                    { label: 'Impressions', value: totalImpressions.toLocaleString(), color: '#3B82F6' },
                    { label: 'Clicks', value: totalClicks.toLocaleString(), color: '#22C55E' },
                    { label: 'Avg Fill Rate', value: `${avgFillRate.toFixed(1)}%`, color: '#F59E0B' },
                    { label: 'Ad Revenue', value: `$${totalRevenue.toFixed(2)}`, color: '#F1A91B' },
                ].map(k => (
                    <div key={k.label} style={{
                        padding: '18px', borderRadius: 14, textAlign: 'center',
                        background: `${k.color}06`, border: `1px solid ${k.color}12`,
                    }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: k.color }}>{k.value}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Fill Table */}
            <div style={{
                borderRadius: 16, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
            }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Fill by Surface</div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                {['Surface', 'Requests', 'Filled', 'Fill %', 'CPM', 'CPC', 'Impressions', 'Clicks', 'CTR', 'Revenue'].map(h => (
                                    <th key={h} style={{
                                        padding: '8px 12px', fontSize: 9, fontWeight: 700, color: '#888',
                                        textTransform: 'uppercase', textAlign: h === 'Surface' ? 'left' : 'right',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {fillData.map((f, i) => (
                                <tr key={f.surface} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#fff' }}>{f.surface}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, color: '#ccc' }}>{f.total_requests}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, color: '#ccc' }}>{f.filled}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: f.fill_rate > 50 ? '#22C55E' : '#F59E0B' }}>{f.fill_rate.toFixed(1)}%</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, color: '#ccc' }}>${f.avg_cpm.toFixed(2)}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, color: '#ccc' }}>${f.avg_cpc.toFixed(2)}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, color: '#ccc' }}>{f.total_impressions.toLocaleString()}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, color: '#ccc' }}>{f.total_clicks.toLocaleString()}</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: f.ctr > 2 ? '#22C55E' : '#888' }}>{f.ctr.toFixed(2)}%</td>
                                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#F1A91B' }}>${f.revenue_usd.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}