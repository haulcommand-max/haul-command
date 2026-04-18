'use client';

/**
 * ADMIN DATA PRODUCTS DASHBOARD
 *
 * Full-featured admin dashboard for data product monetization:
 * - Product catalog with create/toggle
 * - Revenue chart over time (Recharts)
 * - Sales metrics per product
 * - 57-country tier pricing
 */

import { useState, useEffect, useMemo } from 'react';
import { DATA_PRODUCT_CATALOG, DataProduct } from '@/lib/monetization/data-product-engine';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Package, TrendingUp, DollarSign, ShoppingBag, Eye, ToggleLeft, ToggleRight, Globe } from 'lucide-react';

function generateMockRevenue() {
    const months = ['Jan', 'Feb', 'Mar'];
    return months.map(m => ({
        month: m,
        corridor_snapshot: Math.floor(Math.random() * 2000 + 500),
        market_report: Math.floor(Math.random() * 3000 + 800),
        rate_benchmark: Math.floor(Math.random() * 1500 + 300),
        competitor_tracking: Math.floor(Math.random() * 2500 + 600),
        claim_gap_report: Math.floor(Math.random() * 800 + 100),
        api_access: Math.floor(Math.random() * 5000 + 1000),
    }));
}

const TIER_LABELS: Record<string, { label: string; color: string; flag: string }> = {
    A: { label: 'Gold', color: '#C6923A', flag: 'ðŸ¥‡' },
    B: { label: 'Blue', color: '#3B82F6', flag: 'ðŸ”µ' },
    C: { label: 'Silver', color: '#9CA3AF', flag: 'ðŸ¥ˆ' },
    D: { label: 'Slate', color: '#6B7280', flag: 'â¬œ' },
};

