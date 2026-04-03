'use client';
/**
 * CommsFAB — Floating Action Button for Active Job Comms
 *
 * Persistent FAB during active job pages.
 * Expands to show PTT + quick-calls when tapped.
 * Gate behind `comms_enabled` feature flag.
 */

'use client';

import React, { useState } from 'react';
import type { PTTState, CommsStatus, CommsPresenceMember, QuickCallType } from '@/lib/comms/types';
import { TalkButton } from './TalkButton';
import { QuickCallBar } from './QuickCallBar';
import { StatusBanner } from './StatusBanner';
import { MemberList } from './MemberList';
import { EmergencyBroadcast } from './EmergencyBroadcast';

interface CommsFABProps {
    // State
    pttState: PTTState;
    status: CommsStatus;
    members: CommsPresenceMember[];
    currentUserId: string;
    channelName: string;
    memberCount: number;

    // Actions
    onPressStart: () => void;
    onPressEnd: () => void;
    onSendQuickCall: (type: QuickCallType) => void;
    onEmergency: () => Promise<void>;
    onLeave: () => void;

    // Config
    disabled?: boolean;
    lastReceivedQuickCall?: QuickCallType | null;
}

export function CommsFAB({
    pttState,
    status,
    members,
    currentUserId,
    channelName,
    memberCount,
    onPressStart,
    onPressEnd,
    onSendQuickCall,
    onEmergency,
    onLeave,
    disabled = false,
    lastReceivedQuickCall,
}: CommsFABProps) {
    const [expanded, setExpanded] = useState(false);

    // Collapsed FAB
    if (!expanded) {
        return (
            <button
                onClick={() => setExpanded(true)}
                style={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: status === 'online'
                        ? 'linear-gradient(145deg, #065f46, #022c22)'
                        : 'linear-gradient(145deg, #1e293b, #0f172a)',
                    border: `2px solid ${status === 'online' ? 'rgba(34,197,94,0.4)' : 'rgba(100,116,139,0.3)'}`,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    zIndex: 1000,
                    transition: 'all 0.2s ease',
                }}
                aria-label="Open Comms"
            >
                🎙️
                {/* Member count badge */}
                {memberCount > 0 && (
                    <span
                        style={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            background: '#3b82f6',
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 700,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid #0f172a',
                        }}
                    >
                        {memberCount}
                    </span>
                )}
            </button>
        );
    }

    // Expanded panel
    return (
        <div
            style={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                width: 'min(380px, calc(100vw - 32px))',
                maxHeight: 'calc(100vh - 120px)',
                overflowY: 'auto',
                background: 'rgba(2,6,23,0.95)',
                borderRadius: 20,
                border: '1px solid rgba(100,116,139,0.15)',
                boxShadow: '0 16px 64px rgba(0,0,0,0.7)',
                backdropFilter: 'blur(20px)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                fontFamily: "'Inter', sans-serif",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px 10px',
                    borderBottom: '1px solid rgba(100,116,139,0.1)',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                        📡 {channelName}
                    </span>
                    <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)' }}>
                        {memberCount} member{memberCount !== 1 ? 's' : ''}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatusBanner status={status} compact />
                    <button aria-label="Interactive Button"
                        onClick={() => setExpanded(false)}
                        style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: '1px solid rgba(100,116,139,0.2)',
                            background: 'transparent',
                            color: 'rgba(148,163,184,0.6)',
                            fontSize: 16,
                            cursor: 'pointer',
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* PTT Button — centered */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '20px 16px 12px',
                }}
            >
                <TalkButton
                    state={pttState}
                    onPressStart={onPressStart}
                    onPressEnd={onPressEnd}
                    disabled={disabled}
                />
            </div>

            {/* Quick-calls */}
            <div style={{ padding: '0 8px' }}>
                <QuickCallBar
                    onSend={onSendQuickCall}
                    disabled={disabled}
                    lastReceivedType={lastReceivedQuickCall}
                />
            </div>

            {/* Members */}
            <div style={{ padding: '8px 8px 4px' }}>
                <MemberList members={members} currentUserId={currentUserId} />
            </div>

            {/* Emergency + Leave */}
            <div
                style={{
                    padding: '8px 16px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    borderTop: '1px solid rgba(100,116,139,0.1)',
                    marginTop: 4,
                }}
            >
                <EmergencyBroadcast onEmergency={onEmergency} disabled={disabled} />
                <button aria-label="Interactive Button"
                    onClick={onLeave}
                    style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: 8,
                        border: '1px solid rgba(100,116,139,0.15)',
                        background: 'transparent',
                        color: 'rgba(148,163,184,0.5)',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontFamily: "'Inter', sans-serif",
                    }}
                >
                    Leave Channel
                </button>
            </div>
        </div>
    );
}
