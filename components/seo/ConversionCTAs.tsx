"use client";

/**
 * SEO Conversion CTAs
 * 
 * Three CTA types for directory/corridor/surface pages:
 * 1. Claim CTA — "Claim this listing"
 * 2. Post Load CTA — "Post a load"
 * 3. Operators Needed CTA — "Operators needed here"
 *
 * These convert SEO traffic into marketplace participants.
 */

import React from "react";
import { motion } from "framer-motion";
import { Shield, Truck, Users, ChevronRight, Zap, MapPin } from "lucide-react";

// ── CTA 1: Claim This Listing ───────────────────────────────────
export function ClaimListingCTA({
    entityId,
    companyName,
    variant = "card",
}: {
    entityId: string;
    companyName?: string;
    variant?: "card" | "inline" | "banner";
}) {
    if (variant === "inline") {
        return (
            <a
                href={`/claim/${entityId}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{
                    background: "rgba(241,169,27,0.08)",
                    border: "1px solid rgba(241,169,27,0.2)",
                    color: "#F1A91B",
                }}
            >
                <Shield className="w-4 h-4" />
                Is this your business? Claim it
                <ChevronRight className="w-3 h-3" />
            </a>
        );
    }

    if (variant === "banner") {
        return (
            <div
                className="w-full px-4 py-3 flex items-center justify-between rounded-xl"
                style={{
                    background: "linear-gradient(135deg, rgba(241,169,27,0.08), rgba(241,169,27,0.02))",
                    border: "1px solid rgba(241,169,27,0.15)",
                }}
            >
                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-[#F1A91B]" />
                    <div>
                        <div className="text-sm font-bold text-white">
                            {companyName ? `Is "${companyName}" your business?` : "Is this your business?"}
                        </div>
                        <div className="text-xs text-white/40">Claim your listing to receive load alerts and booking requests</div>
                    </div>
                </div>
                <a
                    href={`/claim/${entityId}`}
                    className="px-4 py-2 rounded-xl text-xs font-black text-black bg-[#F1A91B] hover:bg-[#e5a018] transition-all"
                >
                    Claim
                </a>
            </div>
        );
    }

    // Card variant (default)
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5"
            style={{
                background: "linear-gradient(135deg, rgba(241,169,27,0.06), rgba(241,169,27,0.01))",
                border: "1px solid rgba(241,169,27,0.12)",
            }}
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F1A91B]/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-[#F1A91B]" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-black text-white mb-1">Claim This Listing</h3>
                    <p className="text-xs text-white/40 mb-3">
                        Verify ownership to unlock your dashboard, receive load alerts, and appear higher in search results.
                    </p>
                    <a
                        href={`/claim/${entityId}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-black bg-[#F1A91B] hover:bg-[#e5a018] transition-all hover:-translate-y-0.5"
                        style={{ boxShadow: "0 0 20px rgba(241,169,27,0.2)" }}
                    >
                        <Zap className="w-3 h-3" /> Claim Now — 60 seconds
                    </a>
                </div>
            </div>
        </motion.div>
    );
}

// ── CTA 2: Post a Load ──────────────────────────────────────────
export function PostLoadCTA({
    corridorName,
    variant = "card",
}: {
    corridorName?: string;
    variant?: "card" | "inline" | "banner";
}) {
    if (variant === "inline") {
        return (
            <a
                href="/post-a-load"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{
                    background: "rgba(59,130,246,0.08)",
                    border: "1px solid rgba(59,130,246,0.2)",
                    color: "#3B82F6",
                }}
            >
                <Truck className="w-4 h-4" />
                Need an escort? Post a load
                <ChevronRight className="w-3 h-3" />
            </a>
        );
    }

    if (variant === "banner") {
        return (
            <div
                className="w-full px-4 py-3 flex items-center justify-between rounded-xl"
                style={{
                    background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.02))",
                    border: "1px solid rgba(59,130,246,0.15)",
                }}
            >
                <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-blue-400" />
                    <div>
                        <div className="text-sm font-bold text-white">Need an escort{corridorName ? ` on ${corridorName}` : ""}?</div>
                        <div className="text-xs text-white/40">Post a load and get matched with verified operators instantly</div>
                    </div>
                </div>
                <a
                    href="/post-a-load"
                    className="px-4 py-2 rounded-xl text-xs font-black text-white bg-blue-500 hover:bg-blue-600 transition-all"
                >
                    Post Load
                </a>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5"
            style={{
                background: "linear-gradient(135deg, rgba(59,130,246,0.06), rgba(59,130,246,0.01))",
                border: "1px solid rgba(59,130,246,0.12)",
            }}
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-black text-white mb-1">
                        Need an Escort{corridorName ? ` on ${corridorName}` : ""}?
                    </h3>
                    <p className="text-xs text-white/40 mb-3">
                        Post your load details and get matched with verified pilot car operators in minutes.
                    </p>
                    <a
                        href="/post-a-load"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-blue-500 hover:bg-blue-600 transition-all hover:-translate-y-0.5"
                        style={{ boxShadow: "0 0 20px rgba(59,130,246,0.2)" }}
                    >
                        <Zap className="w-3 h-3" /> Post a Load — Free
                    </a>
                </div>
            </div>
        </motion.div>
    );
}

// ── CTA 3: Operators Needed Here ────────────────────────────────
export function OperatorsNeededCTA({
    surfaceName,
    operatorsNeeded,
}: {
    surfaceName?: string;
    operatorsNeeded?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5"
            style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.01))",
                border: "1px solid rgba(16,185,129,0.12)",
            }}
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-black text-white mb-1">
                        {operatorsNeeded ? `${operatorsNeeded} Operators Needed` : "Operators Needed"}
                        {surfaceName ? ` in ${surfaceName}` : " Here"}
                    </h3>
                    <p className="text-xs text-white/40 mb-3">
                        This area has active demand for escort services. Claim your territory and start receiving load alerts.
                    </p>
                    <a
                        href="/start"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-black bg-emerald-500 hover:bg-emerald-600 transition-all hover:-translate-y-0.5"
                        style={{ boxShadow: "0 0 20px rgba(16,185,129,0.2)" }}
                    >
                        <MapPin className="w-3 h-3" /> Join This Area
                    </a>
                </div>
            </div>
        </motion.div>
    );
}