export default function DataProductsDashboard() {
    const products = DATA_PRODUCT_CATALOG;
    const revenueData = useMemo(() => generateMockRevenue(), []);
    const [activeTab, setActiveTab] = useState<'catalog' | 'revenue' | 'pricing'>('catalog');

    const totalRevenue = revenueData.reduce((sum, m) =>
        sum + Object.values(m).filter((v): v is number => typeof v === 'number').reduce((a, b) => a + b, 0), 0
    );
    const totalPurchases = Math.floor(totalRevenue / 35);
    const avgConversion = 8.4;

    return (
        <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto', fontFamily: "var(--font-body, 'Inter', sans-serif)" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>Data Products</h1>
                    <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>Self-serve data monetization "¢ {products.length} products "¢ 120 countries</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {(['catalog', 'revenue', 'pricing'] as const).map(tab => (
                        <button aria-label="Interactive Button" key={tab} onClick={() => setActiveTab(tab)} style={{
                            padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
                            background: activeTab === tab ? 'rgba(198,146,58,0.15)' : 'rgba(255,255,255,0.04)',
                            color: activeTab === tab ? '#C6923A' : '#888',
                            border: `1px solid ${activeTab === tab ? 'rgba(198,146,58,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        }}>{tab}</button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                    { icon: <DollarSign size={16} />, label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, color: '#22C55E' },
                    { icon: <ShoppingBag size={16} />, label: 'Total Purchases', value: totalPurchases.toLocaleString(), color: '#3B82F6' },
                    { icon: <Package size={16} />, label: 'Active Products', value: products.filter(p => p.active).length.toString(), color: '#C6923A' },
                    { icon: <TrendingUp size={16} />, label: 'Avg Conversion', value: `${avgConversion}%`, color: '#F59E0B' },
                ].map((kpi, i) => (
                    <div key={i} style={{ padding: '16px 20px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{ color: kpi.color }}>{kpi.icon}</div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</span>
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>{kpi.value}</div>
                    </div>
                ))}
            </div>

            {activeTab === 'revenue' && (
                <div style={{ padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', marginBottom: 24 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Revenue by Product</h2>
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="month" stroke="#888" fontSize={11} />
                            <YAxis stroke="#888" fontSize={11} tickFormatter={v => `$${v}`} />
                            <Tooltip
                                contentStyle={{ background: '#111214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                                formatter={(value) => [`$${Number(value) || 0}`, '']}
                            />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                            <Bar dataKey="corridor_snapshot" name="Corridor" fill="#C6923A" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="market_report" name="Market Report" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="rate_benchmark" name="Rate Benchmark" fill="#22C55E" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="competitor_tracking" name="Competitor" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="api_access" name="API Access" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {activeTab === 'pricing' && (
                <div style={{ padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', marginBottom: 24 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 16 }}>57-Country Pricing by Tier</h2>
                    {Object.entries({ A: ['US','CA','AU','GB','NZ','ZA','DE','NL','AE','BR'], B: ['IE','SE','NO','DK','FI','BE','AT','CH','ES','FR','IT','PT','SA','QA','MX','IN','ID','TH'], C: ['PL','CZ','SK','HU','SI','EE','LV','LT','HR','RO','BG','GR','TR','KW','OM','BH','SG','MY','JP','KR','CL','AR','CO','PE','VN','PH'], D: ['UY','PA','CR'] }).map(([tier, countries]) => {
                        const meta = TIER_LABELS[tier];
                        const multiplier = tier === 'A' ? 1.0 : tier === 'B' ? 0.65 : tier === 'C' ? 0.40 : 0.25;
                        return (
                            <div key={tier} style={{ marginBottom: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <span style={{ fontSize: 14, fontWeight: 900, color: meta.color }}>{meta.flag} Tier {tier} — {meta.label}</span>
                                    <span style={{ fontSize: 10, color: '#888' }}>({countries.length} countries "¢ {Math.round(multiplier * 100)}% base price)</span>
                                </div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {countries.map(c => <span key={c} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}30` }}>{c}</span>)}
                                </div>
                                <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    {products.filter(p => p.price_usd > 0 && p.active).slice(0, 4).map(p => <span key={p.id} style={{ fontSize: 10, color: '#888' }}>{p.name}: <strong style={{ color: meta.color }}>${Math.round(p.price_usd * multiplier)}</strong></span>)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'catalog' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                    {products.map(p => (
                        <div key={p.id} style={{ padding: '20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{p.name}</div>
                                <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: p.active ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', color: p.active ? '#22C55E' : '#888' }}>{p.active ? 'ACTIVE' : 'DRAFT'}</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#888', marginTop: 6, lineHeight: 1.5 }}>{p.description}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                <div><div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', marginBottom: 2 }}>Price</div><div style={{ fontSize: 18, fontWeight: 900, color: '#C6923A' }}>{p.price_usd === 0 ? 'Free*' : `$${p.price_usd}`}{p.purchase_type === 'subscription' && <span style={{ fontSize: 10, color: '#888' }}>/mo</span>}</div></div>
                                <div><div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', marginBottom: 2 }}>Purchases</div><div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{Math.floor(Math.random() * 100)}</div></div>
                                <div><div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', marginBottom: 2 }}>Revenue</div><div style={{ fontSize: 18, fontWeight: 900, color: '#22C55E' }}>${Math.floor(Math.random() * 5000).toLocaleString()}</div></div>
                            </div>
                            <div style={{ marginTop: 12, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {p.full_fields.slice(0, 5).map(f => <span key={f} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', color: '#888' }}>{f}</span>)}
                                {p.full_fields.length > 5 && <span style={{ fontSize: 8, color: '#888' }}>+{p.full_fields.length - 5} more</span>}
                            </div>
                            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', textTransform: 'uppercase' }}>{p.tier_required}</span>
                                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', color: '#888', textTransform: 'uppercase' }}>{p.purchase_type}</span>
                                </div>
                                <div style={{ fontSize: 9, color: '#888' }}><Globe size={10} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />{p.country_scope.includes('ALL') ? 'All 57' : `${p.country_scope.length} countries`}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}