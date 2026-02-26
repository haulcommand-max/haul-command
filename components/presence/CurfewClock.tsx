"use client";

import React, { useState, useEffect, useCallback } from "react";

// ══════════════════════════════════════════════════════════════════════════════
// CurfewClock — counts down to the next hard-lock curfew for the given state.
// Hard locks are pre-coded from the HCOS curfew schedule:
//   Friday 3 PM – Monday 6 AM in most states (heavy haul window).
//   Some states (IL, CA, NY) have weeknight locks too.
// ══════════════════════════════════════════════════════════════════════════════

interface CurfewWindow {
    label: string;
    /** Day of week 0=Sun 5=Fri 6=Sat */
    startDay: number;
    startHour: number;
    endDay: number;
    endHour: number;
    severity: "hard" | "soft";
    notes?: string;
}

// Per-state overrides (subset — extend as needed)
const STATE_CURFEWS: Record<string, CurfewWindow[]> = {
    // Illinois — strict weeknight + weekend locks
    IL: [
        { label: "IL Weekend Hard Lock", startDay: 5, startHour: 15, endDay: 1, endHour: 6, severity: "hard", notes: "No superloads Fri 3PM–Mon 6AM" },
        { label: "IL Rush Hour Lock", startDay: 1, startHour: 6, endDay: 5, endHour: 8, severity: "soft", notes: "Mon–Fri 6–8 AM & 4–7 PM restricted" },
    ],
    CA: [
        { label: "CA Weekend Hard Lock", startDay: 5, startHour: 16, endDay: 1, endHour: 5, severity: "hard", notes: "No overwidth Fri 4PM–Mon 5AM" },
    ],
    NY: [
        { label: "NY Bridge Window", startDay: 5, startHour: 12, endDay: 1, endHour: 6, severity: "hard", notes: "Bridge authority blackout weekends" },
    ],
};

// Default curfew for all other states
const DEFAULT_CURFEW: CurfewWindow = {
    label: "Weekend Hard Lock",
    startDay: 5, startHour: 15,   // Fri 3 PM
    endDay: 1, endHour: 6,      // Mon 6 AM
    severity: "hard",
    notes: "Standard heavy haul blackout — most states",
};

function getNextCurfewMs(windows: CurfewWindow[]): { window: CurfewWindow; msUntilStart: number; inCurfew: boolean; msUntilEnd: number } | null {
    const now = new Date();
    const nowDay = now.getDay();
    const nowHour = now.getHours() + now.getMinutes() / 60;

    for (const w of windows) {
        // Check if currently in curfew
        const inCurfew = (() => {
            if (w.startDay < w.endDay) {
                return (nowDay > w.startDay || (nowDay === w.startDay && nowHour >= w.startHour)) &&
                    (nowDay < w.endDay || (nowDay === w.endDay && nowHour < w.endHour));
            }
            // Wraps over Sunday
            return (nowDay > w.startDay || (nowDay === w.startDay && nowHour >= w.startHour)) ||
                (nowDay < w.endDay || (nowDay === w.endDay && nowHour < w.endHour));
        })();

        if (inCurfew) {
            // Calc ms until end
            const endDate = new Date(now);
            let daysUntilEnd = (w.endDay - nowDay + 7) % 7;
            if (daysUntilEnd === 0 && nowHour >= w.endHour) daysUntilEnd = 7;
            endDate.setDate(endDate.getDate() + daysUntilEnd);
            endDate.setHours(w.endHour, 0, 0, 0);
            return { window: w, msUntilStart: 0, inCurfew: true, msUntilEnd: endDate.getTime() - now.getTime() };
        }

        // Calc ms until start
        const startDate = new Date(now);
        let daysUntilStart = (w.startDay - nowDay + 7) % 7;
        if (daysUntilStart === 0 && nowHour >= w.startHour) daysUntilStart = 7;
        startDate.setDate(startDate.getDate() + daysUntilStart);
        startDate.setHours(w.startHour, 0, 0, 0);
        return { window: w, msUntilStart: startDate.getTime() - now.getTime(), inCurfew: false, msUntilEnd: 0 };
    }
    return null;
}

function formatCountdown(ms: number) {
    const totalSecs = Math.floor(ms / 1000);
    const d = Math.floor(totalSecs / 86400);
    const h = Math.floor((totalSecs % 86400) / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
}

interface CurfewClockProps {
    /** Two-letter state abbreviation, e.g. "TX" */
    state?: string;
    className?: string;
}

export function CurfewClock({ state, className = "" }: CurfewClockProps) {
    const windows = state ? (STATE_CURFEWS[state.toUpperCase()] ?? [DEFAULT_CURFEW]) : [DEFAULT_CURFEW];
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const result = getNextCurfewMs(windows);
    if (!result) return null;

    const { window: cw, inCurfew, msUntilStart, msUntilEnd } = result;

    const isUrgent = inCurfew || msUntilStart < 3 * 3600 * 1000; // < 3h warning
    const color = inCurfew ? "#ef4444" : isUrgent ? "#f59e0b" : "#10b981";
    const bg = inCurfew ? "rgba(239,68,68,0.07)" : isUrgent ? "rgba(245,158,11,0.07)" : "rgba(16,185,129,0.06)";
    const border = inCurfew ? "rgba(239,68,68,0.35)" : isUrgent ? "rgba(245,158,11,0.35)" : "rgba(16,185,129,0.25)";

    return (
        <div
            className={className}
            style={{
                padding: "14px 18px",
                borderRadius: 14,
                background: bg,
                border: `1.5px solid ${border}`,
                display: "flex",
                alignItems: "center",
                gap: 14,
            }}
        >
            {/* Icon */}
            <span style={{ fontSize: 22, flexShrink: 0 }}>
                {inCurfew ? "🚫" : isUrgent ? "⚠️" : "✅"}
            </span>

            <div style={{ flex: 1 }}>
                {/* Label */}
                <p style={{
                    margin: "0 0 2px", fontSize: 11, fontWeight: 900,
                    textTransform: "uppercase", letterSpacing: "0.08em", color,
                }}>
                    {inCurfew ? "CURFEW ACTIVE" : isUrgent ? "CURFEW APPROACHING" : "CLEAR TO MOVE"}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--hc-muted, #aaa)" }}>
                    {cw.label}{state ? ` · ${state.toUpperCase()}` : ""}
                </p>
                {cw.notes && (
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--hc-muted, #666)" }}>{cw.notes}</p>
                )}
            </div>

            {/* Countdown */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{
                    fontSize: 20, fontWeight: 900, color,
                    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                    letterSpacing: "0.05em",
                }}>
                    {formatCountdown(inCurfew ? msUntilEnd : msUntilStart)}
                </div>
                <div style={{ fontSize: 10, color: "var(--hc-muted, #888)", marginTop: 2 }}>
                    {inCurfew ? "until clear" : "until lock"}
                </div>
            </div>
        </div>
    );
}

export default CurfewClock;
