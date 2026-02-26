'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { THRESHOLDS } from '@/lib/ads/adrank';

/**
 * useAdImpression — Hook for impression confirmation + dwell tracking
 * 
 * Attaches to a ref element. When the ad enters viewport (50% visible)
 * and dwells for >= 800ms, sends confirmation to backend.
 * 
 * Usage:
 *   const { ref, confirmed } = useAdImpression({ impressionToken, sessionId });
 *   return <div ref={ref}>...</div>;
 */

interface UseAdImpressionOptions {
    impressionToken: string | null;
    sessionId: string;
    onConfirm?: () => void;
}

export function useAdImpression({ impressionToken, sessionId, onConfirm }: UseAdImpressionOptions) {
    const ref = useRef<HTMLDivElement>(null);
    const confirmedRef = useRef(false);
    const enterTimeRef = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const confirm = useCallback(async (dwellMs: number) => {
        if (confirmedRef.current || !impressionToken) return;
        confirmedRef.current = true;

        try {
            const supabase = createClient();
            await supabase.rpc('confirm_impression', {
                p_impression_token: impressionToken,
                p_dwell_ms: dwellMs,
                p_session_id: sessionId,
            });
            onConfirm?.();
        } catch {
            confirmedRef.current = false; // allow retry
        }
    }, [impressionToken, sessionId, onConfirm]);

    useEffect(() => {
        if (!ref.current || !impressionToken || confirmedRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (!entry) return;

                if (entry.isIntersecting) {
                    // Ad entered viewport — start dwell timer
                    enterTimeRef.current = Date.now();
                    timerRef.current = setTimeout(() => {
                        const dwell = enterTimeRef.current
                            ? Date.now() - enterTimeRef.current
                            : 0;
                        if (dwell >= THRESHOLDS.dwell_ms_billable) {
                            confirm(dwell);
                        }
                    }, THRESHOLDS.dwell_ms_billable + 50); // small buffer
                } else {
                    // Ad left viewport — cancel timer, check partial dwell
                    if (timerRef.current) clearTimeout(timerRef.current);
                    if (enterTimeRef.current) {
                        const dwell = Date.now() - enterTimeRef.current;
                        if (dwell >= THRESHOLDS.dwell_ms_billable) {
                            confirm(dwell);
                        }
                    }
                    enterTimeRef.current = null;
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(ref.current);

        return () => {
            observer.disconnect();
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [impressionToken, confirm]);

    return { ref, confirmed: confirmedRef.current };
}
