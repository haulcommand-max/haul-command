import React from "react";
import { cn } from "@/lib/utils/cn";

// ══════════════════════════════════════════════════════════════
// Skeleton — Haul Command v4
// Gold-shimmer skeleton loader for all loading states.
// Required on all data surfaces (frustration prevention).
// ══════════════════════════════════════════════════════════════

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
}

export function Skeleton({ className, width, height }: SkeletonProps) {
    return (
        <div
            className={cn("skeleton rounded-lg", className)}
            style={{
                width: width,
                height: height ?? "1em",
            }}
        />
    );
}

// ── Skeleton Card (for load/escort cards) ───────────────────
export function SkeletonCard({ className }: { className?: string }) {
    return (
        <div className={cn("hc-card p-4 space-y-3", className)}>
            {/* Avatar + name row */}
            <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="w-16 h-6 rounded-full" />
            </div>
            {/* Body lines */}
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            {/* Action button */}
            <Skeleton className="h-11 w-full rounded-xl" />
        </div>
    );
}

// ── Skeleton Row (for leaderboard / dense tables) ───────────
export function SkeletonRow({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center gap-3 p-3", className)}>
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-2.5 w-1/3" />
            </div>
            <Skeleton className="w-12 h-6 rounded-full" />
        </div>
    );
}

// ── Skeleton Text (inline lines) ────────────────────────────
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
    return (
        <div className={cn("space-y-2", className)}>
            {Array.from({ length: lines }, (_, i) => (
                <Skeleton
                    key={i}
                    className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")}
                />
            ))}
        </div>
    );
}

// ── Skeleton Page (full page loading) ───────────────────────
export function SkeletonPage() {
    return (
        <div className="min-h-screen bg-hc-bg p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            {/* Cards */}
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
    );
}

export default Skeleton;
