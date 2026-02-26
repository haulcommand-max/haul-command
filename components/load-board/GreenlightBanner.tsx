"use client";

import React from "react";

export type GreenlightStatus = "GREENLIGHT" | "WARN" | "BLOCKED";

interface GreenlightBannerProps {
    status: GreenlightStatus;
    reason?: string;
    /** Extra context chips, e.g. "Cert expires in 3 days", "State not covered" */
    chips?: string[];
    /** Optional CTA — e.g. "Fix Now" → /profile/edit */
    ctaLabel?: string;
    ctaHref?: string;
    className?: string;
}

const CONFIG: Record<GreenlightStatus, {
    bg: string; border: string; icon: string; label: string; textColor: string;
}> = {
    GREENLIGHT: {
        bg: "rgba(16,185,129,0.06)",
        border: "rgba(16,185,129,0.3)",
        icon: "✅",
        label: "GREENLIGHT",
        textColor: "#10b981",
    },
    WARN: {
        bg: "rgba(245,158,11,0.07)",
        border: "rgba(245,158,11,0.35)",
        icon: "⚠️",
        label: "WARN",
        textColor: "#f59e0b",
    },
    BLOCKED: {
        bg: "rgba(239,68,68,0.07)",
        border: "rgba(239,68,68,0.35)",
        icon: "🚫",
        label: "BLOCKED",
        textColor: "#ef4444",
    },
};

const DEFAULT_REASONS: Record<GreenlightStatus, string> = {
    GREENLIGHT: "You meet all requirements for this load. You're cleared to apply.",
    WARN: "You can apply, but one or more items need attention before dispatch.",
    BLOCKED: "You cannot apply to this load. Resolve the issues below first.",
};

export function GreenlightBanner({
    status,
    reason,
    chips = [],
    ctaLabel,
    ctaHref,
    className = "",
}: GreenlightBannerProps) {
    const cfg = CONFIG[status];

    return (
        <div
            className={className}
            style={{
                padding: "16px 20px",
                borderRadius: 14,
                background: cfg.bg,
                border: `1.5px solid ${cfg.border}`,
                display: "flex",
                flexDirection: "column",
                gap: 10,
            }}
        >
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>{cfg.icon}</span>
                <span style={{
                    fontSize: 13,
                    fontWeight: 900,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: cfg.textColor,
                }}>
                    {cfg.label}
                </span>
                <span style={{ flex: 1, height: 1, background: cfg.border }} />
                {ctaLabel && ctaHref && (
                    <a
                        href={ctaHref}
                        style={{
                            padding: "5px 14px",
                            borderRadius: 8,
                            background: cfg.textColor,
                            color: status === "WARN" ? "#111" : "#fff",
                            fontSize: 11,
                            fontWeight: 800,
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                        }}
                    >
                        {ctaLabel}
                    </a>
                )}
            </div>

            {/* Reason */}
            <p style={{
                margin: 0,
                fontSize: 13,
                color: "var(--hc-text, #e5e5e5)",
                lineHeight: 1.5,
            }}>
                {reason ?? DEFAULT_REASONS[status]}
            </p>

            {/* Chips */}
            {chips.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {chips.map((chip, i) => (
                        <span
                            key={i}
                            style={{
                                padding: "3px 10px",
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 700,
                                background: `${cfg.textColor}18`,
                                color: cfg.textColor,
                                border: `1px solid ${cfg.border}`,
                            }}
                        >
                            {chip}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default GreenlightBanner;
