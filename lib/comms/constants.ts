/**
 * HAUL COMMAND COMMS — Constants
 *
 * Quick-call definitions, feature flags, timeouts, and guardrail copy.
 */

import type { QuickCallType } from './types';

// ── Quick-Call Definitions ───────────────────────────────────────────────────

export const QUICK_CALLS: Record<QuickCallType, {
    label: string;
    emoji: string;
    color: string;
    description: string;
}> = {
    stop:         { label: 'STOP',          emoji: '🛑', color: '#ef4444', description: 'Signal all to stop immediately' },
    hold:         { label: 'HOLD',          emoji: '✋', color: '#f59e0b', description: 'Hold position, wait for further instruction' },
    clear:        { label: 'CLEAR',         emoji: '✅', color: '#22c55e', description: 'All clear, proceed' },
    low_wire:     { label: 'LOW WIRE',      emoji: '⚡', color: '#f97316', description: 'Low wire or overhead obstruction ahead' },
    breakdown:    { label: 'BREAKDOWN',     emoji: '🔧', color: '#ef4444', description: 'Vehicle breakdown, need assistance' },
    lane_move:    { label: 'LANE MOVE',     emoji: '↔️', color: '#3b82f6', description: 'Initiating lane change or move' },
    permit_issue: { label: 'PERMIT ISSUE',  emoji: '📋', color: '#a855f7', description: 'Permit-related issue or question' },
};

export const QUICK_CALL_ORDER: QuickCallType[] = [
    'stop', 'hold', 'clear', 'low_wire', 'breakdown', 'lane_move', 'permit_issue',
];

// ── Feature Flags ────────────────────────────────────────────────────────────

export const COMMS_FEATURE_FLAGS = {
    comms_enabled:              'comms_enabled',
    nearby_mode_enabled:        'nearby_mode_enabled',
    bluetooth_ptt_enabled:      'bluetooth_ptt_enabled',
    transcript_enabled:         'transcript_enabled',
    replay_enabled:             'replay_enabled',
    route_voice_notes_enabled:  'route_voice_notes_enabled',
    hardware_bridge_enabled:    'hardware_bridge_enabled',
} as const;

// ── Timing Constants ─────────────────────────────────────────────────────────

/** Max continuous transmit before auto-release (safety) */
export const PTT_TIMEOUT_MS = 60_000;

/** Channel expiry after creation */
export const CHANNEL_EXPIRE_HOURS = 72;

/** LiveKit token TTL */
export const TOKEN_EXPIRY_SECONDS = 3600;

/** Prefix for Supabase Realtime channel names */
export const SUPABASE_COMMS_CHANNEL_PREFIX = 'comms:';

// ── Guardrail Copy ───────────────────────────────────────────────────────────

export const GUARDRAIL_COPY =
    'Supplemental communication feature. Always follow permit and state communication requirements.';

// ── Status Labels ────────────────────────────────────────────────────────────

export const STATUS_LABELS = {
    online:      { label: 'Online',       color: '#22c55e', icon: '●' },
    nearby_only: { label: 'Nearby Only',  color: '#f59e0b', icon: '◐' },
    no_comms:    { label: 'No Comms',     color: '#64748b', icon: '○' },
} as const;

// ── Pricing ──────────────────────────────────────────────────────────────────

export const COMMS_PRICING = {
    road_ready: { name: 'Road Ready', monthly: 0, annual: 0 },
    fast_lane:  { name: 'Fast Lane Comms', monthly: 4.99, annual: 49 },
} as const;
