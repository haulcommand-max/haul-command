/**
 * hooks/useVisibility.ts
 *
 * React hook for resolving visibility tier and access rights for a listing.
 * Fetches the server RPC on mount, falls back to client-side resolution for 
 * instant rendering.
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    type AudienceTier,
    type ResolvedVisibility,
    type VisibilitySettings,
    resolveVisibility,
    DEFAULT_VISIBILITY,
} from "@/lib/trust/visibility-resolver";

interface UseVisibilityOptions {
    listingId: string;
    /** If true, skip the server RPC and rely on client-side only */
    clientOnly?: boolean;
}

interface UseVisibilityReturn {
    /** The resolved visibility state */
    visibility: ResolvedVisibility;
    /** The user's audience tier */
    tier: AudienceTier;
    /** Whether the server RPC is still loading */
    loading: boolean;
    /** Whether the user has a paid subscription */
    isPaid: boolean;
    /** Whether the user is the claimed owner */
    isOwner: boolean;
    /** Refetch visibility from server */
    refresh: () => Promise<void>;
}

export function useVisibility({ listingId, clientOnly = false }: UseVisibilityOptions): UseVisibilityReturn {
    const [serverResult, setServerResult] = useState<ResolvedVisibility | null>(null);
    const [loading, setLoading] = useState(!clientOnly);
    const [userId, setUserId] = useState<string | null>(null);
    const supabase = useMemo(() => createClient(), []);

    // Get current user
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data?.user?.id ?? null);
        });
    }, [supabase]);

    // Fetch server-side visibility resolution
    const fetchVisibility = useCallback(async () => {
        if (clientOnly) return;

        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('resolve_visibility', {
                p_viewer_id: userId,
                p_listing_id: listingId,
            });

            if (!error && data) {
                setServerResult(data as unknown as ResolvedVisibility);
            }
        } catch {
            // Server RPC failed — fall back to client-side
            console.warn('[useVisibility] Server RPC failed, using client-side resolution');
        } finally {
            setLoading(false);
        }
    }, [supabase, userId, listingId, clientOnly]);

    useEffect(() => {
        if (userId !== null || !clientOnly) {
            fetchVisibility();
        }
    }, [userId, fetchVisibility, clientOnly]);

    // Client-side fallback: derive tier from what we know
    const clientTier: AudienceTier = userId ? 'free' : 'anonymous';
    const clientResolved = resolveVisibility(clientTier, DEFAULT_VISIBILITY);

    // Use server result if available, otherwise client fallback
    const visibility = serverResult ?? clientResolved;
    const tier = visibility.tier as AudienceTier;

    return {
        visibility,
        tier,
        loading,
        isPaid: tier === 'paid' || tier === 'admin',
        isOwner: tier === 'claimed_owner',
        refresh: fetchVisibility,
    };
}

// ════════════════════════════════════════════════════════════════════════════
// OWNER VISIBILITY TOGGLE HOOK
// ════════════════════════════════════════════════════════════════════════════

interface UseVisibilityControlsOptions {
    listingId: string;
}

interface UseVisibilityControlsReturn {
    settings: VisibilitySettings;
    loading: boolean;
    saving: boolean;
    toggle: (field: keyof VisibilitySettings, value: boolean) => Promise<void>;
    refresh: () => Promise<void>;
}

export function useVisibilityControls({ listingId }: UseVisibilityControlsOptions): UseVisibilityControlsReturn {
    const [settings, setSettings] = useState<VisibilitySettings>(DEFAULT_VISIBILITY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const supabase = useMemo(() => createClient(), []);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase
            .from('profile_visibility')
            .select('*')
            .eq('listing_id', listingId)
            .single();

        if (data) {
            setSettings({
                public_profile_visible: data.public_profile_visible ?? true,
                public_report_card_visible: data.public_report_card_visible ?? true,
                public_media_visible: data.public_media_visible ?? true,
                public_contact_visible: data.public_contact_visible ?? true,
            });
        }
        setLoading(false);
    }, [supabase, listingId]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const toggle = useCallback(async (field: keyof VisibilitySettings, value: boolean) => {
        setSaving(true);
        try {
            const { data, error } = await supabase.rpc('toggle_profile_visibility', {
                p_listing_id: listingId,
                p_field: field,
                p_new_value: value,
            });

            if (!error && data?.success) {
                setSettings(prev => ({ ...prev, [field]: value }));
            } else {
                console.error('[useVisibilityControls] Toggle failed:', error || data?.error);
            }
        } finally {
            setSaving(false);
        }
    }, [supabase, listingId]);

    return {
        settings,
        loading,
        saving,
        toggle,
        refresh: fetchSettings,
    };
}
