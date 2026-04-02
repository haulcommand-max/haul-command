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

    const ping = () => {
        if (typeof document !== "undefined" && document.hidden) return; // tab not active

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    try {
                        await fetch("/api/heartbeat", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                lat: pos.coords.latitude,
                                lon: pos.coords.longitude,
                            }),
                        });
                    } catch {
                        // ignore network failure
                    }
                },
                async () => {
                    // fallback to header-only ping if location denied
                    await fetch("/api/heartbeat", { method: "POST" }).catch(() => {});
                },
                { enableHighAccuracy: false, maximumAge: 60000, timeout: 5000 }
            );
        } else {
            fetch("/api/heartbeat", { method: "POST" }).catch(() => {});
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
