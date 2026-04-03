'use client';

import React from 'react';
import Link from 'next/link';

/**
 * RoleAwarePostingPrompt — Social Gravity OS
 *
 * Per social_gravity_aggression_overlay:
 * "role-aware posting prompts"
 * "if social density is low, seed utility-first activity instead of showing dead empty feeds"
 *
 * Instead of a generic "Post something", this shows a role-specific action
 * that creates real platform value: job confirmation, route observation,
 * rate data submission, corridor safety tip.
 *
 * Maps to the social loop:
 *   confirm job → social proof → report card → rank → more leads
 */

type Role = 'pilot_car_operator' | 'heavy_haul_broker' | 'oversize_carrier' | 'permit_service' | 'route_surveyor' | 'anonymous';

interface Prompt {
    icon: string;
    headline: string;
    subtext: string;
    ctaLabel: string;
    ctaHref: string;
    rewardLabel: string;
    rewardColor: string;
    inputPlaceholder?: string;
    tags?: string[];
}

const ROLE_PROMPTS: Record<Role, Prompt[]> = {
    pilot_car_operator: [
        {
            icon: '✅',
            headline: 'Available today?',
            subtext: 'Quick check-in boosts your visibility 2× in local searches right now.',
            ctaLabel: 'Mark Available',
            ctaHref: '/dashboard/availability',
            rewardLabel: '2× visibility boost',
            rewardColor: '#22C55E',
        },
        {
            icon: '⭐',
            headline: 'Just finished a move?',
            subtext: 'Log it to build your report card and improve your corridor rank.',
            ctaLabel: 'Log Completed Job',
            ctaHref: '/dashboard/jobs/log',
            rewardLabel: '+Trust score',
            rewardColor: '#3B82F6',
        },
        {
            icon: '🛣️',
            headline: 'Know this corridor?',
            subtext: 'Share a route observation. Helps other operators and builds your rep.',
            ctaLabel: 'Submit Observation',
            ctaHref: '/dashboard/observations/new',
            rewardLabel: 'Corridor authority',
            rewardColor: '#8B5CF6',
            inputPlaceholder: 'Construction on I-10 near mile marker 245...',
        },
    ],
    heavy_haul_broker: [
        {
            icon: '📋',
            headline: 'Need escorts for an upcoming load?',
            subtext: 'Post your load details and receive quotes from verified escorts in your corridor.',
            ctaLabel: 'Post Load Request',
            ctaHref: '/loads/new',
            rewardLabel: 'Fast matching',
            rewardColor: '#F59E0B',
        },
        {
            icon: '💬',
            headline: 'Worked with a great escort?',
            subtext: 'Leave a verified review. Helps the community and builds your broker reputation.',
            ctaLabel: 'Write Review',
            ctaHref: '/reviews/new',
            rewardLabel: '+Broker trust',
            rewardColor: '#10B981',
        },
    ],
    oversize_carrier: [
        {
            icon: '🚛',
            headline: 'Planning a move?',
            subtext: 'Check route complexity and find available escorts before you commit.',
            ctaLabel: 'Check My Route',
            ctaHref: '/tools/route-complexity',
            rewardLabel: 'Avoid delays',
            rewardColor: '#3B82F6',
        },
        {
            icon: '📍',
            headline: 'Seen a hazard worth noting?',
            subtext: 'Submit a route observation. Carriers and escorts will thank you.',
            ctaLabel: 'Report Hazard',
            ctaHref: '/dashboard/observations/new',
            rewardLabel: 'Community rep',
            rewardColor: '#EF4444',
            inputPlaceholder: 'Low clearance at...',
        },
    ],
    permit_service: [
        {
            icon: '📄',
            headline: 'New state regs you know about?',
            subtext: 'Share permit intelligence with the community and get attribution.',
            ctaLabel: 'Share Regulation Update',
            ctaHref: '/dashboard/regulations/new',
            rewardLabel: 'Industry authority',
            rewardColor: '#F59E0B',
        },
    ],
    route_surveyor: [
        {
            icon: '🗺️',
            headline: 'Submit a route survey',
            subtext: 'Share hazards, low-clearances, or road condition changes for upcoming heavy loads.',
            ctaLabel: 'Submit Survey',
            ctaHref: '/tools/route-survey',
            rewardLabel: 'Survey credit',
            rewardColor: '#6366F1',
            inputPlaceholder: 'Route: I-40 TX → NM...',
        },
    ],
    anonymous: [
        {
            icon: '🔍',
            headline: 'Know this corridor?',
            subtext: 'Sign up to share route intelligence and earn visibility in your market.',
            ctaLabel: 'Join Free',
            ctaHref: '/auth/register',
            rewardLabel: 'Free account',
            rewardColor: '#10B981',
        },
        {
            icon: '🚗',
            headline: 'Are you a pilot car operator?',
            subtext: 'Claim your profile and start receiving load requests in your area.',
            ctaLabel: 'Claim My Profile',
            ctaHref: '/claim',
            rewardLabel: 'Free forever',
            rewardColor: '#F59E0B',
        },
    ],
};

interface Props {
    role?: Role;
    /** Cycle through multiple prompts */
    promptIndex?: number;
    geo?: string;
    compact?: boolean;
}

export function RoleAwarePostingPrompt({ role = 'anonymous', promptIndex = 0, geo, compact = false }: Props) {
    const prompts = ROLE_PROMPTS[role] ?? ROLE_PROMPTS.anonymous;
    const p = prompts[promptIndex % prompts.length];
    const [text, setText] = React.useState('');

    if (compact) {
        return (
            <div style={{
                display: 'flex', gap: 10, alignItems: 'center',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, padding: '10px 14px',
            }}>
                <span style={{ fontSize: 20 }}>{p.icon}</span>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#F0F0F0' }}>{p.headline}</div>
                    <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>{p.subtext}</div>
                </div>
                <Link href={p.ctaHref} style={{
                    padding: '6px 14px', background: 'rgba(241,169,27,0.1)', border: '1px solid rgba(241,169,27,0.2)',
                    borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#F1A91B', textDecoration: 'none', whiteSpace: 'nowrap',
                }}>
                    {p.ctaLabel}
                </Link>
            </div>
        );
    }

    return (
        <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, overflow: 'hidden',
        }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{p.icon}</span>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#F0F0F0' }}>{p.headline}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{p.subtext}{geo ? ` — near ${geo}` : ''}</div>
                </div>
            </div>

            {p.inputPlaceholder && (
                <div style={{ padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder={p.inputPlaceholder}
                        rows={2}
                        style={{
                            width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 8, padding: '8px 12px', color: '#F0F0F0', fontSize: 12, resize: 'none', outline: 'none',
                            fontFamily: 'inherit',
                        }}
                    />
                </div>
            )}

            <div style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 9px',
                    background: `${p.rewardColor}12`, color: p.rewardColor,
                    border: `1px solid ${p.rewardColor}25`, borderRadius: 8,
                }}>
                    ✦ {p.rewardLabel}
                </div>
                <Link href={p.ctaHref} style={{
                    padding: '7px 18px', background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    borderRadius: 9, color: '#000', fontSize: 12, fontWeight: 800, textDecoration: 'none',
                }}>
                    {p.ctaLabel} →
                </Link>
            </div>
        </div>
    );
}
