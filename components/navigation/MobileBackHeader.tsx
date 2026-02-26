"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface MobileBackHeaderProps {
    title: string;
    /** Override the back href. Defaults to router.back(). */
    href?: string;
}

export function MobileBackHeader({ title, href }: MobileBackHeaderProps) {
    const router = useRouter();

    function handleBack() {
        if (href) {
            router.push(href);
        } else {
            router.back();
        }
    }

    return (
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-hc-bg border-b border-hc-border-bare backdrop-blur-sm">
            <button
                onClick={handleBack}
                aria-label="Go back"
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-hc-surface border border-hc-border text-hc-muted hover:text-hc-text hover:border-hc-border-high transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-sm font-black text-hc-text uppercase tracking-widest truncate">
                {title}
            </h1>
        </header>
    );
}

export default MobileBackHeader;
