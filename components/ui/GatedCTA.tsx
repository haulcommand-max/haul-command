"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type GatedCTAMode = "live" | "coming_soon" | "onboarding";

interface GatedCTAProps {
    mode: GatedCTAMode;
    providerKey?: string;
    className?: string;
    /** Override the headline text */
    headline?: string;
}

export function GatedCTA({ mode, providerKey, className = "", headline }: GatedCTAProps) {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleEmailCapture(e: React.FormEvent) {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        const supabase = createClient();
        await supabase.from("newsletter_signups").upsert(
            { email: email.toLowerCase().trim(), source: providerKey ? `provider:${providerKey}` : "coming_soon" },
            { onConflict: "email" }
        );
        setSubmitted(true);
        setLoading(false);
    }

    if (mode === "coming_soon") {
        return (
            <div className={`gated-cta gated-cta--coming-soon ${className}`} style={containerStyle}>
                <div style={iconStyle}>🚧</div>
                <h3 style={headingStyle}>{headline ?? "Launching Soon in Your Market"}</h3>
                <p style={subtitleStyle}>
                    Be first to access verified escort contacts, real-time loads, and corridor intel when we go live.
                </p>
                {submitted ? (
                    <div style={successStyle}>✅ You're on the list. We'll notify you at launch.</div>
                ) : (
                    <form onSubmit={handleEmailCapture} style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                            style={inputStyle}
                        />
                        <button type="submit" disabled={loading} style={primaryBtnStyle}>
                            {loading ? "Saving..." : "Notify Me"}
                        </button>
                    </form>
                )}
            </div>
        );
    }

    if (mode === "onboarding") {
        return (
            <div className={`gated-cta gated-cta--onboarding ${className}`} style={containerStyle}>
                <div style={iconStyle}>⚡</div>
                <h3 style={headingStyle}>{headline ?? "Complete Your Profile to Get Matched"}</h3>
                <p style={subtitleStyle}>
                    Verified providers get 3× more load offers. Add your certifications, coverage area, and equipment.
                </p>
                <a href={providerKey ? `/profile/edit?key=${providerKey}` : "/profile/edit"} style={primaryBtnStyle}>
                    Complete Profile →
                </a>
            </div>
        );
    }

    // mode === "live"
    return (
        <div className={`gated-cta gated-cta--live ${className}`} style={containerStyle}>
            <div style={iconStyle}>🏆</div>
            <h3 style={headingStyle}>{headline ?? "Join the #1 Heavy Haul Network"}</h3>
            <p style={subtitleStyle}>
                Access verified broker loads, build your trust score, and get matched with high-paying corridors.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                <a href="/onboarding" style={primaryBtnStyle}>
                    Join Free — See Full Profile
                </a>
                <a href="/login" style={secondaryBtnStyle}>
                    Sign In
                </a>
            </div>
            <p style={{ fontSize: 11, color: "var(--hc-muted, #888)", marginTop: 10 }}>
                No credit card required · Free for providers
            </p>
        </div>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
    padding: "28px 24px",
    background: "linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(245,158,11,0.02) 100%)",
    border: "1px solid rgba(245,158,11,0.25)",
    borderRadius: 16,
    textAlign: "center",
    maxWidth: 520,
    margin: "0 auto",
};

const iconStyle: React.CSSProperties = {
    fontSize: 32,
    marginBottom: 8,
};

const headingStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 900,
    color: "var(--hc-text, #f5f5f5)",
    margin: "0 0 8px 0",
};

const subtitleStyle: React.CSSProperties = {
    fontSize: 13,
    color: "var(--hc-muted, #aaa)",
    margin: "0 0 16px 0",
    lineHeight: 1.5,
};

const primaryBtnStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "12px 24px",
    background: "var(--hc-gold-600, #d97706)",
    color: "#111",
    fontWeight: 900,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    textDecoration: "none",
    transition: "opacity 0.15s",
};

const secondaryBtnStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "12px 20px",
    background: "transparent",
    color: "var(--hc-text, #f5f5f5)",
    fontWeight: 700,
    fontSize: 13,
    borderRadius: 10,
    border: "1px solid var(--hc-border, #333)",
    cursor: "pointer",
    textDecoration: "none",
    transition: "border-color 0.15s",
};

const inputStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid var(--hc-border, #333)",
    background: "var(--hc-panel, #1a1a1a)",
    color: "var(--hc-text, #f5f5f5)",
    fontSize: 13,
    outline: "none",
    minWidth: 220,
};

const successStyle: React.CSSProperties = {
    padding: "10px 16px",
    background: "rgba(34,197,94,0.1)",
    border: "1px solid rgba(34,197,94,0.3)",
    borderRadius: 8,
    color: "#22c55e",
    fontSize: 13,
    fontWeight: 700,
};
