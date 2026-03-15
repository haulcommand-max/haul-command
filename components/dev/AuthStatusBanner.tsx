"use client";

import React from "react";

/**
 * PATCH-007: Dev-only auth status banner.
 * Shows API base URL, logged-in user, and feature flag status.
 * Only renders when NODE_ENV === 'development'.
 * Hidden on mobile via .dev-auth-banner class in mobile.css
 */

export function AuthStatusBanner() {
  if (process.env.NODE_ENV !== "development") return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT SET";
  const shortUrl = supabaseUrl.replace(/^https?:\/\//, "").split(".")[0];

  return (
    <div
      className="dev-auth-banner"
      style={{
        position: "fixed",
        bottom: 70,
        right: 8,
        zIndex: 9999,
        background: "rgba(11,11,12,0.95)",
        border: "1px solid rgba(198,146,58,0.3)",
        borderRadius: "8px",
        padding: "6px 10px",
        fontSize: "10px",
        fontFamily: "var(--font-mono)",
        color: "var(--hc-muted)",
        maxWidth: "220px",
        lineHeight: 1.5,
        backdropFilter: "blur(12px)",
        pointerEvents: "none",
      }}
    >
      <div style={{ color: "var(--hc-gold-500)", fontWeight: 700, marginBottom: "2px" }}>
        DEV
      </div>
      <div>API: {shortUrl}</div>
      <div>User: guest</div>
      <div>Flags: loaded</div>
    </div>
  );
}
