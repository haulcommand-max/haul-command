import * as React from "react";
import { cn } from "@/lib/utils";

// ══════════════════════════════════════════════════════════════
// HAUL COMMAND — Textarea
// Multi-line text input matching dark surface + gold focus.
// ══════════════════════════════════════════════════════════════

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-xl px-4 py-3",
        "bg-hc-elevated text-hc-text",
        "border border-hc-border",
        "text-base font-medium",
        "placeholder:text-hc-subtle",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-hc-gold-500/40 focus-visible:border-hc-gold-500/60",
        "transition-all duration-200",
        "resize-y",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
