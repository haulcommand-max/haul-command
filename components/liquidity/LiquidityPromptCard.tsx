"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface LiquidityPrompt {
    id: string;
    prompt_type: string;
    headline: string;
    body: string;
    cta_text: string;
    cta_href: string;
}

const PROMPT_ICONS: Record<string, string> = {
    go_online: "📡",
    post_load: "📦",
    verify_profile: "✅",
    invite_drivers: "🚀",
};

const PROMPT_COLORS: Record<string, string> = {
    go_online: "border-orange-500/40 bg-orange-500/10",
    post_load: "border-blue-500/40 bg-blue-500/10",
    verify_profile: "border-green-500/40 bg-green-500/10",
    invite_drivers: "border-purple-500/40 bg-purple-500/10",
};

const BUTTON_COLORS: Record<string, string> = {
    go_online: "bg-orange-500 hover:bg-orange-400",
    post_load: "bg-blue-600 hover:bg-blue-500",
    verify_profile: "bg-green-600 hover:bg-green-500",
    invite_drivers: "bg-purple-600 hover:bg-purple-500",
};

export function LiquidityPromptCard({ className = "" }: { className?: string }) {
    const [prompt, setPrompt] = useState<LiquidityPrompt | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        async function fetchPrompt() {
            try {
                const res = await fetch("/api/map/liquidity-prompt");
                if (!res.ok) return;
                const data = await res.json();
                if (data.prompt) setPrompt(data.prompt);
            } catch {
                // Fail silently — prompt is non-critical
            }
        }
        fetchPrompt();
    }, []);

    if (!prompt || dismissed) return null;

    const icon = PROMPT_ICONS[prompt.prompt_type] ?? "💡";
    const cardColor = PROMPT_COLORS[prompt.prompt_type] ?? "border-gray-500/40 bg-gray-500/10";
    const btnColor = BUTTON_COLORS[prompt.prompt_type] ?? "bg-gray-600 hover:bg-gray-500";

    return (
        <div
            className={`relative rounded-xl border ${cardColor} backdrop-blur-md p-4 shadow-lg animate-fade-in ${className}`}
        >
            <button
                onClick={() => setDismissed(true)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-300 text-lg leading-none"
                aria-label="Dismiss"
            >
                ×
            </button>

            <div className="flex items-start gap-3">
                <span className="text-2xl">{icon}</span>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm leading-tight mb-1">
                        {prompt.headline}
                    </h3>
                    <p className="text-gray-400 text-xs leading-snug mb-3">
                        {prompt.body}
                    </p>
                    <Link
                        href={prompt.cta_href}
                        className={`inline-block px-4 py-1.5 rounded-lg text-white text-xs font-bold transition-colors ${btnColor}`}
                    >
                        {prompt.cta_text}
                    </Link>
                </div>
            </div>
        </div>
    );
}
