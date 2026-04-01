"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Eye, EyeOff, Bell, BellOff, Loader2 } from "lucide-react";
import type { WatchType, DigestMode } from "@/core/social/watchlist_engine";

// ══════════════════════════════════════════════════════════════
// WatchButton — Follow/Watch toggle for corridors, operators, brokers
// Calls /api/watchlist CRUD endpoints
// ══════════════════════════════════════════════════════════════

interface WatchButtonProps {
    watchType: WatchType;
    targetId: string;
    targetLabel: string;
    digestMode?: DigestMode;
    size?: "sm" | "md";
    variant?: "icon" | "full";
    className?: string;
}

export function WatchButton({
    watchType,
    targetId,
    targetLabel,
    digestMode = "daily",
    size = "sm",
    variant = "full",
    className = "",
}: WatchButtonProps) {
    const [watching, setWatching] = useState(false);
    const [watchId, setWatchId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    // Check existing watch status on mount
    useEffect(() => {
        async function check() {
            try {
                const res = await fetch("/api/watchlist");
                if (!res.ok) { setInitialLoad(false); return; }
                const { watches } = await res.json();
                const match = watches?.find(
                    (w: any) => w.watch_type === watchType && w.target_id === targetId && w.is_active,
                );
                if (match) {
                    setWatching(true);
                    setWatchId(match.id);
                }
            } catch { /* silent */ }
            setInitialLoad(false);
        }
        check();
    }, [watchType, targetId]);

    const toggle = useCallback(async () => {
        setLoading(true);
        try {
            if (watching && watchId) {
                const res = await fetch("/api/watchlist", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ watch_id: watchId }),
                });
                if (res.ok) {
                    setWatching(false);
                    setWatchId(null);
                }
            } else {
                const res = await fetch("/api/watchlist", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        watch_type: watchType,
                        target_id: targetId,
                        target_label: targetLabel,
                        digest_mode: digestMode,
                    }),
                });
                if (res.ok) {
                    const { watch } = await res.json();
                    setWatching(true);
                    setWatchId(watch?.id ?? null);
                }
            }
        } catch { /* silent */ }
        setLoading(false);
    }, [watching, watchId, watchType, targetId, targetLabel, digestMode]);

    if (initialLoad) return null;

    const sizeClasses = size === "sm"
        ? "text-xs px-2.5 py-1.5 gap-1.5"
        : "text-sm px-3.5 py-2 gap-2";

    const Icon = watching ? EyeOff : Eye;
    const NotifIcon = watching ? BellOff : Bell;

    if (variant === "icon") {
        return (
            <button
                onClick={toggle}
                disabled={loading}
                title={watching ? `Stop watching ${targetLabel}` : `Watch ${targetLabel}`}
                className={`rounded-full border transition-colors flex items-center justify-center
                    ${watching
                        ? "bg-amber-500/15 border-amber-400/30 text-amber-400 hover:bg-amber-500/25"
                        : "bg-hc-surface border-hc-border text-hc-muted hover:text-hc-text hover:border-hc-gold-500"
                    }
                    ${size === "sm" ? "w-8 h-8" : "w-10 h-10"}
                    ${className}`}
            >
                {loading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <NotifIcon className="w-3.5 h-3.5" />
                }
            </button>
        );
    }

    return (
        <button
            onClick={toggle}
            disabled={loading}
            className={`inline-flex items-center rounded-lg border font-bold uppercase tracking-wider transition-colors
                ${watching
                    ? "bg-amber-500/15 border-amber-400/30 text-amber-400 hover:bg-amber-500/25"
                    : "bg-hc-surface border-hc-border text-hc-muted hover:text-hc-text hover:border-hc-gold-500"
                }
                ${sizeClasses}
                ${className}`}
        >
            {loading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Icon className="w-3.5 h-3.5" />
            }
            <span>{watching ? "Watching" : "Watch"}</span>
        </button>
    );
}

export default WatchButton;
