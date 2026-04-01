'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

interface OpsEvent {
    id: string;
    event_type: string;
    severity: string;
    title: string;
    message: string | null;
    metadata: Record<string, unknown>;
    source: string;
    acknowledged: boolean;
    acknowledged_at: string | null;
    created_at: string;
}

const SEVERITY_COLORS: Record<string, string> = {
    P0: '#ef4444',
    P1: '#f97316',
    P2: '#3b82f6',
    P3: '#6b7280',
};

const SEVERITY_EMOJI: Record<string, string> = {
    P0: '🔴',
    P1: '🟠',
    P2: '🔵',
    P3: '⚪',
};

export default function OpsAdminPage() {
    const [events, setEvents] = useState<OpsEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    const fetchEvents = useCallback(async () => {
        const supabase = createClient();
        let query = supabase
            .from('ops_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (filter !== 'all') {
            query = query.eq('severity', filter);
        }
        if (typeFilter !== 'all') {
            query = query.eq('event_type', typeFilter);
        }

        const { data } = await query;
        setEvents(data || []);
        setLoading(false);
    }, [filter, typeFilter]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const acknowledge = async (eventId: string) => {
        const supabase = createClient();
        await supabase
            .from('ops_events')
            .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
            .eq('id', eventId);
        fetchEvents();
    };

    const unackCount = events.filter(e => !e.acknowledged && (e.severity === 'P0' || e.severity === 'P1')).length;
    const eventTypes = Array.from(new Set(events.map(e => e.event_type)));

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                        ⚙️ Ops Events
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '4px 0 0' }}>
                        {events.length} events · {unackCount > 0 && (
                            <span style={{ color: '#ef4444', fontWeight: 600 }}>
                                {unackCount} unacknowledged critical
                            </span>
                        )}
                    </p>
                </div>
                <button
                    onClick={fetchEvents}
                    style={{
                        padding: '8px 16px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', fontSize: '13px',
                    }}
                >
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {['all', 'P0', 'P1', 'P2', 'P3'].map(s => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        style={{
                            padding: '4px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                            fontSize: '12px', fontWeight: 600,
                            background: filter === s ? '#38bdf8' : 'rgba(255,255,255,0.06)',
                            color: filter === s ? '#000' : 'rgba(255,255,255,0.6)',
                        }}
                    >
                        {s === 'all' ? 'All' : `${SEVERITY_EMOJI[s]} ${s}`}
                    </button>
                ))}
                <span style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    style={{
                        padding: '4px 8px', borderRadius: '6px', fontSize: '12px',
                        background: '#0f172a', color: 'rgba(255,255,255,0.7)',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}
                >
                    <option value="all">All types</option>
                    {eventTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
            </div>

            {/* Event list */}
            {loading ? (
                <p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</p>
            ) : events.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)' }}>
                    <p style={{ fontSize: '1.2rem' }}>No ops events found</p>
                    <p style={{ fontSize: '0.9rem' }}>Events from deploys, cron jobs, and manual alerts appear here.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '4px' }}>
                    {events.map(ev => (
                        <div
                            key={ev.id}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '36px 60px 1fr auto',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                background: ev.acknowledged ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
                                borderLeft: `3px solid ${SEVERITY_COLORS[ev.severity] || '#6b7280'}`,
                                opacity: ev.acknowledged ? 0.6 : 1,
                            }}
                        >
                            {/* Severity badge */}
                            <span style={{
                                fontSize: '11px', fontWeight: 700, textAlign: 'center',
                                color: SEVERITY_COLORS[ev.severity] || '#6b7280',
                            }}>
                                {ev.severity}
                            </span>

                            {/* Type */}
                            <span style={{
                                fontSize: '10px', color: 'rgba(255,255,255,0.4)',
                                textTransform: 'uppercase', letterSpacing: '0.5px',
                            }}>
                                {ev.event_type.replace(/_/g, ' ').slice(0, 12)}
                            </span>

                            {/* Content */}
                            <div>
                                <span style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>
                                    {ev.title}
                                </span>
                                {ev.message && (
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginLeft: '8px' }}>
                                        {ev.message.slice(0, 120)}
                                    </span>
                                )}
                                {typeof ev.metadata?.run_url === 'string' && (
                                    <a
                                        href={ev.metadata.run_url}
                                        target="_blank"
                                        rel="noopener"
                                        style={{ color: '#38bdf8', fontSize: '11px', marginLeft: '8px', textDecoration: 'none' }}
                                    >
                                        View Run ↗
                                    </a>
                                )}
                                {typeof ev.metadata?.deploy_url === 'string' && (
                                    <a
                                        href={ev.metadata.deploy_url}
                                        target="_blank"
                                        rel="noopener"
                                        style={{ color: '#22c55e', fontSize: '11px', marginLeft: '8px', textDecoration: 'none' }}
                                    >
                                        Deploy ↗
                                    </a>
                                )}
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                                    {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {!ev.acknowledged && (
                                    <button
                                        onClick={() => acknowledge(ev.id)}
                                        style={{
                                            padding: '3px 8px', borderRadius: '4px', border: 'none',
                                            background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)',
                                            cursor: 'pointer', fontSize: '11px',
                                        }}
                                    >
                                        ACK
                                    </button>
                                )}
                                {ev.acknowledged && (
                                    <span style={{ fontSize: '11px', color: '#22c55e' }}>✓</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
