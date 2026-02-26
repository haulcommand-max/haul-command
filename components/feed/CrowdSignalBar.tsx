"use client";

import React, { useState } from "react";
import {
    Flame, Shield, AlertTriangle, FileX, Clock,
    Users, AlertCircle, CheckCircle2, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ══════════════════════════════════════════════════════════════
// CrowdSignalBar — Haul Command Waze Layer
// One-tap field signal submission for authenticated users.
// 7 signal types, auto-expiry by severity from the YAML:
//   critical = 20min, high = 30min, medium = 45min, low = 60min
// ══════════════════════════════════════════════════════════════

const SIGNAL_TYPES = [
    {
        type: "corridor_heating",
        label: "Lane Hot",
        icon: Flame,
        severity: "high",
        color: "text-hc-warning border-hc-warning/30 bg-hc-warning/8",
        activeColor: "text-hc-warning border-hc-warning bg-hc-warning/20",
    },
    {
        type: "police_required",
        label: "Police Escort",
        icon: Shield,
        severity: "high",
        color: "text-[#38BDF8] border-[#38BDF8]/30 bg-[#38BDF8]/8",
        activeColor: "text-[#38BDF8] border-[#38BDF8] bg-[#38BDF8]/20",
    },
    {
        type: "height_issue",
        label: "Height Issue",
        icon: AlertTriangle,
        severity: "critical",
        color: "text-hc-danger border-hc-danger/30 bg-hc-danger/8",
        activeColor: "text-hc-danger border-hc-danger bg-hc-danger/20",
    },
    {
        type: "permit_tight",
        label: "Permit Tight",
        icon: FileX,
        severity: "medium",
        color: "text-hc-muted border-hc-border bg-hc-elevated",
        activeColor: "text-hc-gold-500 border-hc-gold-500 bg-hc-gold-500/15",
    },
    {
        type: "route_delay",
        label: "Route Delay",
        icon: Clock,
        severity: "medium",
        color: "text-hc-muted border-hc-border bg-hc-elevated",
        activeColor: "text-hc-gold-500 border-hc-gold-500 bg-hc-gold-500/15",
    },
    {
        type: "coverage_tightening",
        label: "Coverage Low",
        icon: Users,
        severity: "high",
        color: "text-hc-warning border-hc-warning/30 bg-hc-warning/8",
        activeColor: "text-hc-warning border-hc-warning bg-hc-warning/20",
    },
    {
        type: "bridge_clearance_watch",
        label: "Bridge Watch",
        icon: AlertCircle,
        severity: "critical",
        color: "text-hc-danger border-hc-danger/30 bg-hc-danger/8",
        activeColor: "text-hc-danger border-hc-danger bg-hc-danger/20",
    },
] as const;

type SignalType = (typeof SIGNAL_TYPES)[number]["type"];

interface CrowdSignalBarProps {
    corridorId: string;
    className?: string;
}

type SubmitState = "idle" | "loading" | "done" | "error";

export function CrowdSignalBar({ corridorId, className }: CrowdSignalBarProps) {
    const [states, setStates] = useState<Partial<Record<SignalType, SubmitState>>>({});
    const [lastFired, setLastFired] = useState<SignalType | null>(null);

    async function handleTap(signal: typeof SIGNAL_TYPES[number]) {
        if (states[signal.type] === "loading" || states[signal.type] === "done") return;

        setStates(prev => ({ ...prev, [signal.type]: "loading" }));
        setLastFired(signal.type);

        try {
            const res = await fetch("/api/signals/crowd", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    corridor_id: corridorId,
                    signal_type: signal.type,
                    severity: signal.severity,
                }),
            });

            if (!res.ok) throw new Error("Failed");

            setStates(prev => ({ ...prev, [signal.type]: "done" }));
            // Reset after 8 seconds so users can re-report if still active
            setTimeout(() => {
                setStates(prev => ({ ...prev, [signal.type]: "idle" }));
            }, 8000);
        } catch {
            setStates(prev => ({ ...prev, [signal.type]: "error" }));
            setTimeout(() => setStates(prev => ({ ...prev, [signal.type]: "idle" })), 3000);
        }
    }

    return (
        <div className={cn("space-y-2", className)}>
            {/* Header */}
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-hc-muted uppercase tracking-[0.2em]">
                    Field Intel
                </span>
                <span className="text-[9px] text-hc-subtle">· Tap to report</span>
            </div>

            {/* Signal chips */}
            <div className="flex flex-wrap gap-1.5">
                {SIGNAL_TYPES.map(signal => {
                    const state = states[signal.type] ?? "idle";
                    const Icon = signal.icon;
                    const isDone = state === "done";
                    const isLoading = state === "loading";

                    return (
                        <button
                            key={signal.type}
                            type="button"
                            onClick={() => handleTap(signal)}
                            disabled={isLoading || isDone}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border",
                                "text-[10px] font-black uppercase tracking-widest",
                                "transition-all duration-200 active:scale-95",
                                isDone
                                    ? "bg-hc-success/10 border-hc-success/30 text-hc-success"
                                    : isLoading
                                        ? "opacity-60 cursor-wait " + signal.color
                                        : signal.color + " hover:scale-[1.03] cursor-pointer"
                            )}
                        >
                            {isLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : isDone ? (
                                <CheckCircle2 className="w-3 h-3" />
                            ) : (
                                <Icon className="w-3 h-3" />
                            )}
                            {isDone ? "Reported" : signal.label}
                        </button>
                    );
                })}
            </div>

            {/* Expiry note */}
            {lastFired && states[lastFired] === "done" && (
                <p className="text-[9px] text-hc-subtle">
                    Signal reported · auto-expires per severity · visible on Pulse Feed
                </p>
            )}
        </div>
    );
}

export default CrowdSignalBar;
