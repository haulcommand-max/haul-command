'use client';

/**
 * ADMIN CREATIVE PERFORMANCE DASHBOARD
 *
 * Shows all Gemini/template-generated creatives with:
 * - Score composite
 * - Impressions, clicks, CTR
 * - Winner detection status
 * - A/B test results
 */

import { useState, useEffect } from 'react';

interface Creative {
    variant_id: string;
    headline: string;
    country_code: string;
    surface: string;
    generation_model: string;
    score_composite: number;
    status: string;
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    revenue_usd: number;
}

export default function CreativePerformanceDashboard() {
    const [creatives, setCreatives] = useState<Creative[]>([]);
    const [filter, setFilter] = useState<'all' | 'active' | 'promoted' | 'retired'>('all');

    useEffect(() => {
        // Fetch creative data
        fetch('/api/admin/creatives')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.creatives) setCreatives(data.creatives);
            })
            .catch(() => {});
    }, []);

    const filtered = creatives.filter(c => filter === 'all' || c.status === filter);

    const stats = {
        total: creatives.length,
        gemini: creatives.filter(c => c.generation_model.startsWith('gemini')).length,
        template: creatives.filter(c => c.generation_model === 'template_fallback').length,
        active: creatives.filter(c => c.status === 'active').length,
        promoted: creatives.filter(c => c.status === 'promoted').length,
    };

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Creative Performance</h1>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 24 }}>Gemini Ad Factory output â€¢ A/B test results â€¢ Winner detection</p>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 24 }}>
                {[
                    { label: 'Total', value: stats.total, color: '#fff' },
                    { label: 'Gemini', value: stats.gemini, color: '#8B5CF6' },
                    { label: 'Template', value: stats.template, color: '#F59E0B' },
                    { label: 'Active', value: stats.active, color: '#22C55E' },
                    { label: 'Promoted', value: stats.promoted, color: '#3B82F6' },
                ].map(s => (
                    <div key={s.label} style={{
                        padding: '14px', borderRadius: 12, textAlign: 'center',
                        background: `${s.color}06`, border: `1px solid ${s.color}12`,
                    }}>
                        <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginTop: 4 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Filter + Table */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {(['all', 'active', 'promoted', 'retired'] as const).map(f => (
                    <button aria-label="Interactive Button"
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            border: f === filter ? '1px solid #F1A91B' : '1px solid rgba(255,255,255,0.1)',
                            background: f === filter ? 'rgba(241,169,27,0.1)' : 'transparent',
                            color: f === filter ? '#F1A91B' : '#888', textTransform: 'capitalize',
                        }}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div style={{
                    padding: 40, textAlign: 'center', borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)',
                }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>ðŸŽ¨</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>No creatives generated yet</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                        Use the Gemini Ad Factory to generate creatives: POST /api/adgrid/generate
                    </div>
                </div>
            ) : (
                <div style={{
                    borderRadius: 16, overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    {['Headline', 'Country', 'Surface', 'Model', 'Score', 'Impressions', 'Clicks', 'CTR', 'Status'].map(h => (
                                        <th key={h} style={{
                                            padding: '8px 12px', fontSize: 9, fontWeight: 700, color: '#888',
                                            textTransform: 'uppercase', textAlign: h === 'Headline' ? 'left' : 'center',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(c => (
                                    <tr key={c.variant_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                        <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#fff', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {c.headline}
                                        </td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#3B82F6' }}>{c.country_code}</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, color: '#888' }}>{c.surface}</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                            <span style={{
                                                fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                                background: c.generation_model.startsWith('gemini') ? 'rgba(139,92,246,0.1)' : 'rgba(245,158,11,0.1)',
                                                color: c.generation_model.startsWith('gemini') ? '#8B5CF6' : '#F59E0B',
                                            }}>
                                                {c.generation_model.startsWith('gemini') ? 'Gemini' : 'Template'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: c.score_composite > 0.7 ? '#22C55E' : '#F59E0B' }}>
                                            {(c.score_composite * 100).toFixed(0)}%
                                        </td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, color: '#ccc' }}>{c.impressions.toLocaleString()}</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, color: '#ccc' }}>{c.clicks.toLocaleString()}</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: c.ctr > 3 ? '#22C55E' : '#888' }}>{c.ctr.toFixed(2)}%</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                            <span style={{
                                                fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase',
                                                background: c.status === 'promoted' ? 'rgba(34,197,94,0.1)' : c.status === 'active' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)',
                                                color: c.status === 'promoted' ? '#22C55E' : c.status === 'active' ? '#3B82F6' : '#888',
                                            }}>
                                                {c.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}