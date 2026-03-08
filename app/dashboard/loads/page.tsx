'use client';

import { useState, useCallback } from 'react';

interface ParsedLoad {
    company: string;
    phone: string;
    route: string;
    position: string;
    rate: number | null;
}

interface IngestResponse {
    ok: boolean;
    batchId: string;
    stats: {
        total: number;
        parsed: number;
        failed: number;
        uniqueBrokers: number;
        uniqueCorridors: number;
        newBrokersAdded: number;
        corridorDemand: Record<string, number>;
        positionBreakdown: Record<string, number>;
    };
    parsed: ParsedLoad[];
    failed: string[];
}

const POSITION_COLORS: Record<string, string> = {
    pilot: '#00ff88',
    chase: '#818cf8',
    lead: '#f59e0b',
    unknown: '#666',
};

export default function LoadDashboardPage() {
    const [rawText, setRawText] = useState('');
    const [result, setResult] = useState<IngestResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState<'feed' | 'corridors' | 'brokers'>('feed');

    const ingestLoads = useCallback(async () => {
        if (!rawText.trim()) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/loads/ingest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-secret': 'local-dev',
                },
                body: JSON.stringify({ text: rawText, source: 'manual_paste' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Ingest failed');
            setResult(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [rawText]);

    const corridorEntries = result?.stats.corridorDemand
        ? Object.entries(result.stats.corridorDemand).sort(([, a], [, b]) => b - a)
        : [];

    const uniqueBrokers = result?.parsed
        ? [...new Map(result.parsed.map(p => [p.phone, p])).values()]
        : [];

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e0e0e0', fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #111118, #0f0f1a)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '20px 24px',
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 28 }}>📡</span>
                        Load Alert Intelligence
                    </h1>
                    <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>
                        Paste load board alerts → Parse → Extract demand signals + broker contacts
                    </p>
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
                {/* Input Area */}
                <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 24,
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#aaa' }}>Paste Load Alerts</span>
                        <span style={{ fontSize: 12, color: '#666' }}>
                            {rawText.split('\n').filter(l => l.includes('Load Alert')).length} alerts detected
                        </span>
                    </div>
                    <textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="Load Alert!! FCI 9092527549 Atlanta GA Los Angeles CA P&#10;Load Alert!! PAN LOGISTICS 2536663879 Omaha NE Gary IN P&#10;..."
                        rows={6}
                        style={{
                            width: '100%',
                            padding: 14,
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 10,
                            color: '#ccc',
                            fontSize: 13,
                            fontFamily: "'JetBrains Mono', monospace",
                            resize: 'vertical',
                            outline: 'none',
                        }}
                    />
                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                        <button
                            onClick={ingestLoads}
                            disabled={loading || !rawText.trim()}
                            style={{
                                padding: '12px 28px',
                                borderRadius: 10,
                                border: 'none',
                                background: loading ? '#333' : 'linear-gradient(135deg, #00ff88, #00cc6a)',
                                color: '#000',
                                fontWeight: 700,
                                fontSize: 14,
                                cursor: loading ? 'default' : 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            {loading ? '⏳ Processing...' : '🚀 Ingest & Parse'}
                        </button>
                        {error && <span style={{ color: '#ff4444', fontSize: 13, alignSelf: 'center' }}>{error}</span>}
                    </div>
                </div>

                {/* Results */}
                {result && (
                    <>
                        {/* Stats Bar */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: 12,
                            marginBottom: 24,
                        }}>
                            {[
                                { label: 'Total Alerts', value: result.stats.total, color: '#fff' },
                                { label: 'Parsed OK', value: result.stats.parsed, color: '#00ff88' },
                                { label: 'Failed', value: result.stats.failed, color: result.stats.failed > 0 ? '#ff4444' : '#666' },
                                { label: 'Unique Brokers', value: result.stats.uniqueBrokers, color: '#818cf8' },
                                { label: 'Unique Corridors', value: result.stats.uniqueCorridors, color: '#f59e0b' },
                                { label: 'New Contacts', value: result.stats.newBrokersAdded, color: '#06b6d4' },
                            ].map(stat => (
                                <div key={stat.label} style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 12,
                                    padding: '14px 16px',
                                    textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                                    <div style={{ fontSize: 11, color: '#888', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Position Breakdown */}
                        <div style={{
                            display: 'flex',
                            gap: 8,
                            marginBottom: 20,
                            padding: '12px 16px',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: 10,
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            {Object.entries(result.stats.positionBreakdown).map(([pos, count]) => (
                                <div key={pos} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '4px 12px',
                                    borderRadius: 20,
                                    background: `${POSITION_COLORS[pos] || '#666'}15`,
                                    border: `1px solid ${POSITION_COLORS[pos] || '#666'}40`,
                                }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: POSITION_COLORS[pos] || '#666' }} />
                                    <span style={{ fontSize: 13, color: POSITION_COLORS[pos] || '#666', fontWeight: 600, textTransform: 'capitalize' }}>{pos}</span>
                                    <span style={{ fontSize: 13, color: '#888' }}>{count}</span>
                                </div>
                            ))}
                        </div>

                        {/* View Mode Tabs */}
                        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4 }}>
                            {[
                                { key: 'feed' as const, label: '📋 Load Feed', count: result.parsed.length },
                                { key: 'corridors' as const, label: '🗺️ Corridor Heat', count: corridorEntries.length },
                                { key: 'brokers' as const, label: '👤 Broker Contacts', count: uniqueBrokers.length },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setViewMode(tab.key)}
                                    style={{
                                        flex: 1,
                                        padding: '10px 16px',
                                        borderRadius: 8,
                                        border: 'none',
                                        background: viewMode === tab.key ? 'rgba(0,255,136,0.12)' : 'transparent',
                                        color: viewMode === tab.key ? '#00ff88' : '#888',
                                        fontWeight: 600,
                                        fontSize: 13,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {tab.label} ({tab.count})
                                </button>
                            ))}
                        </div>

                        {/* Feed View */}
                        {viewMode === 'feed' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {result.parsed.map((load, i) => (
                                    <div key={i} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '12px 16px',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: 10,
                                        borderLeft: `3px solid ${POSITION_COLORS[load.position] || '#666'}`,
                                    }}>
                                        <span style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            padding: '3px 8px',
                                            borderRadius: 4,
                                            background: `${POSITION_COLORS[load.position] || '#666'}20`,
                                            color: POSITION_COLORS[load.position] || '#666',
                                            textTransform: 'uppercase',
                                            minWidth: 50,
                                            textAlign: 'center',
                                        }}>
                                            {load.position}
                                        </span>
                                        <span style={{ fontWeight: 600, color: '#fff', minWidth: 180 }}>{load.company}</span>
                                        <span style={{ color: '#888', fontSize: 13, flex: 1 }}>{load.route}</span>
                                        <span style={{ color: '#666', fontSize: 13, fontFamily: 'monospace' }}>{load.phone}</span>
                                        {load.rate && (
                                            <span style={{
                                                fontWeight: 700,
                                                color: '#00ff88',
                                                fontSize: 14,
                                                padding: '3px 10px',
                                                borderRadius: 6,
                                                background: 'rgba(0,255,136,0.1)',
                                            }}>
                                                ${load.rate}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Corridors View */}
                        {viewMode === 'corridors' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {corridorEntries.map(([corridor, count]) => {
                                    const maxCount = corridorEntries[0]?.[1] || 1;
                                    const pct = (count / maxCount) * 100;
                                    return (
                                        <div key={corridor} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 16,
                                            padding: '12px 16px',
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            borderRadius: 10,
                                        }}>
                                            <span style={{ fontWeight: 700, fontSize: 15, color: '#fff', minWidth: 80 }}>{corridor}</span>
                                            <div style={{ flex: 1, height: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${pct}%`,
                                                    background: count >= 3 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : count >= 2 ? 'linear-gradient(90deg, #06b6d4, #3b82f6)' : 'rgba(255,255,255,0.1)',
                                                    borderRadius: 6,
                                                    transition: 'width 0.5s ease',
                                                }} />
                                            </div>
                                            <span style={{ fontWeight: 700, fontSize: 18, color: count >= 3 ? '#f59e0b' : '#fff', minWidth: 30, textAlign: 'right' }}>{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Brokers View */}
                        {viewMode === 'brokers' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {uniqueBrokers.map((broker, i) => {
                                    const loadCount = result.parsed.filter(p => p.phone === broker.phone).length;
                                    return (
                                        <div key={i} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 16,
                                            padding: '14px 18px',
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            borderRadius: 10,
                                        }}>
                                            <div style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: '50%',
                                                background: loadCount >= 3 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 18,
                                                border: loadCount >= 3 ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.08)',
                                            }}>
                                                {loadCount >= 3 ? '🔥' : '👤'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700, color: '#fff' }}>{broker.company}</div>
                                                <div style={{ fontSize: 12, color: '#888' }}>{loadCount} load{loadCount > 1 ? 's' : ''} posted</div>
                                            </div>
                                            <a href={`tel:${broker.phone}`} style={{
                                                padding: '8px 16px',
                                                borderRadius: 8,
                                                background: 'rgba(0,255,136,0.1)',
                                                border: '1px solid rgba(0,255,136,0.2)',
                                                color: '#00ff88',
                                                fontWeight: 600,
                                                fontSize: 13,
                                                textDecoration: 'none',
                                                fontFamily: 'monospace',
                                            }}>
                                                {broker.phone}
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
