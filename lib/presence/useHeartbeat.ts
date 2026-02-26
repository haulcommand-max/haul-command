"use client";

import { useEffect, useRef } from "react";

const HEARTBEAT_INTERVAL_MS = 60_000;

/**
 * Sends a presence ping every 60s when the window is focused.
 * Powers escort dots on the map (blue dots = online).
 * Mount in any layout that wraps authenticated escort/driver users.
 */
export function useHeartbeat() {
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const ping = async () => {
        if (typeof document !== "undefined" && document.hidden) return; // tab not active
        try {
            await fetch("/api/heartbeat", { method: "POST" });
        } catch {
            // Ignore — network is non-critical for presence
        }
    };

    useEffect(() => {
        ping(); // immediate on mount
        timerRef.current = setInterval(ping, HEARTBEAT_INTERVAL_MS);

        const onVisibilityChange = () => {
            if (!document.hidden) ping(); // ping immediately on tab focus
        };
        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, []);
}
