"use client";

import React, { useEffect, useState } from "react";
import { LayoutList, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ══════════════════════════════════════════════════════════════
// LoadBoardViewToggle — Haul Command
//
// Persists view mode preference in localStorage.
// "detailed" → full LoadCardV2 (all intelligence signals)
// "scan"     → compact ScanModeCard (5 fields, swipeable)
//
// Usage:
//   const [mode, setMode] = useLoadBoardMode();
//   <LoadBoardViewToggle mode={mode} onChange={setMode} />
// ══════════════════════════════════════════════════════════════

export type LoadBoardMode = "detailed" | "scan";

const STORAGE_KEY = "hc_loadboard_mode";

/** Hook — reads/writes mode from localStorage */
export function useLoadBoardMode(): [LoadBoardMode, (m: LoadBoardMode) => void] {
    const [mode, setModeState] = useState<LoadBoardMode>("detailed");

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as LoadBoardMode | null;
        if (stored === "detailed" || stored === "scan") {
            setModeState(stored);
        }
    }, []);

    function setMode(m: LoadBoardMode) {
        setModeState(m);
        localStorage.setItem(STORAGE_KEY, m);
    }

    return [mode, setMode];
}

interface LoadBoardViewToggleProps {
    mode: LoadBoardMode;
    onChange: (m: LoadBoardMode) => void;
    className?: string;
}

export function LoadBoardViewToggle({ mode, onChange, className }: LoadBoardViewToggleProps) {
    return (
        <div className={cn("inline-flex items-center gap-1 p-1 bg-hc-elevated border border-hc-border rounded-xl", className)}>
            <button
                onClick={() => onChange("detailed")}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all min-h-[40px]",
                    mode === "detailed"
                        ? "bg-hc-surface border border-hc-border text-hc-text shadow-sm"
                        : "text-hc-subtle hover:text-hc-muted"
                )}
            >
                <LayoutList className="w-3.5 h-3.5" />
                Detailed
            </button>
            <button
                onClick={() => onChange("scan")}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all min-h-[40px]",
                    mode === "scan"
                        ? "bg-hc-gold-500 text-hc-bg shadow-dispatch"
                        : "text-hc-subtle hover:text-hc-muted"
                )}
            >
                <Zap className={cn("w-3.5 h-3.5", mode === "scan" && "fill-hc-bg")} />
                Quick Scan
            </button>
        </div>
    );
}

export default LoadBoardViewToggle;
