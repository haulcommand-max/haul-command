'use client';

/**
 * ADMIN DISTRIBUTION PERFORMANCE DASHBOARD
 *
 * Shows social distribution post performance:
 * - Posts by channel and content bucket
 * - Delivery rates
 * - UTM-attributed funnel metrics
 */

import { useState, useEffect } from 'react';

interface DistPost {
    id: string;
    channel: string;
    content_bucket: string;
    country_code: string;
    headline: string;
    status: string;
    utm_campaign: string;
    scheduled_at: string;
    published_at?: string;
}

export default function DistributionDashboard() {
    const [posts, setPosts] = useState<DistPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/social/distribute?action=stats')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.posts) setPosts(data.posts);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const stats = {
        total: posts.length,
        published: posts.filter(p => p.status === 'published').length,
        scheduled: posts.filter(p => p.status === 'scheduled').length,
        failed: posts.filter(p => p.status === 'failed').length,
    };

    const byChannel: Record<string, number> = {};
    posts.forEach(p => { byChannel[p.channel] = (byChannel[p.channel] || 0) + 1; });

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Distribution Performance</h1>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 24 }}>Social distribution engine â€¢ Posts â€¢ Funnel attribution</p>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 24 }}>
                {[
                    { label: 'Total Posts', value: stats.total, color: '#fff' },
                    { label: 'Published', value: stats.published, color: '#22C55E' },
                    { label: 'Scheduled', value: stats.scheduled, color: '#3B82F6' },
                    { label: 'Failed', value: stats.failed, color: '#EF4444' },
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

            {/* By Channel */}
            {Object.keys(byChannel).length > 0 && (
                <div style={{
                    padding: '16px 20px', borderRadius: 14, marginBottom: 24,
                    border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)',
                }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 12 }}>By Channel</div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {Object.entries(byChannel).map(([ch, count]) => (
                            <div key={ch} style={{
                                padding: '8px 16px', borderRadius: 10,
                                background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)',
                            }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#3B82F6', textTransform: 'capitalize' }}>{ch}</span>
                                <span style={{ fontSize: 11, color: '#888', marginLeft: 8 }}>{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Posts Table */}
            {posts.length === 0 ? (
                <div style={{
                    padding: 40, textAlign: 'center', borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)',
                }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>ðŸ“¡</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>No distribution posts yet</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                        Schedule posts via POST /api/social/distribute
                    </div>
                </div>
            ) : (
                <div style={{
                    borderRadius: 16, overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)',
                }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Recent Posts</div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    {['Headline', 'Channel', 'Country', 'Content', 'Status', 'Scheduled'].map(h => (
                                        <th key={h} style={{
                                            padding: '8px 12px', fontSize: 9, fontWeight: 700, color: '#888',
                                            textTransform: 'uppercase', textAlign: h === 'Headline' ? 'left' : 'center',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {posts.slice(0, 25).map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                        <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#fff', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {p.headline}
                                        </td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, color: '#3B82F6', fontWeight: 700, textTransform: 'capitalize' }}>{p.channel}</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{p.country_code}</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 10, color: '#888' }}>{p.content_bucket}</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                            <span style={{
                                                fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase',
                                                background: p.status === 'published' ? 'rgba(34,197,94,0.1)' : p.status === 'scheduled' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)',
                                                color: p.status === 'published' ? '#22C55E' : p.status === 'scheduled' ? '#3B82F6' : '#EF4444',
                                            }}>{p.status}</span>
                                        </td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, color: '#888' }}>
                                            {new Date(p.scheduled_at).toLocaleDateString()}
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