"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils/cn";

// ══════════════════════════════════════════════════════════════
// LiveCounter — Haul Command
// Animated number that smoothly ticks to its target value.
// Use for: escorts online, loads posted today, active corridors.
// When the number changes, it counts up/down with spring physics.
// ══════════════════════════════════════════════════════════════

interface LiveCounterProps {
    value: number;
    label: string;
    sublabel?: string;
    prefix?: string;
    suffix?: string;
    /** Highlight color when value goes up */
    upColor?: string;
    /** Highlight color when value goes down */
    downColor?: string;
    className?: string;
    size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
    sm: { number: "text-2xl", label: "text-[9px]", container: "p-3" },
    md: { number: "text-4xl", label: "text-[10px]", container: "p-4" },
    lg: { number: "text-6xl", label: "text-xs", container: "p-6" },
};

function AnimatedNumber({ value }: { value: number }) {
    const spring = useSpring(value, { stiffness: 120, damping: 20 });
    const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    return <motion.span>{display}</motion.span>;
}

export function LiveCounter({
    value,
    label,
    sublabel,
    prefix = "",
    suffix = "",
    upColor = "text-hc-success",
    downColor = "text-hc-danger",
    className,
    size = "md",
}: LiveCounterProps) {
    const prev = useRef(value);
    const [trend, setTrend] = useState<"up" | "down" | "flat">("flat");

    useEffect(() => {
        if (value > prev.current) setTrend("up");
        else if (value < prev.current) setTrend("down");
        else setTrend("flat");
        prev.current = value;

        // Reset trend visual after 2s
        const t = setTimeout(() => setTrend("flat"), 2000);
        return () => clearTimeout(t);
    }, [value]);

    const s = SIZE_MAP[size];
    const numberColor = trend === "up" ? upColor : trend === "down" ? downColor : "text-hc-text";

    return (
        <div className={cn("flex flex-col items-center text-center hc-card", s.container, className)}>
            {/* Trend flash ring */}
            <motion.div
                initial={false}
                animate={{
                    boxShadow: trend !== "flat"
                        ? trend === "up"
                            ? "0 0 0 2px rgba(34,197,94,0.4)"
                            : "0 0 0 2px rgba(239,68,68,0.4)"
                        : "0 0 0 0px transparent",
                }}
                transition={{ duration: 0.3 }}
                className="rounded-xl w-full h-full absolute inset-0 pointer-events-none"
            />

            <p className={cn("font-black tabular-nums leading-none transition-colors duration-500", s.number, numberColor)}>
                {prefix}<AnimatedNumber value={value} />{suffix}
            </p>
            <p className={cn("font-black text-hc-muted uppercase tracking-widest mt-1.5", s.label)}>
                {label}
            </p>
            {sublabel && (
                <p className={cn("text-hc-subtle mt-0.5", s.label)}>
                    {sublabel}
                </p>
            )}
        </div>
    );
}

// ── LiveStatBar: Horizontal row of 3-4 live counters ─────────
interface StatBarProps {
    stats: {
        value: number;
        label: string;
        prefix?: string;
        suffix?: string;
        upColor?: string;
    }[];
    className?: string;
}

export function LiveStatBar({ stats, className }: StatBarProps) {
    return (
        <div className={cn(
            "grid gap-px rounded-xl overflow-hidden",
            "border border-hc-border",
            "bg-hc-border", // gap color = border color, cells sit on top
            `grid-cols-${stats.length}`,
            className,
        )}>
            {stats.map((s, i) => (
                <div
                    key={i}
                    className="flex flex-col items-center text-center bg-hc-surface px-3 py-4 relative"
                >
                    {/* Live indicator dot on first stat */}
                    {i === 0 && (
                        <span className="absolute top-2 right-2 flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hc-success opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-hc-success" />
                        </span>
                    )}
                    <p className={cn(
                        "text-2xl font-black tabular-nums leading-none tracking-tight",
                        s.upColor ?? "text-hc-text"
                    )}>
                        {s.prefix}<AnimatedNumber value={s.value} />{s.suffix}
                    </p>
                    <p className="text-[9px] font-bold text-hc-muted uppercase tracking-[0.18em] mt-1.5" style={{ opacity: 0.72 }}>
                        {s.label}
                    </p>
                </div>
            ))}
        </div>
    );
}

export default LiveCounter;
