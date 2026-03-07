"use client";

import { useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { FeatureFlags } from "@/lib/flags";
import { createClient } from "@/lib/supabase";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { trackEvent } from "@/lib/events/event-journal";

function LoginForm({ flags }: { flags: FeatureFlags }) {
    const sp = useSearchParams();
    const returnTo = sp.get("returnTo") ?? "/";
    const error = sp.get("error");

    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        trackEvent("auth_view_login");
    }, []);

    async function handleOAuth(provider: "google" | "facebook" | "linkedin") {
        trackEvent("auth_click_provider", { provider, returnTo });

        const linkedinProvider =
            (process.env.NEXT_PUBLIC_SUPABASE_LINKEDIN_PROVIDER as
                | "linkedin"
                | "linkedin_oidc") ?? "linkedin_oidc";

        const mappedProvider =
            provider === "linkedin" ? linkedinProvider : provider;

        const baseUrl =
            typeof window !== "undefined" ? window.location.origin : "";

        const redirectTo = `${baseUrl}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`;

        const { error: authError } = await supabase.auth.signInWithOAuth({
            provider: mappedProvider as "google" | "facebook" | "linkedin_oidc",
            options: { redirectTo },
        });

        if (authError) {
            trackEvent("auth_error", { provider, error: authError.message });
            alert("Login failed. Please try again.");
        }
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                padding: "2rem",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 440,
                    background: "rgba(30, 41, 59, 0.8)",
                    backdropFilter: "blur(20px)",
                    borderRadius: "1.25rem",
                    border: "1px solid rgba(255,255,255,0.08)",
                    padding: "3rem 2rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "1.5rem",
                }}
            >
                {/* Logo / Brand */}
                <div style={{ textAlign: "center" }}>
                    <h1
                        style={{
                            fontSize: "1.75rem",
                            fontWeight: 800,
                            color: "#F9FAFB",
                            letterSpacing: "-0.02em",
                            marginBottom: "0.5rem",
                        }}
                    >
                        HAUL COMMAND
                    </h1>
                    <p style={{ color: "#94A3B8", fontSize: "0.95rem" }}>
                        Sign in to the global heavy-haul intelligence network
                    </p>
                </div>

                {/* Error banner */}
                {error && (
                    <div
                        style={{
                            width: "100%",
                            padding: "0.75rem 1rem",
                            borderRadius: "0.5rem",
                            backgroundColor: "rgba(239,68,68,0.15)",
                            border: "1px solid rgba(239,68,68,0.3)",
                            color: "#FCA5A5",
                            fontSize: "0.875rem",
                            textAlign: "center",
                        }}
                    >
                        {error === "missing_code"
                            ? "Login was interrupted. Please try again."
                            : error === "oauth_exchange_failed"
                                ? "Could not complete sign-in. Please try again."
                                : "An error occurred. Please try again."}
                    </div>
                )}

                {/* Social Login Buttons */}
                <SocialLoginButtons
                    flags={{
                        google_enabled: flags.auth.google_enabled,
                        facebook_enabled: flags.auth.facebook_enabled,
                        linkedin_enabled: flags.auth.linkedin_enabled,
                    }}
                    onProvider={handleOAuth}
                />

                {/* Divider */}
                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        color: "#475569",
                        fontSize: "0.8rem",
                    }}
                >
                    <div style={{ flex: 1, height: 1, backgroundColor: "#334155" }} />
                    <span>or continue with email</span>
                    <div style={{ flex: 1, height: 1, backgroundColor: "#334155" }} />
                </div>

                {/* Email placeholder */}
                <div style={{ width: "100%", maxWidth: 380 }}>
                    <input
                        type="email"
                        placeholder="you@company.com"
                        disabled
                        style={{
                            width: "100%",
                            padding: "0.75rem 1rem",
                            borderRadius: "0.5rem",
                            border: "1px solid #334155",
                            backgroundColor: "#1E293B",
                            color: "#94A3B8",
                            fontSize: "0.95rem",
                            outline: "none",
                            opacity: 0.5,
                        }}
                    />
                    <p
                        style={{
                            color: "#64748B",
                            fontSize: "0.75rem",
                            marginTop: "0.5rem",
                            textAlign: "center",
                        }}
                    >
                        Email login coming soon
                    </p>
                </div>

                {/* Footer */}
                <p
                    style={{
                        color: "#475569",
                        fontSize: "0.75rem",
                        textAlign: "center",
                        marginTop: "0.5rem",
                        lineHeight: 1.5,
                    }}
                >
                    By signing in, you agree to HAUL COMMAND&apos;s Terms of Service and
                    Privacy Policy.
                </p>

                {/* Dev status banner */}
                {flags.dev.auth_status_banner && (
                    <div
                        style={{
                            width: "100%",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "0.375rem",
                            backgroundColor: "rgba(251,191,36,0.1)",
                            border: "1px solid rgba(251,191,36,0.2)",
                            fontSize: "0.7rem",
                            color: "#FBBF24",
                            textAlign: "center",
                            fontFamily: "monospace",
                        }}
                    >
                        DEV: Google={flags.auth.google_enabled ? "ON" : "OFF"} Facebook=
                        {flags.auth.facebook_enabled ? "ON" : "OFF"} LinkedIn=
                        {flags.auth.linkedin_enabled ? "ON" : "OFF"}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function LoginClient({ flags }: { flags: FeatureFlags }) {
    return (
        <Suspense
            fallback={
                <div
                    style={{
                        minHeight: "100vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#0F172A",
                        color: "#94A3B8",
                    }}
                >
                    Loading...
                </div>
            }
        >
            <LoginForm flags={flags} />
        </Suspense>
    );
}
