import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ══════════════════════════════════════════════════════════════
// HAUL COMMAND — Badge
// Status chips, trust markers, role indicators
// ══════════════════════════════════════════════════════════════

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5",
    "rounded-full px-3 py-1",
    "text-xs font-bold uppercase tracking-wider",
    "border transition-colors",
    "whitespace-nowrap select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-hc-elevated text-hc-text border-hc-border",
        gold: "bg-hc-gold-500/15 text-hc-gold-400 border-hc-gold-500/30",
        success: "bg-hc-success/15 text-hc-success border-hc-success/30",
        warning: "bg-hc-warning/15 text-hc-warning border-hc-warning/30",
        danger: "bg-hc-danger/15 text-hc-danger border-hc-danger/30",
        info: "bg-hc-info/15 text-hc-info border-hc-info/30",
        muted: "bg-hc-elevated/50 text-hc-subtle border-hc-border-bare",
        // ── Role-specific ──
        broker: "bg-hc-broker/15 text-hc-broker border-hc-broker/30",
        escort: "bg-hc-escort/15 text-hc-escort border-hc-escort/30",
        corridor: "bg-hc-corridor/15 text-hc-corridor border-hc-corridor/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Optional dot indicator before text */
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
