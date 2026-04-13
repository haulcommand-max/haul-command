import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import type { LucideIcon } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// HAUL COMMAND — Empty State
// NO DEAD ENDS. Every empty state must guide the user forward.
// Used when: zero results, no data loaded, feature unavailable.
// ══════════════════════════════════════════════════════════════

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lucide icon to display */
  icon?: LucideIcon;
  /** Main headline */
  title: string;
  /** Descriptive subtext */
  description?: string;
  /** Primary action */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** Secondary action */
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** Compact mode for inline use */
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-8 px-4" : "py-16 px-6",
        className
      )}
      {...props}
    >
      {Icon && (
        <div
          className={cn(
            "rounded-2xl bg-hc-elevated border border-hc-border-bare",
            "flex items-center justify-center",
            compact ? "h-12 w-12 mb-4" : "h-16 w-16 mb-6"
          )}
        >
          <Icon
            className={cn(
              "text-hc-subtle",
              compact ? "h-5 w-5" : "h-7 w-7"
            )}
          />
        </div>
      )}

      <h3
        className={cn(
          "font-display font-bold text-hc-text",
          compact ? "text-base mb-1" : "text-xl mb-2"
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            "text-hc-muted leading-relaxed max-w-md",
            compact ? "text-sm mb-4" : "text-base mb-6"
          )}
        >
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {action && (
            <Button
              variant="primary"
              size={compact ? "sm" : "default"}
              onClick={action.onClick}
              asChild={!!action.href}
            >
              {action.href ? (
                <a href={action.href}>{action.label}</a>
              ) : (
                action.label
              )}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              size={compact ? "sm" : "default"}
              onClick={secondaryAction.onClick}
              asChild={!!secondaryAction.href}
            >
              {secondaryAction.href ? (
                <a href={secondaryAction.href}>{secondaryAction.label}</a>
              ) : (
                secondaryAction.label
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
