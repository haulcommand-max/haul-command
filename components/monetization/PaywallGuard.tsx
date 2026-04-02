"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { AlertCircle, Lock, Zap } from "lucide-react";
import Link from "next/link";
import { PRICING } from "@/lib/config/pricing";

/**
 * ══════════════════════════════════════════════════════════════
 * Paywall Guard
 * ══════════════════════════════════════════════════════════════
 * Enforces conversion gates dynamically based on usage telemetry 
 * and evaluated output from monetization-engine.ts.
 */
export function PaywallGuard({ children }: { children: React.ReactNode }) {
    const { paywall, isLoading } = useAuth();

    if (isLoading) {
        return <>{children}</>;
    }

    // If no paywall decision requires blocking, render children
    // (medium/hard urgency levels require the gate!)
    if (!paywall?.show || paywall.urgencyLevel === "soft") {
        return (
            <>
                {/* Soft paywalls can render as an inline banner instead of blocking everything */}
                {paywall?.show && paywall.urgencyLevel === "soft" && (
                    <div className="bg-hc-gold-500/10 border-b border-hc-gold-500/20 px-4 py-2 sticky top-0 z-50">
                        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-hc-gold-500" />
                                <span className="text-xs font-semibold text-hc-gold-500">
                                    {paywall.reason === "engaged_free_user" 
                                        ? "You've been active for 7 days! Upgrade and boost your load volume." 
                                        : "You are approaching your plan limits. "}
                                </span>
                            </div>
                            <Link href="/pricing" className="text-xs font-black uppercase text-hc-bg bg-hc-gold-500 px-3 py-1 rounded hover:bg-hc-gold-600 transition-colors">
                                View Plans →
                            </Link>
                        </div>
                    </div>
                )}
                {children}
            </>
        );
    }

    // HARD OR MEDIUM PAYWALL OVERLAY
    return (
        <div className="relative w-full h-full min-h-[50vh] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-hc-bg/95 backdrop-blur-[20px] z-40 border border-hc-border" />
            
            <div className="relative z-50 max-w-md w-full bg-[#0b0b0c] border border-hc-gold-500/30 rounded-2xl p-8 text-center shadow-dispatch">
                <div className="w-16 h-16 bg-hc-gold-500/10 border border-hc-gold-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-8 h-8 text-hc-gold-500" />
                </div>
                
                <h3 className="text-2xl font-black text-hc-text mb-3 uppercase tracking-tight">
                    Limit Reached
                </h3>
                
                <p className="text-hc-muted text-sm leading-relaxed mb-8">
                    {paywall.reason === "search_limit_reached" && "You've reached your free daily search limit."}
                    {paywall.reason === "lead_limit_reached" && "You've reached your free monthly lead limit."}
                    {" "}Unlock {paywall.suggestedTier} to remove restrictions and gain full access to the Haul Command OS.
                </p>
                
                <div className="flex flex-col gap-3">
                    <Link
                        href="/pricing"
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-hc-gold-500 hover:bg-hc-gold-600 text-hc-bg font-black text-sm uppercase tracking-widest rounded-xl transition-colors shadow-[0_0_20px_rgba(198,146,58,0.3)]"
                    >
                        <Zap className="w-4 h-4" />
                        Upgrade to {paywall.suggestedTier}
                    </Link>
                    
                    <button className="text-xs text-hc-muted font-medium py-2 hover:text-white transition-colors">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PaywallGuard;
