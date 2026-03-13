/**
 * StatusBanner — Computed Comms Status Display
 *
 * Shows: Online / Nearby Only / No Comms
 * Ephemeral — computed from transport health, NEVER from DB.
 */

'use client';

import React from 'react';
import type { CommsStatus } from '@/lib/comms/types';
import { STATUS_LABELS } from '@/lib/comms/constants';

interface StatusBannerProps {
    status: CommsStatus;
    compact?: boolean;
}

export function StatusBanner({ status, compact = false }: StatusBannerProps) {
    const config = STATUS_LABELS[status];

    if (compact) {
        return (
            <span
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: config.color,
                    fontFamily: "'Inter', sans-serif",
                }}
            >
                <span style={{ fontSize: 10 }}>{config.icon}</span>
                {config.label}
            </span>
        );
    }

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 8,
                background: `${config.color}12`,
                border: `1px solid ${config.color}30`,
                fontSize: 13,
                fontWeight: 600,
                color: config.color,
                fontFamily: "'Inter', sans-serif",
            }}
        >
            <span style={{ fontSize: 12 }}>{config.icon}</span>
            {config.label}
        </div>
    );
}
