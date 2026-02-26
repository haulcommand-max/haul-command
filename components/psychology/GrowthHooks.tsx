'use client';

import React, { useEffect, useState } from 'react';

// ══════════════════════════════════════════════════════════════
// MILESTONE CELEBRATION — Achievement popup with confetti feel
// ══════════════════════════════════════════════════════════════

interface MilestoneProps {
    type: string;
    title: string;
    description: string;
    emoji: string;
    onDismiss: () => void;
}

const MILESTONE_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
    first_job: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', glow: '0 0 40px rgba(16,185,129,0.15)' },
    '10_jobs': { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', glow: '0 0 40px rgba(59,130,246,0.15)' },
    '50_jobs': { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)', glow: '0 0 40px rgba(168,85,247,0.15)' },
    '100_jobs': { bg: 'rgba(241,169,27,0.12)', border: 'rgba(241,169,27,0.4)', glow: '0 0 60px rgba(241,169,27,0.2)' },
    '500_jobs': { bg: 'rgba(241,169,27,0.15)', border: 'rgba(241,169,27,0.5)', glow: '0 0 80px rgba(241,169,27,0.25)' },
    top_10_leaderboard: { bg: 'rgba(241,169,27,0.15)', border: 'rgba(241,169,27,0.5)', glow: '0 0 80px rgba(241,169,27,0.3)' },
    default: { bg: 'rgba(241,169,27,0.08)', border: 'rgba(241,169,27,0.25)', glow: '0 0 30px rgba(241,169,27,0.1)' },
};

export function MilestoneCelebration({ type, title, description, emoji, onDismiss }: MilestoneProps) {
    const [visible, setVisible] = useState(false);
    const colors = MILESTONE_COLORS[type] ?? MILESTONE_COLORS.default;

    useEffect(() => {
        setTimeout(() => setVisible(true), 100);
        const timer = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 400); }, 6000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div style={{
            position: 'fixed', top: 24, right: 24, zIndex: 9999,
            maxWidth: 380, padding: '1.5rem',
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: 20,
            boxShadow: colors.glow,
            backdropFilter: 'blur(20px)',
            transform: visible ? 'translateX(0) scale(1)' : 'translateX(100%) scale(0.95)',
            opacity: visible ? 1 : 0,
            transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ fontSize: 36, lineHeight: 1, animation: 'number-pop 0.5s ease-out 0.3s both' }}>{emoji}</div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Achievement Unlocked</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#f9fafb', marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>{description}</div>
                </div>
                <button onClick={() => { setVisible(false); setTimeout(onDismiss, 400); }} style={{
                    background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 16, padding: 4,
                }}>✕</button>
            </div>
            {/* Progress bar that drains over 6 seconds */}
            <div style={{ marginTop: 12, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
                <div style={{
                    height: '100%', background: '#F1A91B', borderRadius: 1,
                    width: visible ? '0%' : '100%', transition: 'width 6s linear',
                }} />
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// URGENCY INDICATOR — "X brokers viewed this today"
// ══════════════════════════════════════════════════════════════

export function UrgencyIndicator({ viewCount, label }: { viewCount: number; label?: string }) {
    if (viewCount < 2) return null;
    const heat = viewCount >= 10 ? '#ef4444' : viewCount >= 5 ? '#f59e0b' : '#6b7280';
    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '3px 10px', borderRadius: 8,
            background: `${heat}10`,
            border: `1px solid ${heat}25`,
            animation: viewCount >= 10 ? 'pulse-gold 2s infinite' : undefined,
        }}>
            <span style={{ fontSize: 11, color: heat }}>👁</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: heat }}>
                {label || `${viewCount} brokers viewed today`}
            </span>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// LIVE ACTIVITY TICKER — Real-time event feed
// ══════════════════════════════════════════════════════════════

interface ActivityEvent {
    id: string;
    type: 'load_posted' | 'load_accepted' | 'escort_online' | 'milestone' | 'referral';
    message: string;
    timestamp: string;
}

