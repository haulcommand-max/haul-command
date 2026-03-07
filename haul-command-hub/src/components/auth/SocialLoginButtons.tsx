"use client";

import { useState } from "react";

type Provider = "google" | "facebook" | "linkedin";

interface SocialLoginButtonsProps {
    flags?: {
        google_enabled: boolean;
        facebook_enabled: boolean;
        linkedin_enabled: boolean;
    };
    enabledOverrides?: {
        google?: boolean;
        facebook?: boolean;
        linkedin?: boolean;
    };
    onProvider?: (provider: Provider) => Promise<void> | void;
}

const PROVIDER_CONFIG: Record<
    Provider,
    { label: string; icon: string; color: string; hoverColor: string }
> = {
    google: {
        label: "Google",
        icon: "G",
        color: "#4285F4",
        hoverColor: "#3367D6",
    },
    facebook: {
        label: "Facebook",
        icon: "f",
        color: "#1877F2",
        hoverColor: "#166FE5",
    },
    linkedin: {
        label: "LinkedIn",
        icon: "in",
        color: "#0A66C2",
        hoverColor: "#004182",
    },
};

export function SocialLoginButtons({
    flags,
    enabledOverrides,
    onProvider,
}: SocialLoginButtonsProps) {
    const [loading, setLoading] = useState<Provider | null>(null);
    const [comingSoonModal, setComingSoonModal] = useState<Provider | null>(null);

    const enabledGoogle = enabledOverrides?.google ?? flags?.google_enabled ?? false;
    const enabledFacebook = enabledOverrides?.facebook ?? flags?.facebook_enabled ?? false;
    const enabledLinkedIn = enabledOverrides?.linkedin ?? flags?.linkedin_enabled ?? false;

    // Dev guard: if a provider is enabled, onProvider MUST exist
    if (process.env.NODE_ENV !== "production") {
        const anyEnabled = enabledGoogle || enabledFacebook || enabledLinkedIn;
        if (anyEnabled && !onProvider) {
            throw new Error(
                "SocialLoginButtons: provider enabled but onProvider handler is missing. " +
                "Wire handleOAuth or disable the provider flag."
            );
        }
    }

    const providers: { key: Provider; enabled: boolean }[] = [
        { key: "google", enabled: enabledGoogle },
        { key: "facebook", enabled: enabledFacebook },
        { key: "linkedin", enabled: enabledLinkedIn },
    ];

    async function handleClick(provider: Provider, enabled: boolean) {
        if (!enabled) {
            setComingSoonModal(provider);
            return;
        }
        if (!onProvider) return;
        setLoading(provider);
        try {
            await onProvider(provider);
        } catch (err) {
            console.error(`[auth] ${provider} login failed:`, err);
        } finally {
            setLoading(null);
        }
    }

    return (
        <>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", maxWidth: 380 }}>
                {providers.map(({ key, enabled }) => {
                    const cfg = PROVIDER_CONFIG[key];
                    const isLoading = loading === key;
                    return (
                        <button
                            key={key}
                            onClick={() => handleClick(key, enabled)}
                            disabled={isLoading}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.75rem",
                                padding: "0.75rem 1.5rem",
                                borderRadius: "0.5rem",
                                border: "none",
                                backgroundColor: enabled ? cfg.color : "#374151",
                                color: "#fff",
                                fontSize: "0.95rem",
                                fontWeight: 600,
                                cursor: isLoading ? "wait" : "pointer",
                                opacity: isLoading ? 0.7 : enabled ? 1 : 0.5,
                                transition: "all 0.2s ease",
                                position: "relative",
                            }}
                            aria-label={`Sign in with ${cfg.label}`}
                        >
                            <span style={{ fontWeight: 700, fontSize: "1.1rem", width: 24, textAlign: "center" }}>
                                {cfg.icon}
                            </span>
                            <span>
                                {isLoading
                                    ? "Connecting..."
                                    : enabled
                                        ? `Continue with ${cfg.label}`
                                        : `${cfg.label} — Coming Soon`}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Coming Soon Modal */}
            {comingSoonModal && (
                <div
                    onClick={() => setComingSoonModal(null)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0,0,0,0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: "#1F2937",
                            borderRadius: "1rem",
                            padding: "2rem",
                            maxWidth: 400,
                            width: "90%",
                            textAlign: "center",
                            color: "#F9FAFB",
                        }}
                    >
                        <h3 style={{ marginBottom: "0.75rem", fontSize: "1.25rem", fontWeight: 700 }}>
                            {PROVIDER_CONFIG[comingSoonModal].label} Login
                        </h3>
                        <p style={{ color: "#9CA3AF", marginBottom: "1.5rem", lineHeight: 1.6 }}>
                            {PROVIDER_CONFIG[comingSoonModal].label} sign-in is coming soon.
                            We&apos;re working on it — check back shortly.
                        </p>
                        <button
                            onClick={() => setComingSoonModal(null)}
                            style={{
                                padding: "0.5rem 2rem",
                                borderRadius: "0.5rem",
                                border: "1px solid #4B5563",
                                backgroundColor: "transparent",
                                color: "#F9FAFB",
                                cursor: "pointer",
                                fontWeight: 600,
                            }}
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
