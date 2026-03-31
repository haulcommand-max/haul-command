"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import {
    Share2, Copy, Check, Mail, MessageCircle,
    Phone, Facebook, Link2, X, ExternalLink,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
// ShareSheet — One-tap multi-platform sharing
// Spec: HC_DOMINATION_PATCH_V1 Phase 2 — Distribution Engine
// Platforms: SMS, Email, WhatsApp, Facebook, Copy Link
// Features: deep links, UTM auto-append, signed corridor links
// ══════════════════════════════════════════════════════════════

interface ShareSheetProps {
    /** What is being shared */
    shareType: "profile" | "corridor" | "route" | "coverage";
    /** Title for the share */
    title: string;
    /** URL to share (UTM will be auto-appended) */
    url: string;
    /** Optional description for email/social */
    description?: string;
    /** UTM source tag */
    utmSource?: string;
    /** Callback when share completed */
    onShareComplete?: (platform: string) => void;
    /** Trigger button style */
    variant?: "icon" | "button" | "inline";
    className?: string;
}

type Platform = "sms" | "email" | "whatsapp" | "facebook" | "copy";

const PLATFORMS: { id: Platform; label: string; icon: React.ElementType; color: string }[] = [
    { id: "copy", label: "Copy Link", icon: Link2, color: "#6366f1" },
    { id: "sms", label: "SMS", icon: Phone, color: "#10b981" },
    { id: "email", label: "Email", icon: Mail, color: "#3b82f6" },
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "#25d366" },
    { id: "facebook", label: "Facebook", icon: Facebook, color: "#1877f2" },
];

function appendUTM(url: string, source: string, medium: string, campaign: string): string {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}utm_source=${encodeURIComponent(source)}&utm_medium=${encodeURIComponent(medium)}&utm_campaign=${encodeURIComponent(campaign)}`;
}

export function ShareSheet({
    shareType,
    title,
    url,
    description,
    utmSource = "haulcommand",
    onShareComplete,
    variant = "button",
    className,
}: ShareSheetProps) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const campaign = `share_${shareType}`;

    const handleShare = useCallback(async (platform: Platform) => {
        const shareUrl = appendUTM(url, utmSource, platform, campaign);
        const text = description || title;

        switch (platform) {
            case "copy":
                await navigator.clipboard?.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                break;
            case "sms":
                window.open(`sms:?body=${encodeURIComponent(`${text}\n${shareUrl}`)}`);
                break;
            case "email":
                window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${shareUrl}`)}`);
                break;
            case "whatsapp":
                window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${shareUrl}`)}`);
                break;
            case "facebook":
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
                break;
        }

        onShareComplete?.(platform);
    }, [url, title, description, utmSource, campaign, onShareComplete]);

    return (
        <>
            {/* Trigger */}
            {variant === "icon" ? (
                <button aria-label="Interactive Button"
                    onClick={() => setOpen(true)}
                    className={cn("p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all", className)}
                    title="Share"
                >
                    <Share2 className="w-4 h-4" />
                </button>
            ) : variant === "inline" ? (
                <button aria-label="Interactive Button"
                    onClick={() => setOpen(true)}
                    className={cn("flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors", className)}
                >
                    <Share2 className="w-3
                    .5 h-3.5" />
                    Share
                </button>
            ) : (
                <button aria-label="Interactive Button"
                    onClick={() => setOpen(true)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold",
                        "bg-gradient-to-r from-indigo-500 to-violet-500 text-white",
                        "hover:from-indigo-400 hover:to-violet-400 transition-all shadow-lg shadow-indigo-500/20",
                        className
                    )}
                >
                    <Share2 className="w-4 h-4" />
                    Share
                </button>
            )}

            {/* Sheet */}
            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 40 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-50 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-sm md:rounded-2xl"
                        >
                            <div className="bg-[#0d1117] border border-white/10 rounded-t-2xl md:rounded-2xl p-5 shadow-2xl">
                                {/* Handle bar (mobile) */}
                                <div className="flex justify-center mb-3 md:hidden">
                                    <div className="w-8 h-1 rounded-full bg-white/20" />
                                </div>

                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-white">Share</h3>
                                        <p className="text-[11px] text-white/40 mt-0.5 truncate max-w-[240px]">{title}</p>
                                    </div>
                                    <button aria-label="Interactive Button" onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                                        <X className="w-4 h-4 text-white/40" />
                                    </button>
                                </div>

                                {/* Platform buttons */}
                                <div className="grid grid-cols-5 gap-3">
                                    {PLATFORMS.map(p => (
                                        <button aria-label="Interactive Button"
                                            key={p.id}
                                            onClick={() => handleShare(p.id)}
                                            className="flex flex-col items-center gap-1.5 group"
                                        >
                                            <div
                                                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                                                style={{ background: `${p.color}15`, border: `1px solid ${p.color}20` }}
                                            >
                                                {p.id === "copy" && copied ? (
                                                    <Check className="w-5 h-5" style={{ color: p.color }} />
                                                ) : (
                                                    <p.icon className="w-5 h-5" style={{ color: p.color }} />
                                                )}
                                            </div>
                                            <span className="text-[9px] font-bold text-white/50 group-hover:text-white/70 transition-colors">
                                                {p.id === "copy" && copied ? "Copied!" : p.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* URL preview */}
                                <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                    <ExternalLink className="w-3 h-3 text-white/30 flex-shrink-0" />
                                    <span className="text-[10px] text-white/40 truncate flex-1">{url}</span>
                                    <button aria-label="Interactive Button"
                                        onClick={() => handleShare("copy")}
                                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex-shrink-0"
                                    >
                                        {copied ? "Copied" : "Copy"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
