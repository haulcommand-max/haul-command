"use client";

import React, { useState } from "react";

/**
 * PATCH-006: Social Login Buttons with feature flag gating.
 * Shows Google / Facebook / LinkedIn sign-in buttons.
 * Disabled providers show a "Coming Soon" modal.
 */

const PROVIDERS = [
  {
    id: "google" as const,
    label: "Continue with Google",
    bg: "#4285F4",
    svg: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
        <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
      </svg>
    ),
  },
  {
    id: "facebook" as const,
    label: "Continue with Facebook",
    bg: "#1877F2",
    svg: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="white">
        <path d="M18 9a9 9 0 10-10.406 8.89v-6.29H5.309V9h2.285V7.017c0-2.258 1.345-3.505 3.4-3.505.985 0 2.015.176 2.015.176v2.215h-1.135c-1.118 0-1.467.694-1.467 1.406V9h2.496l-.399 2.6h-2.097v6.29A9.003 9.003 0 0018 9z" />
      </svg>
    ),
  },
  {
    id: "linkedin" as const,
    label: "Continue with LinkedIn",
    bg: "#0A66C2",
    svg: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="white">
        <path d="M15.335 15.339H12.67v-4.177c0-.996-.02-2.278-1.39-2.278-1.39 0-1.601 1.084-1.601 2.205v4.25H7.014V6.75h2.56v1.17h.035c.358-.674 1.228-1.387 2.528-1.387 2.7 0 3.2 1.778 3.2 4.091v4.715zM4.003 5.575a1.546 1.546 0 110-3.092 1.546 1.546 0 010 3.092zM5.339 15.339H2.666V6.75H5.34v8.589zM16.67 0H1.329C.593 0 0 .58 0 1.297v15.406C0 17.42.593 18 1.33 18h15.338C17.4 18 18 17.42 18 16.703V1.297C18 .58 17.4 0 16.67 0z" />
      </svg>
    ),
  },
] as const;

type ProviderId = typeof PROVIDERS[number]["id"];

// Feature flags — flip to true when OAuth is wired in Supabase/Firebase
const ENABLED_PROVIDERS: Record<ProviderId, boolean> = {
  google: true,
  facebook: false,
  linkedin: false,
};

interface Props {
  onProvider?: (provider: ProviderId) => void;
  enabledOverrides?: Partial<Record<ProviderId, boolean>>;
}

export function SocialLoginButtons({ onProvider, enabledOverrides }: Props) {
  const [comingSoonFor, setComingSoonFor] = useState<ProviderId | null>(null);

  const isEnabled = (id: ProviderId) =>
    enabledOverrides?.[id] ?? ENABLED_PROVIDERS[id];

  const handleClick = (id: ProviderId) => {
    if (isEnabled(id)) {
      onProvider?.(id);
    } else {
      setComingSoonFor(id);
    }
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => handleClick(p.id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              width: "100%",
              height: "48px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: isEnabled(p.id) ? p.bg : "rgba(255,255,255,0.04)",
              color: isEnabled(p.id) ? "#fff" : "var(--hc-muted)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              opacity: isEnabled(p.id) ? 1 : 0.6,
              transition: "all 0.15s",
            }}
          >
            {p.svg}
            {p.label}
          </button>
        ))}
      </div>

      {/* Coming Soon Modal */}
      {comingSoonFor && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.7)",
          }}
          onClick={() => setComingSoonFor(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--hc-surface)",
              border: "1px solid var(--hc-border)",
              borderRadius: "16px",
              padding: "2rem",
              maxWidth: "360px",
              width: "90%",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--hc-text)" }}>
              Coming Soon
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--hc-muted)", marginBottom: "1.5rem" }}>
              {comingSoonFor.charAt(0).toUpperCase() + comingSoonFor.slice(1)} sign-in
              is not enabled yet. We&apos;re working on it.
            </p>
            <button
              onClick={() => setComingSoonFor(null)}
              className="brand-button"
              style={{ width: "100%", padding: "0.75rem" }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
