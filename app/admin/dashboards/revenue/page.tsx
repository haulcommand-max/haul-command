'use client';

/**
 * ADMIN REVENUE DASHBOARD
 *
 * Real-time revenue overview across all monetization surfaces.
 * Shows: ad revenue, subscriptions, sponsorships, data products,
 * boosts, match fees — broken down by country and time period.
 */

import { useState, useEffect } from 'react';

interface RevenueRow {
    surface: string;
    today: number;
    week: number;
    month: number;
    total: number;
    trend: 'up' | 'down' | 'flat';
}

interface CountryRevenue {
    code: string;
    name: string;
    revenue_usd: number;
    mode: string;
}

export default function RevenueDashboard() {
    const [rows, setRows] = useState<RevenueRow[]>([]);
    const [countries, setCountries] = useState<CountryRevenue[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');

    useEffect(() => {
        // Fetch revenue data from admin API
        Promise.all([
            fetch('/api/admin/revenue').then(r => r.ok ? r.json() : null),
            fetch('/api/admin/revenue?by=country').then(r => r.ok ? r.json() : null),
        ]).then(([revenueData, countryData]) => {
            if (revenueData?.surfaces) setRows(revenueData.surfaces);
            if (countryData?.countries) setCountries(countryData.countries);
            setLoading(false);
        }).catch(() => {
            // Use placeholder data for initial render
            setRows([
                { surface: 'Ad Impressions (CPM)', today: 0, week: 0, month: 0, total: 0, trend: 'flat' },
                { surface: 'Ad Clicks (CPC)', today: 0, week: 0, month: 0, total: 0, trend: 'flat' },
                { surface: 'Sponsor Packages', today: 0, week: 0, month: 0, total: 0, trend: 'flat' },
                { surface: 'Subscriptions (Escort Pro)', today: 0, week: 0, month: 0, total: 0, trend: 'flat' },
                { surface: 'Subscriptions (Broker Seat)', today: 0, week: 0, month: 0, total: 0, trend: 'flat' },
                { surface: 'Load Boosts', today: 0, week: 0, month: 0, total: 0, trend: 'flat' },
                { surface: 'Match Fees', today: 0, week: 0, month: 0, total: 0, trend: 'flat' },
                { surface: 'Data Products', today: 0, week: 0, month: 0, total: 0, trend: 'flat' },
                { surface: 'API Access', today: 0, week: 0, month: 0, total: 0, trend: 'flat' },
                { surface: 'Premium Badges', today: 0, week: 0, month: 0, total: 0, trend: 'flat' },
            ]);
            setLoading(false);
        });
    }, []);

    const totalRevenue = rows.reduce((s, r) => s + r[period], 0);
    const trendIcon = (t: string) => t === 'up' ? 'â†‘' : t === 'down' ? 'â†“' : 'â†’';
    const trendColor = (t: string) => t === 'up' ? '#22C55E' : t === 'down' ? '#EF4444' : '#888';

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>Revenue Dashboard</h1>
                    <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>All monetization surfaces "¢ Real-time</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {(['today', 'week', 'month'] as const).map(p => (
                        <button aria-label="Interactive Button"
                            key={p}
                            onClick={() => setPeriod(p)}
                            style={{
                                padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                border: p === period ? '1px solid #F1A91B' : '1px solid rgba(255,255,255,0.1)',
                                background: p === period ? 'rgba(241,169,27,0.1)' : 'transparent',
                                color: p === period ? '#F1A91B' : '#888',
                            }}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Total Revenue Card */}
            <div style={{
                padding: '24px 32px', borderRadius: 18, marginBottom: 24,
                background: 'linear-gradient(135deg, rgba(241,169,27,0.08), rgba(241,169,27,0.02))',
                border: '1px solid rgba(241,169,27,0.15)',
            }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Total Revenue ({period})
                </div>
                <div style={{ fontSize: 42, fontWeight: 900, color: '#F1A91B', marginTop: 4 }}>
                    ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
            </div>

            {/* Revenue by Surface */}
            <div style={{
                borderRadius: 16, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
            }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Revenue by Surface</div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>Surface</th>
                            <th style={{ padding: '10px 20px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>Today</th>
                            <th style={{ padding: '10px 20px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>Week</th>
                            <th style={{ padding: '10px 20px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>Month</th>
                            <th style={{ padding: '10px 20px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase' }}>Trend</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={row.surface} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 600, color: '#fff' }}>{row.surface}</td>
                                <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: 13, color: '#ccc', fontVariantNumeric: 'tabular-nums' }}>${row.today.toFixed(2)}</td>
                                <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: 13, color: '#ccc', fontVariantNumeric: 'tabular-nums' }}>${row.week.toFixed(2)}</td>
                                <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: 13, color: '#ccc', fontVariantNumeric: 'tabular-nums' }}>${row.month.toFixed(2)}</td>
                                <td style={{ padding: '12px 20px', textAlign: 'right', fontSize: 14, fontWeight: 800, color: trendColor(row.trend) }}>{trendIcon(row.trend)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Revenue by Country */}
            {countries.length > 0 && (
                <div style={{
                    borderRadius: 16, overflow: 'hidden', marginTop: 24,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Revenue by Country</div>
                    </div>
                    <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                        {countries.map(c => (
                            <div key={c.code} style={{
                                padding: '14px', borderRadius: 12,
                                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                            }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{c.code} — {c.name}</div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: '#F1A91B', marginTop: 4 }}>${c.revenue_usd.toFixed(2)}</div>
                                <div style={{
                                    fontSize: 9, fontWeight: 700, marginTop: 4, padding: '2px 8px', borderRadius: 6, display: 'inline-block',
                                    background: c.mode === 'live' ? 'rgba(34,197,94,0.1)' : c.mode === 'seed' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)',
                                    color: c.mode === 'live' ? '#22C55E' : c.mode === 'seed' ? '#3B82F6' : '#888',
                                }}>
                                    {c.mode.toUpperCase()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}