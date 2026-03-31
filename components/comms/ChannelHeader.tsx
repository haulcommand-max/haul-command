/**
 * ChannelHeader — Channel Name, Member Count, Guardrail Copy
 *
 * Shows the active channel info with member count and connection status.
 * Always displays the compliance guardrail copy.
 */

'use client';

import React from 'react';
import type { CommsChannel, CommsStatus } from '@/lib/comms/types';
import { GUARDRAIL_COPY } from '@/lib/comms/constants';
import { StatusBanner } from './StatusBanner';

interface ChannelHeaderProps {
    channel: CommsChannel | null;
    memberCount: number;
    status: CommsStatus;
    onLeave?: () => void;
}

export function ChannelHeader({ channel, memberCount, status, onLeave }: ChannelHeaderProps) {
    if (!channel) return null;

    const typeLabels: Record<string, string> = {
        job_channel: '📡 Job Channel',
        convoy_channel: '🚛 Convoy',
        lead_rear_private: '🔒 Lead/Rear',
        escort_only: '🚗 Escort Only',
        emergency: '🚨 Emergency',
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: '12px 16px',
                background: 'rgba(15,23,42,0.9)',
                borderRadius: 12,
                border: '1px solid rgba(100,116,139,0.15)',
                backdropFilter: 'blur(12px)',
            }}
        >
            {/* Top row: channel info + status */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span
                        style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#f8fafc',
                            fontFamily: "'Inter', sans-serif",
                        }}
                    >
                        {typeLabels[channel.channel_type] ?? '📡 Channel'}
                    </span>
                    <span
                        style={{
                            fontSize: 13,
                            color: 'rgba(148,163,184,0.8)',
                            fontFamily: "'Inter', sans-serif",
                        }}
                    >
                        {channel.display_name} • {memberCount} member{memberCount !== 1 ? 's' : ''}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatusBanner status={status} compact />
                    {onLeave && (
                        <button aria-label="Interactive Button"
                            onClick={onLeave}
                            style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(239,68,68,0.3)',
                                background: 'rgba(239,68,68,0.1)',
                                color: '#ef4444',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            Leave
                        </button>
                    )}
                </div>
            </div>

            {/* Guardrail copy */}
            <div
                style={{
                    fontSize: 10,
                    color: 'rgba(148,163,184,0.5)',
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                    fontFamily: "'Inter', sans-serif",
                }}
            >
                {GUARDRAIL_COPY}
            </div>
        </div>
    );
}
