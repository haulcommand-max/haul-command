import * as React from "react";
import { Shield, ShieldCheck, ShieldAlert, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

// ══════════════════════════════════════════════════════════════
// HAUL COMMAND — Trust Badge
// Per Master Prompt §23: Trust must be visible before contact.
// Renders verification status + trust score on directory cards,
// profiles, and search results.
// ══════════════════════════════════════════════════════════════

type VerificationLevel = "unverified" | "basic" | "verified" | "pro" | "enterprise";

interface TrustBadgeProps {
  /** Verification level */
  level?: VerificationLevel;
  /** Numeric trust score (0-100) */
  score?: number | null;
  /** Show score number alongside badge */
  showScore?: boolean;
  /** Compact mode for tight layouts */
  compact?: boolean;
  className?: string;
}

const LEVEL_CONFIG: Record<
  VerificationLevel,
  {
    icon: typeof Shield;
    label: string;
    variant: "muted" | "default" | "gold" | "success";
    ringClass: string;
  }
> = {
  unverified: {
    icon: Shield,
    label: "Unverified",
    variant: "muted",
    ringClass: "",
  },
  basic: {
    icon: ShieldCheck,
    label: "ID Verified",
    variant: "default",
    ringClass: "ring-1 ring-hc-border",
  },
  verified: {
    icon: ShieldCheck,
    label: "Verified",
    variant: "success",
    ringClass: "ring-1 ring-hc-success/30",
  },
  pro: {
    icon: ShieldCheck,
    label: "HC Pro",
    variant: "gold",
    ringClass: "ring-2 ring-hc-gold-500/40",
  },
  enterprise: {
    icon: Crown,
    label: "Enterprise",
    variant: "gold",
    ringClass: "ring-2 ring-hc-gold-500/60",
  },
};

export function TrustBadge({
  level = "unverified",
  score,
  showScore = false,
  compact = false,
  className,
}: TrustBadgeProps) {
  const config = LEVEL_CONFIG[level];
  const Icon = config.icon;

  if (compact) {
    // Inline icon-only mode for tight card layouts
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1",
          className
        )}
        title={`${config.label}${score != null ? ` — Trust Score: ${score}` : ""}`}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            level === "unverified" && "text-hc-subtle",
            level === "basic" && "text-hc-muted",
            level === "verified" && "text-hc-success",
            level === "pro" && "text-hc-gold-400",
            level === "enterprise" && "text-hc-gold-400"
          )}
        />
        {showScore && score != null && (
          <span className="text-xs font-bold tabular-nums text-hc-muted">
            {score}
          </span>
        )}
      </span>
    );
  }

  return (
    <Badge
      variant={config.variant}
      className={cn(config.ringClass, className)}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
      {showScore && score != null && (
        <span className="ml-1 font-mono text-[10px] opacity-80">{score}</span>
      )}
    </Badge>
  );
}

// ── Available Now indicator ──────────────────────────────────

interface AvailableNowBadgeProps {
  /** Last ping time in ISO string */
  lastPing?: string | null;
  /** Threshold in hours — if last ping within this, show as available */
  thresholdHours?: number;
  className?: string;
}

export function AvailableNowBadge({
  lastPing,
  thresholdHours = 4,
  className,
}: AvailableNowBadgeProps) {
  if (!lastPing) return null;

  const pingTime = new Date(lastPing).getTime();
  const now = Date.now();
  const hoursSincePing = (now - pingTime) / (1000 * 60 * 60);

  if (hoursSincePing > thresholdHours) return null;

  return (
    <Badge variant="success" dot className={className}>
      Available Now
    </Badge>
  );
}
