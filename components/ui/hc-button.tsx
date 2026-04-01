import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ══════════════════════════════════════════════════════════════
// HCButton — Haul Command Design System v4
// Primary Gold on Command Black. Always ≥44px touch target.
// Never hardcode hex. Use token classes only.
// ══════════════════════════════════════════════════════════════

type Variant = "primary" | "dispatch" | "ghost" | "danger" | "muted";
type Size = "sm" | "md" | "lg" | "xl";

interface HCButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
    primary: [
        "bg-hc-gold-500 hover:bg-hc-gold-400 active:bg-hc-gold-600",
        "text-hc-bg font-bold",
        "border border-transparent",
        "shadow-gold-sm hover:shadow-gold-md hover:shadow-dispatch",
        "transition-all duration-200",
    ].join(" "),

    dispatch: [
        "bg-hc-gold-500 hover:bg-hc-gold-400 active:bg-hc-gold-600",
        "text-hc-bg font-black tracking-wide uppercase",
        "border-2 border-hc-gold-400",
        "shadow-dispatch",
        "animate-pulse-gold",
        "transition-all duration-200",
    ].join(" "),

    ghost: [
        "bg-transparent hover:bg-hc-elevated",
        "text-hc-gold-500 hover:text-hc-gold-400",
        "border border-hc-border hover:border-hc-border-high",
        "transition-all duration-200",
    ].join(" "),

    danger: [
        "bg-hc-danger/10 hover:bg-hc-danger/20 active:bg-hc-danger/30",
        "text-hc-danger font-bold",
        "border border-hc-danger/30 hover:border-hc-danger/60",
        "transition-all duration-200",
    ].join(" "),

    muted: [
        "bg-hc-elevated hover:bg-hc-high",
        "text-hc-muted hover:text-hc-text",
        "border border-hc-border-bare",
        "transition-all duration-200",
    ].join(" "),
};

const sizeStyles: Record<Size, string> = {
    sm: "h-11 px-4 text-sm rounded-xl gap-1.5",         // 44px
    md: "h-12 px-5 text-sm rounded-xl gap-2",           // 48px
    lg: "h-14 px-6 text-base rounded-2xl gap-2.5",      // 56px
    xl: "h-16 px-8 text-lg rounded-2xl gap-3 text-base", // 64px
};

export function HCButton({
    variant = "primary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    children,
    className,
    ...rest
}: HCButtonProps) {
    return (
        <button
            {...rest}
            disabled={disabled || loading}
            className={cn(
                "inline-flex items-center justify-center",
                "cursor-pointer select-none",
                "rounded-xl font-semibold",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                variantStyles[variant],
                sizeStyles[size],
                fullWidth && "w-full",
                className,
            )}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <>
                    {leftIcon && <span className="shrink-0">{leftIcon}</span>}
                    {children}
                    {rightIcon && <span className="shrink-0">{rightIcon}</span>}
                </>
            )}
        </button>
    );
}

export default HCButton;
