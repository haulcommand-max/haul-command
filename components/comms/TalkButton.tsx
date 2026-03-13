/**
 * TalkButton — The BIG Glove-Friendly PTT Button
 *
 * Core interaction element. Press-and-hold to talk.
 * Min 80×80px touch target for gloved hands.
 *
 * Visual states:
 * - IDLE: dark surface, ready icon
 * - REQUESTING: pulsing border
 * - TALKING: vivid glow ring, mic icon
 * - BLOCKED: red flash, lock icon
 */

'use client';

import React, { useCallback } from 'react';
import type { PTTState } from '@/lib/comms/types';

interface TalkButtonProps {
    state: PTTState;
    onPressStart: () => void;
    onPressEnd: () => void;
    disabled?: boolean;
    size?: number;
}

export function TalkButton({
    state,
    onPressStart,
    onPressEnd,
    disabled = false,
    size = 88,
}: TalkButtonProps) {
    const handlePointerDown = useCallback(
        (e: React.PointerEvent) => {
            e.preventDefault();
            if (!disabled) onPressStart();
        },
        [disabled, onPressStart],
    );

    const handlePointerUp = useCallback(
        (e: React.PointerEvent) => {
            e.preventDefault();
            onPressEnd();
        },
        [onPressEnd],
    );

    const stateStyles: Record<PTTState, React.CSSProperties> = {
        idle: {
            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            border: '2px solid rgba(100,116,139,0.3)',
        },
        requesting: {
            background: 'linear-gradient(145deg, #1e3a5f, #0f172a)',
            boxShadow: '0 0 24px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            border: '2px solid rgba(59,130,246,0.6)',
            animation: 'pttPulse 1s ease-in-out infinite',
        },
        talking: {
            background: 'linear-gradient(145deg, #065f46, #022c22)',
            boxShadow: '0 0 32px rgba(34,197,94,0.6), 0 0 64px rgba(34,197,94,0.2)',
            border: '2px solid rgba(34,197,94,0.8)',
        },
        blocked: {
            background: 'linear-gradient(145deg, #7f1d1d, #450a0a)',
            boxShadow: '0 0 24px rgba(239,68,68,0.4)',
            border: '2px solid rgba(239,68,68,0.6)',
        },
    };

    const icons: Record<PTTState, string> = {
        idle: '🎙️',
        requesting: '⏳',
        talking: '📢',
        blocked: '🔒',
    };

    const labels: Record<PTTState, string> = {
        idle: 'PUSH TO TALK',
        requesting: 'CONNECTING...',
        talking: 'TALKING',
        blocked: 'CHANNEL BUSY',
    };

    return (
        <>
            <style>{`
                @keyframes pttPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.04); }
                }
                @keyframes talkingGlow {
                    0%, 100% { box-shadow: 0 0 32px rgba(34,197,94,0.6), 0 0 64px rgba(34,197,94,0.2); }
                    50% { box-shadow: 0 0 48px rgba(34,197,94,0.8), 0 0 96px rgba(34,197,94,0.3); }
                }
            `}</style>
            <button
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onContextMenu={(e) => e.preventDefault()}
                disabled={disabled || state === 'blocked'}
                aria-label={labels[state]}
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    userSelect: 'none',
                    touchAction: 'none',
                    WebkitTouchCallout: 'none',
                    outline: 'none',
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    opacity: disabled ? 0.5 : 1,
                    ...(state === 'talking'
                        ? { ...stateStyles[state], animation: 'talkingGlow 1.5s ease-in-out infinite' }
                        : stateStyles[state]),
                }}
            >
                <span style={{ fontSize: size * 0.32, lineHeight: 1 }}>
                    {icons[state]}
                </span>
                <span
                    style={{
                        fontSize: Math.max(9, size * 0.11),
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.85)',
                        letterSpacing: '0.08em',
                        marginTop: 4,
                    }}
                >
                    {labels[state]}
                </span>
            </button>
        </>
    );
}
