import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// HAUL COMMAND — Stat Block
// Metric display for dashboards, proof strips, hero sections.
// Supports animated number-pop and gold accent highlights.
// ══════════════════════════════════════════════════════════════

interface StatBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Metric label */
  label: string;
  /** Metric value (pre-formatted string) */
  value: string | number;
  /** Lucide icon */
  icon?: LucideIcon;
  /** Trend indicator: up, down, or neutral */
  trend?: "up" | "down" | "neutral";
  /** Trend delta text (e.g. "+12%") */
  delta?: string;
  /** Use gold accent for the value */
  highlight?: boolean;
  /** Compact size for inline grids */
  compact?: boolean;
}

export function StatBlock({
  label,
  value,
  icon: Icon,
  trend,
  delta,
  highlight = false,
  compact = false,
  className,
  ...props
}: StatBlockProps) {
  const trendColor = {
    up: "text-hc-success",
    down: "text-hc-danger",
    neutral: "text-hc-subtle",
  };

  return (
    <div
      className={cn(
        "flex flex-col",
        compact ? "gap-1" : "gap-2",
        className
      )}
      {...props}
    >
      {/* Label row */}
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon
            className={cn(
              "shrink-0",
              compact ? "h-3.5 w-3.5" : "h-4 w-4",
              highlight ? "text-hc-gold-400" : "text-hc-subtle"
            )}
          />
        )}
        <span
          className={cn(
            "font-semibold uppercase tracking-wider",
            compact ? "text-[10px]" : "text-xs",
            "text-hc-subtle"
          )}
        >
          {label}
        </span>
      </div>

      {/* Value */}
      <span
        className={cn(
          "font-display font-black tabular-nums tracking-tight",
          compact ? "text-2xl" : "text-3xl md:text-4xl",
          highlight ? "text-hc-gold-400" : "text-hc-text"
        )}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>

      {/* Trend */}
      {trend && delta && (
        <span
          className={cn(
            "text-xs font-bold",
            trendColor[trend]
          )}
        >
          {trend === "up" && "↑ "}
          {trend === "down" && "↓ "}
          {delta}
        </span>
      )}
    </div>
  );
}
