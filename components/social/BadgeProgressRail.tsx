'use client';

import React from 'react';
import Link from 'next/link';
import { STREAK_BADGES, type StreakState, type StreakBadge } from '@/lib/engagement/habit-loop-engine';

/**
 * BadgeProgressRail — Social Gravity: Badge & Streak Progression Visibility
 *
 * Surfaces the habit-loop-engine's badge system publicly.
 * Per social_gravity_aggression_overlay:
 *  - "badge and rank progression visibility"
 *  - "claim -> improve profile -> visibility lift -> badge -> more claims"
 *
 * Use cases:
 *  1. Public profile pages — show earned badges
 *  2. Dashboard — show progress toward next badge
 *  3. Claim page — show what badges they'll unlock
 *  4. Directory listings — show badge icons inline
 */

interface Props {
    /** Pass actual streak state for logged-in users */
    streakState?: StreakState;
    /** Or just show the badge system (anonymous / onboarding) */
    showPreview?: boolean;
    variant?: 'compact' | 'full' | 'inline';
    className?: string;
}

const BADGE_COLORS: Record<string, string> = {
    'Getting Started': '#22C55E',
    'Reliable': '#3B82F6',
    'Consistent': '#8B5CF6',
    'Iron': '#6B7280',
    'Titanium': '#F59E0B',
    'Diamond': '#06B6D4',
};

function BadgeChip({ badge, earned, progress }: { badge: StreakBadge; earned: boolean; progress?: number }) {
    const color = BADGE_COLORS[badge.name] ?? '#6B7280';
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px',
            background: earned ? `${color}12` : 'rgba(255,255,255,0.03)',
            border: `1px solid ${earned ? color + '30' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 10,
            opacity: earned ? 1 : 0.55,
            transition: 'all 0.15s',
        }}>
            <span style={{ fontSize: 20, filter: earned ? 'none' : 'grayscale(1)' }}>{badge.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: earned ? color : '#6B7280', whiteSpace: 'nowrap' }}>
                    {badge.name}
                </div>
                <div style={{ fontSize: 10, color: '#4B5563' }}>
                    {badge.threshold}-day streak
                    {badge.unlockedAt && (
                        <span style={{ color: color, marginLeft: 4 }}>
                            ✓ Earned {new Date(badge.unlockedAt).toLocaleDateString()}
                        </span>
                    )}
                </div>
                {/* Progress bar toward next badge */}
                {!earned && typeof progress === 'number' && (
                    <div style={{ marginTop: 4, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(progress, 100)}%`, background: color, borderRadius: 2, transition: 'width 0.4s' }} />
                    </div>
                )}
            </div>
            {earned && (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
            )}
        </div>
    );
}

export function BadgeProgressRail({ streakState, showPreview = false, variant = 'full' }: Props) {
    const currentStreak = streakState?.currentStreak ?? 0;
    const earnedBadgeNames = new Set((streakState?.badges ?? []).map(b => b.name));

    // Find next badge to earn
    const nextBadge = STREAK_BADGES.find(b => !earnedBadgeNames.has(b.name));
    const progressToNext = nextBadge
        ? Math.round((currentStreak / nextBadge.threshold) * 100)
        : 100;

    if (variant === 'inline') {
        // Just show earned badge icons in a row
        const earned = STREAK_BADGES.filter(b => earnedBadgeNames.has(b.name));
        return (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {earned.map(b => (
                    <span key={b.name} style={{ fontSize: 16 }} title={b.name}>{b.icon}</span>
                ))}
                {earned.length === 0 && <span style={{ fontSize: 11, color: '#6B7280' }}>No badges yet</span>}
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#F0F0F0' }}>
                        🔥 {currentStreak}-day streak
                    </span>
                    {nextBadge && (
                        <span style={{ fontSize: 10, color: '#6B7280' }}>
                            {nextBadge.threshold - currentStreak}d to {nextBadge.icon} {nextBadge.name}
                        </span>
                    )}
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progressToNext}%`, background: 'linear-gradient(90deg, #F59E0B, #EF4444)', borderRadius: 2 }} />
                </div>
            </div>
        );
    }

    // Full variant
    return (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#F0F0F0' }}>Availability Badges</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Check in daily to earn streak badges and boost visibility</div>
                </div>
                {currentStreak > 0 && (
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: '#F59E0B' }}>🔥 {currentStreak}</div>
                        <div style={{ fontSize: 9, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1 }}>Day Streak</div>
                    </div>
                )}
            </div>

            {/* Badge grid */}
            <div style={{ padding: '16px 20px' }}>
                {showPreview && !streakState && (
                    <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(241,169,27,0.06)', border: '1px solid rgba(241,169,27,0.15)', borderRadius: 9, fontSize: 11, color: '#D97706' }}>
                        <strong>Claim your profile</strong> to start earning badges and boosting your rank.
                    </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
                    {STREAK_BADGES.map(badge => {
                        const earned = earnedBadgeNames.has(badge.name);
                        const earnedBadge = streakState?.badges.find(b => b.name === badge.name);
                        const progress = !earned ? Math.round((currentStreak / badge.threshold) * 100) : undefined;
                        return (
                            <BadgeChip
                                key={badge.name}
                                badge={earned && earnedBadge ? earnedBadge : badge}
                                earned={earned}
                                progress={progress}
                            />
                        );
                    })}
                </div>

                {/* Next action CTA */}
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>
                        {nextBadge
                            ? `${nextBadge.threshold - currentStreak} more days to unlock ${nextBadge.name}`
                            : '🎉 All badges earned!'}
                    </span>
                    {!streakState && (
                        <Link href="/claim" style={{ fontSize: 11, fontWeight: 700, color: '#F1A91B', textDecoration: 'none' }}>
                            Start Earning Badges →
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
