/**
 * MemberList — Who's In Channel + Speaking Indicator
 *
 * Displays channel members from Supabase Presence state.
 * Shows who's currently talking with a green pulsing dot.
 */

'use client';

import React from 'react';
import type { CommsPresenceMember } from '@/lib/comms/types';

interface MemberListProps {
    members: CommsPresenceMember[];
    currentUserId: string;
}

export function MemberList({ members, currentUserId }: MemberListProps) {
    if (members.length === 0) {
        return (
            <div
                style={{
                    padding: '12px 16px',
                    fontSize: 13,
                    color: 'rgba(148,163,184,0.5)',
                    fontFamily: "'Inter', sans-serif",
                }}
            >
                No one else in channel yet
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {members.map((member) => {
                const isMe = member.user_id === currentUserId;

                return (
                    <div
                        key={member.user_id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 12px',
                            borderRadius: 8,
                            background: member.talking
                                ? 'rgba(34,197,94,0.08)'
                                : 'transparent',
                            transition: 'background 0.2s ease',
                        }}
                    >
                        {/* Speaking indicator */}
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: member.talking ? '#22c55e' : 'rgba(100,116,139,0.3)',
                                boxShadow: member.talking
                                    ? '0 0 8px rgba(34,197,94,0.6)'
                                    : 'none',
                                transition: 'all 0.2s ease',
                                animation: member.talking ? 'memberPulse 1.5s ease-in-out infinite' : 'none',
                                flexShrink: 0,
                            }}
                        />

                        {/* Name */}
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: member.talking ? 600 : 400,
                                color: member.talking
                                    ? '#f8fafc'
                                    : 'rgba(203,213,225,0.8)',
                                fontFamily: "'Inter', sans-serif",
                                flex: 1,
                            }}
                        >
                            {member.display_name}
                            {isMe && (
                                <span style={{ color: 'rgba(148,163,184,0.5)', fontWeight: 400 }}>
                                    {' '}(you)
                                </span>
                            )}
                        </span>

                        {/* Talking label */}
                        {member.talking && (
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: '#22c55e',
                                    letterSpacing: '0.05em',
                                    fontFamily: "'Inter', sans-serif",
                                }}
                            >
                                TALKING
                            </span>
                        )}
                    </div>
                );
            })}

            <style>{`
                @keyframes memberPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
