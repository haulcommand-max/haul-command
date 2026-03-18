"use client";

import { useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
        <div className="min-h-screen flex items-center justify-center bg-[#060a14] px-4 py-8">
            {/* Ambient glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/[0.04] rounded-full blur-[120px] pointer-events-none" />

            <div className="relative w-full max-w-[420px]">
                {/* Card */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 md:p-10 shadow-2xl shadow-black/40">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-block">
                            <h1 className="text-2xl font-black text-white tracking-tight">
                                HAUL <span className="text-accent">COMMAND</span>
                            </h1>
                        </Link>
                        <p className="text-gray-500 text-sm mt-2">
                            Sign in to the global heavy-haul intelligence network
                        </p>
                    </div>

                    {/* Error banner */}
                    {error && (
                        <div className="w-full px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center mb-6">
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
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-white/[0.06]" />
                        <span className="text-[10px] text-gray-600 uppercase tracking-widest font-medium">
                            or continue with email
                        </span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>

                    {/* Email placeholder */}
                    <div className="w-full">
                        <input
                            type="email"
                            placeholder="you@company.com"
                            disabled
                            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-500 text-sm placeholder:text-gray-700 outline-none opacity-50 cursor-not-allowed"
                        />
                        <p className="text-gray-600 text-[11px] mt-2 text-center">
                            Email login coming soon
                        </p>
                    </div>

                    {/* Footer */}
                    <p className="text-gray-600 text-[11px] text-center mt-8 leading-relaxed">
                        By signing in, you agree to HAUL COMMAND&apos;s{" "}
                        <Link href="/terms" className="text-gray-500 hover:text-accent transition-colors">Terms of Service</Link>
                        {" "}and{" "}
                        <Link href="/privacy" className="text-gray-500 hover:text-accent transition-colors">Privacy Policy</Link>.
                    </p>

                    {/* Dev status banner */}
                    {flags.dev.auth_status_banner && (
                        <div className="w-full mt-4 px-3 py-2 rounded-lg bg-accent/[0.06] border border-accent/10 text-[10px] text-accent/70 text-center font-mono">
                            DEV: Google={flags.auth.google_enabled ? "ON" : "OFF"} Facebook=
                            {flags.auth.facebook_enabled ? "ON" : "OFF"} LinkedIn=
                            {flags.auth.linkedin_enabled ? "ON" : "OFF"}
                        </div>
                    )}
                </div>

                {/* Bottom accent line */}
                <div className="h-px w-24 mx-auto mt-6 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
            </div>
        </div>
    );
}

export default function LoginClient({ flags }: { flags: FeatureFlags }) {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-[#060a14]">
                    <div className="text-gray-600 text-sm animate-pulse">Loading…</div>
                </div>
            }
        >
            <LoginForm flags={flags} />
        </Suspense>
    );
}
