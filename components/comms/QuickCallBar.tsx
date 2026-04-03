'use client';
/**
 * QuickCallBar — 7 Canned Quick-Call Buttons
 *
 * Scrollable horizontal row of quick-call action buttons.
 * Each button sends a quick-call event via Supabase Broadcast + persists to DB.
 */

'use client';

import React from 'react';
import type { QuickCallType } from '@/lib/comms/types';
import { QUICK_CALLS, QUICK_CALL_ORDER } from '@/lib/comms/constants';

interface QuickCallBarProps {
    onSend: (type: QuickCallType) => void;
    disabled?: boolean;
    lastReceivedType?: QuickCallType | null;
}

export function QuickCallBar({ onSend, disabled = false, lastReceivedType }: QuickCallBarProps) {
    return (
        <div
            style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                padding: '8px 4px',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
            }}
        >
            {QUICK_CALL_ORDER.map((type) => {
                const def = QUICK_CALLS[type];
                const isHighlighted = lastReceivedType === type;

                return (
                    <button aria-label="Interactive Button"
                        key={type}
                        onClick={() => onSend(type)}
                        disabled={disabled}
                        title={def.description}
                        style={{
                            flexShrink: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                            padding: '10px 14px',
                            borderRadius: 12,
                            border: `1.5px solid ${isHighlighted ? def.color : 'rgba(100,116,139,0.25)'}`,
                            background: isHighlighted
                                ? `${def.color}1a`
                                : 'rgba(15,23,42,0.8)',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s ease',
                            opacity: disabled ? 0.5 : 1,
                            outline: 'none',
                            minWidth: 64,
                        }}
                    >
                        <span style={{ fontSize: 22, lineHeight: 1 }}>{def.emoji}</span>
                        <span
                            style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: isHighlighted ? def.color : 'rgba(255,255,255,0.7)',
                                letterSpacing: '0.04em',
                                whiteSpace: 'nowrap',
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            {def.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
