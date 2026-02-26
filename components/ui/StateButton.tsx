"use client";

import React, { useState } from "react";
import Link from "next/link";

// ══════════════════════════════════════════════════════════════════════════════
// StateButton — 2026 mobile-first directory navigation button
// Spec: centered, uppercase, 52/56px height, press scale(0.98), hot/new badges
// ══════════════════════════════════════════════════════════════════════════════

export interface StateButtonProps {
    href: string;
    label: string;
    emoji?: string;
    sublabel?: string;
    /** Operator/load count shown as microdata */
    count?: number;
    /** Show HOT badge (top 20% activity) */
    hot?: boolean;
    /** Show NEW badge (recently added) */
    isNew?: boolean;
    active?: boolean;
}

export function StateButton({ href, label, emoji, sublabel, count, hot, isNew, active = false }: StateButtonProps) {
    const [pressed, setPressed] = useState(false);
    const [hovered, setHovered] = useState(false);

    const bg = pressed || active ? "#1b2a3d" : hovered ? "#162232" : "#121a24";
    const border = pressed || active
        ? "1px solid #f5b942"
        : hovered
            ? "1px solid rgba(245,185,66,0.45)"
            : "1px solid rgba(255,255,255,0.08)";
    const shadow = pressed || active
        ? "0 0 0 1px rgba(245,185,66,0.35), 0 4px 14px rgba(0,0,0,0.35)"
        : hovered
            ? "0 0 0 1px rgba(245,185,66,0.25), 0 8px 24px rgba(0,0,0,0.35)"
            : "0 4px 14px rgba(0,0,0,0.25)";
    const transform = pressed
        ? "scale(0.98)"
        : hovered
            ? "translateY(-1px)"
            : "none";

    return (
        <Link
            href={href}
            className="state-btn"
            style={{
                display: "block",
                outline: "none",
                WebkitTapHighlightColor: "transparent",
                textDecoration: "none",
                cursor: "pointer",
                userSelect: "none",
                height: "100%", // maintain grid cell height so click isn't missed
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => { setHovered(false); setPressed(false); }}
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            onTouchStart={() => setPressed(true)}
            onTouchEnd={() => { setPressed(false); }}
            onFocus={e => {
                const inner = e.currentTarget.querySelector('.state-btn-inner') as HTMLElement;
                if (inner) {
                    inner.style.outline = "2px solid rgba(59,164,255,0.6)";
                    inner.style.outlineOffset = "2px";
                }
            }}
            onBlur={e => {
                const inner = e.currentTarget.querySelector('.state-btn-inner') as HTMLElement;
                if (inner) inner.style.outline = "none";
            }}
        >
            <div
                className="state-btn-inner"
                style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    height: "100%", // fill the Link
                    padding: "10px 8px",
                    borderRadius: 10,
                    // Dynamic states
                    background: bg,
                    border,
                    boxShadow: shadow,
                    transform,
                    transition: pressed
                        ? "transform 90ms ease, box-shadow 90ms ease"
                        : "all 160ms ease",
                }}
            >
                {/* Hot / New badge — top right corner */}
                {(hot || isNew) && (
                    <span style={{
                        position: "absolute",
                        top: 5,
                        right: 5,
                        padding: "2px 5px",
                        borderRadius: 4,
                        fontSize: 8,
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        background: hot ? "rgba(39,209,127,0.15)" : "rgba(59,164,255,0.15)",
                        color: hot ? "#27d17f" : "#3ba4ff",
                        border: `1px solid ${hot ? "rgba(39,209,127,0.35)" : "rgba(59,164,255,0.35)"}`,
                        lineHeight: 1,
                    }}>
                        {hot ? "HOT" : "NEW"}
                    </span>
                )}

                {/* Optional emoji */}
                {emoji && (
                    <span className="state-btn-emoji" style={{ lineHeight: 1, marginBottom: 4 }}>
                        {emoji}
                    </span>
                )}

                {/* State / region label */}
                <span className="state-btn-label" style={{
                    fontWeight: 600,
                    color: "#e6edf3",
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                    lineHeight: 1.2,
                    display: "block",
                }}>
                    {label}
                </span>

                {/* Sub-label (optional note) */}
                {sublabel && (
                    <span style={{
                        fontSize: 9,
                        color: "#8fa3b8",
                        marginTop: 3,
                        lineHeight: 1.3,
                        display: "block",
                        maxWidth: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}>
                        {sublabel}
                    </span>
                )}

                {/* Operator count microdata */}
                {count != null && count > 0 && (
                    <span style={{
                        marginTop: 5,
                        fontSize: 9,
                        fontWeight: 700,
                        color: "rgba(245,185,66,0.7)",
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: "0.05em",
                    }}>
                        {count.toLocaleString()} ops
                    </span>
                )}
            </div>
        </Link>
    );
}

// ─── StateButtonGrid — responsive CSS grid with proper breakpoints
interface StateButtonGridProps {
    children: React.ReactNode;
    className?: string;
}

export function StateButtonGrid({ children, className = "" }: StateButtonGridProps) {
    return (
        <>
            <style>{`
                .state-btn-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                    padding: 12px 0;
                }
                .state-btn-grid .state-btn-emoji { font-size: 18px; }
                .state-btn-grid .state-btn-label { font-size: 14px; }
                .state-btn-grid .state-btn     { min-height: 52px; }

                @media (min-width: 640px) {
                    .state-btn-grid {
                        grid-template-columns: repeat(3, 1fr);
                        gap: 12px;
                        padding: 16px 0;
                    }
                }
                @media (min-width: 1025px) {
                    .state-btn-grid {
                        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                        gap: 14px;
                        padding: 20px 0;
                    }
                    .state-btn-grid .state-btn-label { font-size: 15px; }
                    .state-btn-grid .state-btn     { min-height: 56px; }
                    .state-btn-grid .state-btn-emoji { font-size: 20px; }
                }
            `}</style>
            <div className={`state-btn-grid ${className}`}>
                {children}
            </div>
        </>
    );
}

export default StateButton;
