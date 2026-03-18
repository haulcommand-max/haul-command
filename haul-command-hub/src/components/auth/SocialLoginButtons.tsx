"use client";

import { useState, type ReactNode } from "react";

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
    { label: string; icon: ReactNode; bg: string; hoverBg: string }
> = {
    google: {
        label: "Google",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
        ),
        bg: "bg-white hover:bg-gray-50",
        hoverBg: "hover:bg-gray-100",
    },
    facebook: {
        label: "Facebook",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
        ),
        bg: "bg-[#1877F2] hover:bg-[#166FE5]",
        hoverBg: "hover:bg-[#166FE5]",
    },
    linkedin: {
        label: "LinkedIn",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
        ),
        bg: "bg-[#0A66C2] hover:bg-[#004182]",
        hoverBg: "hover:bg-[#004182]",
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

    // Dev guard
    if (process.env.NODE_ENV !== "production") {
        const anyEnabled = enabledGoogle || enabledFacebook || enabledLinkedIn;
        if (anyEnabled && !onProvider) {
            throw new Error(
                "SocialLoginButtons: provider enabled but onProvider handler is missing."
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
            <div className="flex flex-col gap-3 w-full">
                {providers.map(({ key, enabled }) => {
                    const cfg = PROVIDER_CONFIG[key];
                    const isLoading = loading === key;
                    const isGoogle = key === "google";

                    return (
                        <button
                            key={key}
                            onClick={() => handleClick(key, enabled)}
                            disabled={isLoading}
                            className={`
                                flex items-center justify-center gap-3 w-full py-3.5 px-6 rounded-xl
                                font-semibold text-sm transition-all duration-200
                                ${enabled
                                    ? isGoogle
                                        ? "bg-white text-gray-800 hover:bg-gray-100 border border-white/20"
                                        : `${cfg.bg} text-white border border-white/10`
                                    : "bg-white/[0.06] text-gray-500 border border-white/[0.08] cursor-default"
                                }
                                ${isLoading ? "opacity-70 cursor-wait" : ""}
                            `}
                            aria-label={`Sign in with ${cfg.label}`}
                        >
                            <span className="flex-shrink-0">{cfg.icon}</span>
                            <span>
                                {isLoading
                                    ? "Connecting…"
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
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-8 max-w-sm w-[90%] text-center"
                    >
                        <h3 className="text-xl font-bold text-white mb-3">
                            {PROVIDER_CONFIG[comingSoonModal].label} Login
                        </h3>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            {PROVIDER_CONFIG[comingSoonModal].label} sign-in is coming soon.
                            We&apos;re working on it — check back shortly.
                        </p>
                        <button
                            onClick={() => setComingSoonModal(null)}
                            className="px-8 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white font-semibold text-sm hover:bg-white/[0.08] transition-colors"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