export function LiveActivityFeed({ events }: { events: ActivityEvent[] }) {
    const [visible, setVisible] = useState<ActivityEvent[]>([]);

    useEffect(() => {
        if (events.length === 0) return;
        setVisible(events.slice(0, 5));
    }, [events]);

    const icons: Record<string, string> = {
        load_posted: '📦', load_accepted: '✅', escort_online: '🟢', milestone: '🏆', referral: '🔗',
    };

    if (visible.length === 0) return null;

    return (
        <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: '0.75rem 1rem', overflow: 'hidden',
        }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
                ⚡ Live Activity
            </div>
            {visible.map((ev, i) => (
                <div key={ev.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0',
                    borderBottom: i < visible.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                    animation: `slide-up-fade 0.3s ease-out ${i * 0.05}s both`,
                    opacity: 0,
                }}>
                    <span style={{ fontSize: 12 }}>{icons[ev.type] ?? '·'}</span>
                    <span style={{ fontSize: 11, color: '#9ca3af', flex: 1 }}>{ev.message}</span>
                    <span style={{ fontSize: 10, color: '#4b5563', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                        {timeSinceShort(ev.timestamp)}
                    </span>
                </div>
            ))}
        </div>
    );
}

function timeSinceShort(ts: string) {
    const sec = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (sec < 60) return `${sec}s`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m`;
    return `${Math.floor(sec / 3600)}h`;
}

// ══════════════════════════════════════════════════════════════
// BENCHMARK CARD — "How you compare"
// ══════════════════════════════════════════════════════════════

export function BenchmarkCard({ metrics }: { metrics: { label: string; yours: number; avg: number; top10: number; unit: string }[] }) {
    return (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.25rem' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#d1d5db', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>📊 How You Compare</div>
            {metrics.map((m, i) => {
                const pct = Math.min(1, m.yours / Math.max(m.top10, 1));
                const color = pct >= 0.8 ? '#10b981' : pct >= 0.5 ? '#f59e0b' : '#6b7280';
                return (
                    <div key={m.label} style={{ marginBottom: i < metrics.length - 1 ? 16 : 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>{m.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#f9fafb', fontFamily: "'JetBrains Mono', monospace" }}>
                                {m.yours}{m.unit}
                            </span>
                        </div>
                        <div style={{ position: 'relative', height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 3 }}>
                            {/* Average marker */}
                            <div style={{ position: 'absolute', left: `${(m.avg / Math.max(m.top10, 1)) * 100}%`, top: -2, width: 1, height: 10, background: '#4b5563' }} />
                            {/* Your bar */}
                            <div style={{ height: '100%', width: `${pct * 100}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease-out' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                            <span style={{ fontSize: 9, color: '#4b5563' }}>Avg: {m.avg}{m.unit}</span>
                            <span style={{ fontSize: 9, color: '#4b5563' }}>Top 10: {m.top10}{m.unit}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
// REFERRAL SHARE CARD — Viral loop driver
// ══════════════════════════════════════════════════════════════

export function ReferralShareCard({ code, earned, referrals }: { code: string; earned: number; referrals: number }) {
    const [copied, setCopied] = useState(false);
    const link = `https://haulcommand.com/join?ref=${code}`;

    const copy = () => {
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(241,169,27,0.08), rgba(241,169,27,0.02))',
            border: '1px solid rgba(241,169,27,0.2)',
            borderRadius: 18, padding: '1.5rem', position: 'relative', overflow: 'hidden',
        }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
                    🔗 Refer & Earn $25
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#f9fafb', marginBottom: 4 }}>
                    Share Haul Command. Get paid when they complete their first job.
                </div>
                <div style={{ display: 'flex', gap: 16, margin: '16px 0' }}>
                    <div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#F1A91B', fontFamily: "'JetBrains Mono', monospace" }}>{referrals}</div>
                        <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase' }}>Referrals</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#10b981', fontFamily: "'JetBrains Mono', monospace" }}>${earned}</div>
                        <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase' }}>Earned</div>
                    </div>
                </div>

                {/* Referral link */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{
                        flex: 1, padding: '8px 12px', borderRadius: 8,
                        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
                        color: '#9ca3af', fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {link}
                    </div>
                    <button onClick={copy} style={{
                        padding: '8px 20px', borderRadius: 8, border: 'none',
                        background: copied ? '#10b981' : '#F1A91B', color: '#000',
                        fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                        {copied ? '✓ Copied' : '📋 Copy'}
                    </button>
                </div>
            </div>
        </div>
    );
}
