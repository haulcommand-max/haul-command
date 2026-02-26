import React from "react";
import { cn } from "@/lib/utils/cn";

// ══════════════════════════════════════════════════════════════
// Avatar — Haul Command v4
// Professional initials placeholder with consistent color per name.
// All sizes respect 44px+ touch targets in interactive contexts.
// ══════════════════════════════════════════════════════════════

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
    name?: string | null;
    src?: string | null;
    size?: AvatarSize;
    className?: string;
    verified?: boolean;
}

// ── Deterministic hue from name ──────────────────────────────
// Generates a consistent hue for the same name across the app
function nameToHue(name: string): number {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Keep hues away from pure red/green (look too status-signal-like)
    // Bias toward industrial: steel blues, muted teals, warm ambers
    const raw = Math.abs(hash) % 360;
    return raw;
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Size config ──────────────────────────────────────────────
const SIZE: Record<AvatarSize, { container: string; text: string; badge: string }> = {
    xs: { container: "w-7 h-7 rounded-lg text-[10px]", text: "font-bold", badge: "w-3 h-3 -bottom-0.5 -right-0.5 border" },
    sm: { container: "w-9 h-9 rounded-xl text-xs", text: "font-bold", badge: "w-3.5 h-3.5 -bottom-0.5 -right-0.5 border" },
    md: { container: "w-11 h-11 rounded-xl text-sm", text: "font-black", badge: "w-4 h-4 -bottom-1 -right-1 border-2" },
    lg: { container: "w-14 h-14 rounded-2xl text-base", text: "font-black", badge: "w-5 h-5 -bottom-1 -right-1 border-2" },
    xl: { container: "w-20 h-20 rounded-3xl text-xl", text: "font-black", badge: "w-6 h-6 -bottom-1.5 -right-1.5 border-2" },
};

export function Avatar({
    name,
    src,
    size = "md",
    className,
    verified = false,
}: AvatarProps) {
    const sizes = SIZE[size];
    const displayName = name ?? "?";
    const initials = name ? getInitials(name) : "?";
    const hue = name ? nameToHue(name) : 200;

    // Light theme: soft pastel background with darkened text
    const bgColor = `hsl(${hue}, 25%, 92%)`;
    const fgColor = `hsl(${hue}, 45%, 35%)`;
    const ringColor = `hsl(${hue}, 20%, 75%)`;

    return (
        <div className={cn("relative inline-flex shrink-0", className)}>
            {src ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                    src={src}
                    alt={displayName}
                    className={cn(
                        "object-cover border",
                        sizes.container,
                    )}
                    style={{ borderColor: ringColor }}
                />
            ) : (
                <div
                    className={cn("flex items-center justify-center select-none", sizes.container, sizes.text)}
                    style={{ backgroundColor: bgColor, color: fgColor, border: `1px solid ${ringColor}` }}
                    title={displayName}
                    aria-label={displayName}
                >
                    {initials}
                </div>
            )}

            {/* Verified badge */}
            {verified && (
                <div
                    className={cn(
                        "absolute rounded-full bg-hc-success flex items-center justify-center border-hc-bg",
                        sizes.badge,
                    )}
                    title="Verified"
                >
                    <svg viewBox="0 0 12 12" fill="none" className="w-[60%] h-[60%]">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            )}
        </div>
    );
}

// ── Avatar Group (stack) ─────────────────────────────────────
export function AvatarGroup({
    names,
    max = 4,
    size = "sm",
    className,
}: {
    names: string[];
    max?: number;
    size?: AvatarSize;
    className?: string;
}) {
    const visible = names.slice(0, max);
    const overflow = names.length - max;

    return (
        <div className={cn("flex items-center", className)}>
            {visible.map((name, i) => (
                <div key={name + i} className={cn("-ml-2 first:ml-0 ring-2 ring-hc-bg rounded-xl")}>
                    <Avatar name={name} size={size} />
                </div>
            ))}
            {overflow > 0 && (
                <div className={cn(
                    "-ml-2 flex items-center justify-center bg-hc-elevated border border-hc-border text-hc-muted font-bold text-[10px] ring-2 ring-hc-bg",
                    SIZE[size].container,
                )}>
                    +{overflow}
                </div>
            )}
        </div>
    );
}

export default Avatar;
