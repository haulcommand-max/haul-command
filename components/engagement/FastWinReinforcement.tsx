"use client";

import React, { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { CheckCircle2, Clock, ThumbsUp } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// FastWinReinforcement — Haul Command v4
// Triggered on: job complete, on-time, fast response, referral.
// Appears as bottom-anchored toast. 4s auto-dismiss. Slides up.
// RULES: No confetti. No sounds. No stars. Subtle + data-tied.
// ══════════════════════════════════════════════════════════════

export type WinEvent =
    | "job_completed"
    | "on_time_delivery"
    | "fast_response"
    | "successful_referral";

interface WinConfig {
    icon: React.ElementType;
    headline: string;
    subline: (context?: WinContext) => string;
}

interface WinContext {
    streakCount?: number;
    responseMinutes?: number;
    partnerName?: string;
    earningsDelta?: number;
}

const WIN_CONFIG: Record<WinEvent, WinConfig> = {
    job_completed: {
        icon: CheckCircle2,
        headline: "Job Marked Complete",
        subline: (ctx) => ctx?.streakCount && ctx.streakCount > 1
            ? `On-Time Streak: ${ctx.streakCount} in a row`
            : "Status reset — go available for your next run.",
    },
    on_time_delivery: {
        icon: Clock,
        headline: "On Time",
        subline: (ctx) => ctx?.streakCount && ctx.streakCount >= 3
            ? `${ctx.streakCount} deliveries on time — brokers notice this.`
            : "Delivered as scheduled. Reliability score updated.",
    },
    fast_response: {
        icon: ThumbsUp,
        headline: "Fast Response",
        subline: (ctx) => ctx?.responseMinutes !== undefined
            ? `Accepted in ${ctx.responseMinutes}min — ${ctx.partnerName ?? "broker"} will remember this.`
            : "Brokers prioritize escorts who respond quickly.",
    },
    successful_referral: {
        icon: CheckCircle2,
        headline: "Referral Confirmed",
        subline: (ctx) => ctx?.partnerName
            ? `${ctx.partnerName} completed their first job. Your credit is on the way.`
            : "Your referral is now active. Credit applied to your account.",
    },
};

interface FastWinToast {
    id: string;
    event: WinEvent;
    context?: WinContext;
}

// ── Single Toast ─────────────────────────────────────────────
function WinToast({
    toast,
    onDismiss,
}: {
    toast: FastWinToast;
    onDismiss: (id: string) => void;
}) {
    const [visible, setVisible] = useState(false);
    const cfg = WIN_CONFIG[toast.event];
    const Icon = cfg.icon;

    useEffect(() => {
        // Trigger slide-in on mount
        const showTimer = setTimeout(() => setVisible(true), 16);
        // Auto-dismiss after 4 seconds
        const hideTimer = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onDismiss(toast.id), 300);
        }, 4000);
        return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
    }, [toast.id, onDismiss]);

    return (
        <div
            className={cn(
                "flex items-center gap-3 px-4 py-3 hc-card shadow-elevated max-w-sm w-full",
                "transform transition-all duration-300 ease-out",
                visible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0",
            )}
            role="status"
            aria-live="polite"
        >
            <div className="w-8 h-8 rounded-xl bg-hc-success/15 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-hc-success" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-hc-text leading-tight">
                    {cfg.headline}
                </p>
                <p className="text-xs text-hc-muted mt-0.5 leading-snug">
                    {cfg.subline(toast.context)}
                </p>
            </div>
            <button
                onClick={() => { setVisible(false); setTimeout(() => onDismiss(toast.id), 300); }}
                className="text-hc-subtle hover:text-hc-muted transition-colors shrink-0 ml-1 text-lg leading-none"
                aria-label="Dismiss"
            >
                ×
            </button>
        </div>
    );
}

// ── Toast Container ───────────────────────────────────────────
// Mount this once in the layout or dashboard shell.
// Trigger wins via the useFastWin hook.

let globalAddWin: ((event: WinEvent, context?: WinContext) => void) | null = null;

export function FastWinContainer() {
    const [toasts, setToasts] = useState<FastWinToast[]>([]);

    const addWin = useCallback((event: WinEvent, context?: WinContext) => {
        const id = `win-${Date.now()}-${Math.random()}`;
        setToasts(prev => [...prev.slice(-2), { id, event, context }]); // max 3 at once
    }, []);

    // Register globally so useFastWin can fire it
    useEffect(() => {
        globalAddWin = addWin;
        return () => { globalAddWin = null; };
    }, [addWin]);

    const dismiss = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    if (!toasts.length) return null;

    return (
        // Bottom of screen, above MobileBottomNav (pb-[72px] on mobile)
        <div className="fixed bottom-[72px] left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pb-2 pointer-events-none">
            <div className="pointer-events-auto flex flex-col items-center gap-2 w-full max-w-sm">
                {toasts.map(toast => (
                    <WinToast key={toast.id} toast={toast} onDismiss={dismiss} />
                ))}
            </div>
        </div>
    );
}

// ── Hook — fire wins from anywhere ──────────────────────────
export function useFastWin() {
    return useCallback((event: WinEvent, context?: WinContext) => {
        if (globalAddWin) globalAddWin(event, context);
    }, []);
}

export default FastWinContainer;
