'use client';

/**
 * Broker View Notification — "the killer nudge"
 *
 * Copy:
 *   "👀 a broker viewed your profile"
 *   "complete your profile to improve your chances."
 *   CTA: "finish now"
 *
 * Triggered via realtime subscription or polling.
 * Includes: viewer count, recency indicator, profile score context.
 */

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface BrokerViewNotification {
    id: string;
    viewer_role: string;
    source: string;
    created_at: string;
}

export function BrokerViewNudge({
    userId,
    profileScore,
    onFinishProfile,
}: {
    userId: string;
    profileScore: number;
    onFinishProfile?: () => void;
}) {
    const supabase = createClient();
    const [views, setViews] = useState<BrokerViewNotification[]>([]);
    const [dismissed, setDismissed] = useState(false);
    const [showAnimation, setShowAnimation] = useState(false);

    useEffect(() => {
        // Fetch recent broker views
        async function load() {
            const dayAgo = new Date(Date.now() - 86400000).toISOString();
            const { data } = await supabase
                .from('profile_views')
                .select('id, viewer_role, source, created_at')
                .eq('profile_user_id', userId)
                .eq('viewer_role', 'broker')
                .gte('created_at', dayAgo)
                .order('created_at', { ascending: false })
                .limit(5);
            setViews(data ?? []);
        }
        load();

        // Subscribe to new broker views
        const channel = supabase
            .channel(`profile_views:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'profile_views',
                    filter: `profile_user_id=eq.${userId}`,
                },
                (payload: any) => {
                    if (payload.new?.viewer_role === 'broker') {
                        setViews(prev => [payload.new, ...prev].slice(0, 5));
                        setDismissed(false);
                        setShowAnimation(true);
                        setTimeout(() => setShowAnimation(false), 3000);
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [userId, supabase]);

    if (views.length === 0 || dismissed || profileScore >= 80) return null;

    const latestView = views[0];
    const timeAgo = timeSince(new Date(latestView.created_at));

    return (
        <div style={{
            background: showAnimation
                ? 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.04))'
                : 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.02))',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 14,
            padding: '16px 20px',
            fontFamily: "'Inter', system-ui, sans-serif",
            animation: showAnimation ? 'nudgePulse 0.5s ease-out' : 'none',
            position: 'relative',
        }}>
            {/* Dismiss */}
            <button
                onClick={() => setDismissed(true)}
                style={{
                    position: 'absolute', top: 8, right: 12,
                    background: 'none', border: 'none', color: '#475569',
                    fontSize: 14, cursor: 'pointer', padding: 0,
                }}
            >
                ×
            </button>

            {/* Content */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(99,102,241,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                }}>
                    👀
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#c7d2fe' }}>
                        a broker viewed your profile
                    </div>
                    <div style={{ fontSize: 11, color: '#818cf8', marginTop: 2 }}>
                        {views.length > 1 ? `${views.length} views today · ` : ''}{timeAgo}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                        complete your profile to improve your chances.
                    </div>
                </div>

                <button
                    onClick={() => onFinishProfile?.()}
                    style={{
                        padding: '8px 16px', borderRadius: 8, border: 'none',
                        background: '#6366f1', color: '#fff',
                        fontSize: 12, fontWeight: 800, cursor: 'pointer',
                        whiteSpace: 'nowrap',
                    }}
                >
                    finish now
                </button>
            </div>

            <style>{`
                @keyframes nudgePulse { 0% { transform: scale(1); } 50% { transform: scale(1.01); } 100% { transform: scale(1); } }
            `}</style>
        </div>
    );
}

/**
 * App Download Prompt — shown after profile claim
 *
 * Copy:
 *   "want instant load alerts?"
 *   "download the app to get real-time notifications."
 *   CTA: "enable alerts"
 */
export function AppDownloadPrompt({
    onEnable,
    onDismiss,
}: {
    onEnable?: () => void;
    onDismiss?: () => void;
}) {
    const [dismissed, setDismissed] = useState(false);
    if (dismissed) return null;

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(34,197,94,0.02))',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 14,
            padding: '16px 20px',
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(34,197,94,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                }}>
                    📱
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#86efac' }}>
                        want instant load alerts?
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        download the app to get real-time notifications.
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                        onClick={() => { setDismissed(true); onDismiss?.(); }}
                        style={{
                            padding: '8px 12px', borderRadius: 8, border: '1px solid #1e293b',
                            background: 'transparent', color: '#64748b',
                            fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        }}
                    >
                        later
                    </button>
                    <button
                        onClick={() => onEnable?.()}
                        style={{
                            padding: '8px 16px', borderRadius: 8, border: 'none',
                            background: '#22c55e', color: '#fff',
                            fontSize: 12, fontWeight: 800, cursor: 'pointer',
                        }}
                    >
                        enable alerts
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Leaderboard Gate Banner — shown when profile < 60%
 *
 * Copy:
 *   "complete 60% to appear on the leaderboard."
 *   CTA: "get to 60%"
 */
export function LeaderboardGateBanner({
    currentScore,
    onAction,
}: {
    currentScore: number;
    onAction?: () => void;
}) {
    if (currentScore >= 60) return null;

    return (
        <div style={{
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>🏆</span>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#818cf8' }}>
                    complete 60% to appear on the leaderboard.
                </div>
                <div style={{ fontSize: 10, color: '#6366f1', marginTop: 2 }}>
                    you're at {currentScore}% — {60 - currentScore}% to go.
                </div>
            </div>
            <button
                onClick={() => onAction?.()}
                style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none',
                    background: '#6366f1', color: '#fff',
                    fontSize: 11, fontWeight: 800, cursor: 'pointer',
                    whiteSpace: 'nowrap',
                }}
            >
                get to 60%
            </button>
        </div>
    );
}

function timeSince(date: Date): string {
    const sec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (sec < 60) return 'just now';
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
}

export default BrokerViewNudge;
