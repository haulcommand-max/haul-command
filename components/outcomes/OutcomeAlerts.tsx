'use client';

/**
 * OutcomeAlerts — Band D Rank 6
 * Client-side alert display tied to real outcomes.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { track } from '@/lib/telemetry';

interface Alert {
    id: string; type: string; title: string; icon: string;
    priority: 'high' | 'medium' | 'low';
    detail: string; market: string | null; corridor: string | null;
    timestamp: string; next_action: string | null;
}

function timeAgo(ts: string): string {
    const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}

const priorityColors: Record<string, string> = {
    high: '#EF4444', medium: '#F59E0B', low: '#3B82F6',
};

export function OutcomeAlertsFeed({ limit = 8 }: { limit?: number }) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/alerts?limit=${limit}`)
            .then(r => r.ok ? r.json() : { alerts: [] })
            .then(d => { setAlerts(d.alerts || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [limit]);

    useEffect(() => {
        if (!loading) track('outcome_alerts_seen' as any, { metadata: { count: alerts.length } });
    }, [loading, alerts.length]);

    if (loading || alerts.length === 0) return null;

    return (
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>Outcome Alerts</div>
                <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>
                    {alerts.filter(a => a.priority === 'high').length || '—'} urgent
                </span>
            </div>
            <div style={{ padding: '4px 0', maxHeight: 300, overflowY: 'auto' }}>
                {alerts.map(alert => {
                    const prColor = priorityColors[alert.priority] || '#888';
                    return (
                        <div key={alert.id} style={{
                            display: 'flex', gap: 10, alignItems: 'center', padding: '10px 18px',
                            borderLeft: `3px solid ${prColor}`,
                        }}>
                            <span style={{ fontSize: 14 }}>{alert.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#ddd' }}>{alert.title}</div>
                                <div style={{ fontSize: 10, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.detail}</div>
                            </div>
                            <span style={{ fontSize: 9, color: '#666', whiteSpace: 'nowrap' }}>{timeAgo(alert.timestamp)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
