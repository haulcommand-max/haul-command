/**
 * EmergencyBroadcast — Emergency Button with 2-Step Confirmation
 *
 * RED button that requires a confirmation step before broadcasting.
 * Prevents accidental emergency triggers with gloved hands.
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';

interface EmergencyBroadcastProps {
    onEmergency: () => Promise<void>;
    disabled?: boolean;
}

export function EmergencyBroadcast({ onEmergency, disabled = false }: EmergencyBroadcastProps) {
    const [confirming, setConfirming] = useState(false);
    const [sent, setSent] = useState(false);

    // Auto-reset confirm state after 5 seconds
    useEffect(() => {
        if (!confirming) return;
        const timer = setTimeout(() => setConfirming(false), 5000);
        return () => clearTimeout(timer);
    }, [confirming]);

    // Auto-reset sent state after 3 seconds
    useEffect(() => {
        if (!sent) return;
        const timer = setTimeout(() => setSent(false), 3000);
        return () => clearTimeout(timer);
    }, [sent]);

    const handleClick = useCallback(async () => {
        if (sent) return;

        if (!confirming) {
            setConfirming(true);
            return;
        }

        // Second click = confirmed
        setConfirming(false);
        setSent(true);
        await onEmergency();
    }, [confirming, sent, onEmergency]);

    const label = sent
        ? '🚨 SENT'
        : confirming
            ? '⚠️ CONFIRM EMERGENCY'
            : '🚨 EMERGENCY';

    return (
        <button
            onClick={handleClick}
            disabled={disabled || sent}
            style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: confirming
                    ? '2px solid #ef4444'
                    : '2px solid rgba(239,68,68,0.3)',
                background: sent
                    ? 'rgba(34,197,94,0.15)'
                    : confirming
                        ? 'rgba(239,68,68,0.2)'
                        : 'rgba(239,68,68,0.08)',
                color: sent ? '#22c55e' : '#ef4444',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.06em',
                cursor: disabled || sent ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Inter', sans-serif",
                animation: confirming ? 'emergencyFlash 0.8s ease-in-out infinite' : 'none',
                opacity: disabled ? 0.5 : 1,
            }}
        >
            {label}
            <style>{`
                @keyframes emergencyFlash {
                    0%, 100% { border-color: #ef4444; }
                    50% { border-color: #f97316; }
                }
            `}</style>
        </button>
    );
}
