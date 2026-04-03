'use client';
/**
 * HAUL COMMAND COMMS — Paid Feature Stubs
 *
 * Minimal stubs for Fast Lane Comms ($4.99/mo) features.
 * These are NOT fully implemented yet — just the hook interfaces
 * so the free/paid gate can be wired without building the backends.
 *
 * Phase 1 paid features (trimmed):
 * - Replay recent messages ← stub
 * - Favorite channels ← stub
 * - Quick rejoin last job ← stub
 */

'use client';

import { useState, useCallback } from 'react';
import type { CommsPlan } from '@/lib/comms/types';

// ── Plan check ───────────────────────────────────────────────────────────────

export function useCommsPlan(plan: CommsPlan) {
    const isPaid = plan === 'fast_lane';

    return {
        isPaid,
        plan,
        canReplay: isPaid,
        canFavorite: isPaid,
        canQuickRejoin: isPaid,
    };
}

// ── Replay stub ──────────────────────────────────────────────────────────────

export function useReplay(_channelId: string | null, enabled: boolean) {
    const [_messages] = useState<unknown[]>([]);

    const loadReplay = useCallback(async () => {
        if (!enabled) return;
        // Phase 2: Fetch recent quick-calls + voice events from comms_quick_calls
        // and possibly comms_voice_notes (when that table ships)
    }, [enabled]);

    return {
        messages: _messages,
        loadReplay,
        isLoading: false,
        available: enabled,
    };
}

// ── Favorites stub ───────────────────────────────────────────────────────────

export function useFavoriteChannels(_userId: string, enabled: boolean) {
    const [favorites, _setFavorites] = useState<string[]>([]);

    const toggleFavorite = useCallback(async (_channelId: string) => {
        if (!enabled) return;
        // Phase 2: Update comms_preferences.favorite_channel_ids
    }, [enabled]);

    return {
        favorites,
        toggleFavorite,
        isFavorite: (_channelId: string) => favorites.includes(_channelId),
        available: enabled,
    };
}

// ── Quick rejoin stub ────────────────────────────────────────────────────────

export function useQuickRejoin(_userId: string, enabled: boolean) {
    const [lastChannelId, _setLastChannelId] = useState<string | null>(null);

    const rejoinLast = useCallback(async () => {
        if (!enabled || !lastChannelId) return null;
        // Phase 2: Rejoin the last active channel
        return lastChannelId;
    }, [enabled, lastChannelId]);

    return {
        lastChannelId,
        rejoinLast,
        available: enabled && !!lastChannelId,
    };
}
