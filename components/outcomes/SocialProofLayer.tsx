'use client';

/**
 * SocialProofLayer — Band D Rank 5
 * Recent wins, success examples, claimed profile upgrades.
 */

import { useState, useEffect } from 'react';
import { track } from '@/lib/telemetry';

interface WinItem {
    type: string; entity?: string; detail: string; timestamp: string; market?: string | null;
    confidence: string;
}

function timeAgo(ts: string): string {
    const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}

export function RecentWinsModule({ state, corridor, limit = 5 }: {
    state?: string; corridor?: string; limit?: number;
}) {
    const [wins, setWins] = useState<WinItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const p = new URLSearchParams();
        if (state) p.set('state', state);
        if (corridor) p.set('corridor', corridor);
        p.set('limit', String(limit));
        fetch(`/api/outcomes?${p}`)
            .then(r => r.ok ? r.json() : { outcomes: [] })
            .then(d => {
                const real = (d.outcomes || []).filter((o: WinItem) =>
                    ['load_filled', 'likely_filled', 'claim_completed', 'offer_accepted', 'rescue_succeeded'].includes(o.type)
                );
                setWins(real); setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [state, corridor, limit]);

    useEffect(() => {
        if (!loading) track('social_proof_seen' as any, { metadata: { state, corridor, count: wins.length } });
    }, [loading, wins.length, state, corridor]);

    if (loading || wins.length === 0) return null;

    const typeEmoji: Record<string, string> = {
        load_filled: '✓', likely_filled: '○', claim_completed: '🛡', offer_accepted: '🤝', rescue_succeeded: '🚨',
    };

    return (
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>People Are Winning Here</div>
                <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(34,197,94,0.08)', color: '#22C55E' }}>REAL</span>
            </div>
            <div style={{ padding: '4px 0' }}>
                {wins.slice(0, limit).map((w, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 18px' }}>
                        <span style={{ fontSize: 12 }}>{typeEmoji[w.type] || '●'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#ddd' }}>{w.entity || 'Operator'}</span>
                            <span style={{ fontSize: 11, color: '#888' }}> — {w.detail}</span>
                        </div>
                        <span style={{ fontSize: 9, color: '#666', whiteSpace: 'nowrap' }}>{timeAgo(w.timestamp)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ClaimUpgradeExamples() {
    const examples = [
        { before: 'Auto-generated shell', after: 'Verified profile with trust score', lift: '+340% visibility' },
        { before: 'No market rankings', after: 'Top 5 in corridor results', lift: '+12 contact intents/mo' },
        { before: 'Unknown to brokers', after: 'Matched to rescue actions', lift: 'Direct load access' },
    ];

    return (
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(241,169,27,0.12)', background: 'rgba(241,169,27,0.03)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(241,169,27,0.08)', fontSize: 13, fontWeight: 900, color: '#fff' }}>
                What Claiming Unlocks
            </div>
            {examples.map((ex, i) => (
                <div key={i} style={{ padding: '12px 18px', borderBottom: i < examples.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: '#EF4444' }}>✗</span>
                        <span style={{ fontSize: 11, color: '#888', textDecoration: 'line-through' }}>{ex.before}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: '#22C55E' }}>✓</span>
                        <span style={{ fontSize: 11, color: '#ddd', fontWeight: 700 }}>{ex.after}</span>
                        <span style={{ fontSize: 9, fontWeight: 800, color: '#22C55E', marginLeft: 'auto' }}>{ex.lift}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
