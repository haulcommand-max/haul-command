import React from "react";
import { cn } from "@/lib/utils/cn";
import { Shield, Clock, CheckCircle2, AlertCircle, Activity } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// TrustStrip — Haul Command v4
// Profile header trust bar. 4 data points. Reads in < 2 seconds.
// Designed for broker confidence — replaces vague star ratings.
// ══════════════════════════════════════════════════════════════

type ComplianceStatus = "verified" | "expiring" | "expired" | "pending";

interface TrustStripProps {
    trustScore: number;           // 0–100 integer
    complianceStatus: ComplianceStatus;
    onTimeRate: number;           // 0–100 percentage
    lastActiveHours?: number;     // hours since last heartbeat (undefined = never)
    compact?: boolean;            // true = horizontal strip, false = 2x2 grid
    className?: string;
}

// ── Compliance config ────────────────────────────────────────
const COMPLIANCE_CONFIG: Record<ComplianceStatus, {
    label: string; color: string; icon: React.ElementType; dot: string;
}> = {
    verified: { label: "Verified", color: "text-hc-success", icon: CheckCircle2, dot: "bg-hc-success" },
    expiring: { label: "Expiring", color: "text-hc-warning", icon: AlertCircle, dot: "bg-hc-warning" },
    expired: { label: "Expired", color: "text-hc-danger", icon: AlertCircle, dot: "bg-hc-danger" },
    pending: { label: "Pending", color: "text-hc-muted", icon: Clock, dot: "bg-hc-muted" },
};

// ── Trust score color ────────────────────────────────────────
function trustColor(score: number): string {
    if (score >= 80) return "text-hc-success";
    if (score >= 60) return "text-hc-warning";
    return "text-hc-danger";
}

// ── Last active label ────────────────────────────────────────
function lastActiveLabel(hours?: number): { label: string; color: string } {
    if (hours === undefined) return { label: "Never", color: "text-hc-subtle" };
    if (hours < 1) return { label: "Just now", color: "text-hc-success" };
    if (hours < 6) return { label: `${hours}h ago`, color: "text-hc-success" };
    if (hours < 24) return { label: `${hours}h ago`, color: "text-hc-muted" };
    const days = Math.floor(hours / 24);
    return { label: `${days}d ago`, color: days > 7 ? "text-hc-danger" : "text-hc-muted" };
}

// ── Single Metric Cell ────────────────────────────────────────
function MetricCell({
    icon: Icon,
    label,
    value,
    valueColor = "text-hc-text",
    dot,
    className,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    valueColor?: string;
    dot?: string;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-col items-center text-center min-w-0", className)}>
            <div className="flex items-center gap-1 mb-0.5">
                {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot)} />}
                {!dot && <Icon className="w-3.5 h-3.5 text-hc-muted shrink-0" />}
                <span className="text-[10px] font-semibold text-hc-muted uppercase tracking-widest truncate">
                    {label}
                </span>
            </div>
            <span className={cn("text-base font-black tabular-nums", valueColor)}>
                {value}
            </span>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────
export function TrustStrip({
    trustScore,
    complianceStatus,
    onTimeRate,
    lastActiveHours,
    compact = true,
    className,
}: TrustStripProps) {
    const compliance = COMPLIANCE_CONFIG[complianceStatus];
    const lastActive = lastActiveLabel(lastActiveHours);
    const CompIcon = compliance.icon;

    return (
        <div className={cn(
            "hc-card",
            compact ? "px-4 py-3" : "p-5",
            className,
        )}>
            <div className={cn(
                "flex items-stretch",
                compact
                    ? "flex-row gap-0 divide-x divide-hc-border-bare"
                    : "grid grid-cols-2 gap-4",
            )}>
                {/* ① Trust Score */}
                <MetricCell
                    icon={Shield}
                    label="Trust"
                    value={`${trustScore}`}
                    valueColor={trustColor(trustScore)}
                    className={compact ? "flex-1 px-3 first:pl-0" : ""}
                />

                {/* ② Compliance Status */}
                <div className={cn(
                    "flex flex-col items-center text-center min-w-0",
                    compact ? "flex-1 px-3" : "",
                )}>
                    <div className="flex items-center gap-1 mb-0.5">
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", compliance.dot)} />
                        <span className="text-[10px] font-semibold text-hc-muted uppercase tracking-widest">
                            Compliance
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <CompIcon className={cn("w-3.5 h-3.5", compliance.color)} />
                        <span className={cn("text-sm font-bold", compliance.color)}>
                            {compliance.label}
                        </span>
                    </div>
                </div>

                {/* ③ On-Time Rate */}
                <MetricCell
                    icon={CheckCircle2}
                    label="On Time"
                    value={`${onTimeRate}%`}
                    valueColor={onTimeRate >= 90 ? "text-hc-success" : onTimeRate >= 75 ? "text-hc-warning" : "text-hc-danger"}
                    className={compact ? "flex-1 px-3" : ""}
                />

                {/* ④ Last Active */}
                <MetricCell
                    icon={Activity}
                    label="Last Seen"
                    value={lastActive.label}
                    valueColor={lastActive.color}
                    className={compact ? "flex-1 px-3 last:pr-0" : ""}
                />
            </div>
        </div>
    );
}

// ── Skeleton ────────────────────────────────────────────────
export function TrustStripSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("hc-card px-4 py-3 flex flex-row gap-0 divide-x divide-hc-border-bare", className)}>
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex-1 px-3 flex flex-col items-center gap-1.5">
                    <div className="skeleton h-2.5 w-12 rounded" />
                    <div className="skeleton h-5 w-8 rounded" />
                </div>
            ))}
        </div>
    );
}

export default TrustStrip;
