'use client';

import React from 'react';
import { Activity, Clock, ShieldCheck, Phone, Award } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ══════════════════════════════════════════════════════════════
   ProfileFreshness — Profile data age + last activity indicator
   
   Shows on every profile:
   - Last seen / last active signal
   - Profile freshness age
   - Recent activity count
   - Verification tier
   - Profile strength
   
   This answers: "Is this operator real? Are they active?"
   ══════════════════════════════════════════════════════════════ */

interface ProfileFreshnessProps {
    lastActiveAt?: string | null;
    profileUpdatedAt?: string | null;
    recentActivityCount?: number;
    isClaimed?: boolean;
    isVerified?: boolean;
    completionPercent?: number;
    responseTimeStr?: string;
    /** 'inline' for embedding in profile header, 'bar' for standalone strip */
    variant?: 'inline' | 'bar';
    className?: string;
}

function getActivityStatus(lastActive: string | null): {
    label: string;
    color: string;
    isRecent: boolean;
} {
    if (!lastActive) return { label: 'Activity unknown', color: '#6B7280', isRecent: false };

    const diff = Date.now() - new Date(lastActive).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return { label: 'Active now', color: '#22C55E', isRecent: true };
    if (hours < 24) return { label: `Active ${hours}h ago`, color: '#22C55E', isRecent: true };
    if (days < 3) return { label: `Active ${days}d ago`, color: '#F59E0B', isRecent: true };
    if (days < 7) return { label: `Active ${days}d ago`, color: '#F59E0B', isRecent: false };
    if (days < 30) return { label: `Active ${days}d ago`, color: '#EF4444', isRecent: false };
    return { label: 'Inactive', color: '#6B7280', isRecent: false };
}

function getFreshnessLabel(updatedAt: string | null): string {
    if (!updatedAt) return 'Not yet updated';
    const diff = Date.now() - new Date(updatedAt).getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return 'Updated today';
    if (days < 7) return `Updated ${days}d ago`;
    if (days < 30) return `Updated ${Math.floor(days / 7)}w ago`;
    return `Updated ${Math.floor(days / 30)}mo ago`;
}

export function ProfileFreshness({
    lastActiveAt,
    profileUpdatedAt,
    recentActivityCount = 0,
    isClaimed = false,
    isVerified = false,
    completionPercent = 0,
    responseTimeStr,
    variant = 'bar',
    className,
}: ProfileFreshnessProps) {
    const activity = getActivityStatus(lastActiveAt ?? null);
    const freshness = getFreshnessLabel(profileUpdatedAt ?? null);

    if (variant === 'inline') {
        return (
            <div className={cn('flex items-center gap-2 flex-wrap', className)}>
                {/* Activity dot */}
                <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '2px 8px', borderRadius: 6,
                    background: `${activity.color}15`,
                    border: `1px solid ${activity.color}30`,
                }}>
                    <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: activity.color,
                    }} />
                    <span style={{
                        fontSize: 10, fontWeight: 700, color: activity.color,
                    }}>
                        {activity.label}
                    </span>
                </span>

                {isVerified && (
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        padding: '2px 8px', borderRadius: 6,
                        background: 'rgba(59,130,246,0.1)',
                        border: '1px solid rgba(59,130,246,0.2)',
                    }}>
                        <ShieldCheck style={{ width: 10, height: 10, color: '#3B82F6' }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#3B82F6' }}>
                            Verified
                        </span>
                    </span>
                )}

                {isClaimed && (
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        padding: '2px 8px', borderRadius: 6,
                        background: 'rgba(34,197,94,0.1)',
                        border: '1px solid rgba(34,197,94,0.2)',
                    }}>
                        <Award style={{ width: 10, height: 10, color: '#22C55E' }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#22C55E' }}>
                            Claimed
                        </span>
                    </span>
                )}
            </div>
        );
    }

    // Bar variant — full-width strip
    return (
        <div className={className} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '10px 16px', borderRadius: 12,
            background: 'var(--hc-surface, rgba(255,255,255,0.03))',
            border: '1px solid var(--hc-border, rgba(255,255,255,0.06))',
            flexWrap: 'wrap',
        }}>
            {/* Activity signal */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: activity.color,
                    boxShadow: activity.isRecent ? `0 0 8px ${activity.color}40` : 'none',
                }} />
                <span style={{
                    fontSize: 11, fontWeight: 700, color: activity.color,
                }}>
                    {activity.label}
                </span>
            </div>

            {/* Divider */}
            <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.08)' }} />

            {/* Freshness */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock style={{ width: 11, height: 11, color: 'var(--hc-subtle, #5A6577)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--hc-muted, #8fa3b8)' }}>
                    {freshness}
                </span>
            </div>

            {/* Recent activity */}
            {recentActivityCount > 0 && (
                <>
                    <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.08)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Activity style={{ width: 11, height: 11, color: 'var(--hc-subtle, #5A6577)' }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--hc-muted, #8fa3b8)' }}>
                            {recentActivityCount} recent action{recentActivityCount !== 1 ? 's' : ''}
                        </span>
                    </div>
                </>
            )}

            {/* Response time */}
            {responseTimeStr && (
                <>
                    <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.08)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone style={{ width: 11, height: 11, color: 'var(--hc-subtle, #5A6577)' }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--hc-muted, #8fa3b8)' }}>
                            Responds in {responseTimeStr}
                        </span>
                    </div>
                </>
            )}

            {/* Profile strength */}
            {completionPercent > 0 && completionPercent < 100 && (
                <>
                    <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.08)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                            width: 40, height: 4, borderRadius: 2,
                            background: 'rgba(255,255,255,0.06)',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                width: `${completionPercent}%`, height: '100%', borderRadius: 2,
                                background: completionPercent > 70
                                    ? '#22C55E'
                                    : completionPercent > 40
                                        ? '#F59E0B'
                                        : '#EF4444',
                            }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--hc-subtle, #5A6577)' }}>
                            {completionPercent}%
                        </span>
                    </div>
                </>
            )}

            {/* Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                {isVerified && (
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        padding: '3px 8px', borderRadius: 6,
                        background: 'rgba(59,130,246,0.1)',
                    }}>
                        <ShieldCheck style={{ width: 11, height: 11, color: '#3B82F6' }} />
                        <span style={{ fontSize: 9, fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Verified
                        </span>
                    </span>
                )}
                {isClaimed && (
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        padding: '3px 8px', borderRadius: 6,
                        background: 'rgba(34,197,94,0.1)',
                    }}>
                        <Award style={{ width: 11, height: 11, color: '#22C55E' }} />
                        <span style={{ fontSize: 9, fontWeight: 800, color: '#22C55E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Claimed
                        </span>
                    </span>
                )}
            </div>
        </div>
    );
}

export default ProfileFreshness;
