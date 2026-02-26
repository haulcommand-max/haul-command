/**
 * useHeartbeat — client hook that pings /api/heartbeat every 2 minutes
 * when the tab is visible. Keeps last_seen_at fresh for Online/Active signals.
 *
 * Usage:
 *   useHeartbeat({ enabled: !!user });
 */
"use client";

import { useEffect, useRef } from "react";

const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

interface Options {
    enabled?: boolean;
}

export function useHeartbeat({ enabled = true }: Options = {}) {
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!enabled) return;

        async function ping() {
            // Only ping when tab is visible
            if (document.visibilityState !== "visible") return;
            try {
                await fetch("/api/heartbeat", { method: "POST" });
            } catch {
                // Silently fail — heartbeat is best-effort
            }
        }

        // Ping immediately, then on interval
        ping();
        timerRef.current = setInterval(ping, HEARTBEAT_INTERVAL_MS);

        // Also ping on visibility change (returning to tab)
        const handleVisibility = () => {
            if (document.visibilityState === "visible") ping();
        };
        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [enabled]);
}
