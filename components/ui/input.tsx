import * as React from "react";
import { cn } from "@/lib/utils";

// ══════════════════════════════════════════════════════════════
// HAUL COMMAND — Input
// Dark-surface text input with gold focus ring.
// 16px minimum font size to prevent iOS zoom.
// ══════════════════════════════════════════════════════════════

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        // Layout
        "flex h-12 w-full rounded-xl px-4 py-3",
        // Colors — dark elevated surface
        "bg-hc-elevated text-hc-text",
        "border border-hc-border",
        // Typography — 16px prevents iOS auto-zoom
        "text-base font-medium",
        "placeholder:text-hc-subtle",
        // Focus
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-hc-gold-500/40 focus-visible:border-hc-gold-500/60",
        // Transition
        "transition-all duration-200",
        // File input reset
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-hc-text",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
