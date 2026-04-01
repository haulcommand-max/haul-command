"use client";

import React from "react";
import { ShieldAlert, Zap, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

// ══════════════════════════════════════════════════════════════
// ProfileClaimSidebar — Section 7 Engine
// Prominent sticky CTA to drive unclaimed profiles to verify.
// ══════════════════════════════════════════════════════════════

interface ProfileClaimSidebarProps {
    profileId: string;
    isClaimed: boolean;
    claimHash?: string;
    className?: string;
}

export function ProfileClaimSidebar({ profileId, isClaimed, claimHash, className }: ProfileClaimSidebarProps) {
    if (isClaimed) {
        // If claimed, maybe show an upsell to 'Elite' or just be invisible.
        // For now, if claimed, we'll return a smaller verified badge card for morale.
        return (
            <div className={cn("bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-2xl flex flex-col items-center text-center", className)}>
                <ShieldCheck className="w-8 h-8 text-emerald-500 mb-3" />
                <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.15em] mb-1">Ownership Verified</h3>
                <p className="text-[10px] text-[#555]">This operator manages their own Haul Command presence.</p>
            </div>
        );
    }

    const claimUrl = claimHash ? `/claim/${claimHash}` : `/claim/${profileId}`;

    return (
        <div className={cn("bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#2a2a2a] p-6 rounded-2xl relative overflow-hidden group", className)}>
            {/* Background effects */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#F1A91B]/10 rounded-full blur-3xl transition-opacity group-hover:opacity-100 opacity-50"></div>

            <div className="flex items-center gap-2 mb-4 relative z-10">
                <ShieldAlert className="w-5 h-5 text-[#F1A91B]" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Unverified Listing</h3>
            </div>

            <p className="text-xs text-[#888] leading-relaxed mb-6 relative z-10">
                This public directory profile has not been claimed. Claim it now to unlock load matching, manage your capability matrix, and build broker trust.
            </p>

            <ul className="space-y-3 mb-6 relative z-10">
                <li className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#aaa]">
                    <Zap className="w-3 h-3 text-[#F1A91B]" />
                    Control Your Corridors
                </li>
                <li className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#aaa]">
                    <Zap className="w-3 h-3 text-[#F1A91B]" />
                    Receive Direct Requests
                </li>
                <li className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#aaa]">
                    <Zap className="w-3 h-3 text-[#F1A91B]" />
                    Build Trust Score
                </li>
            </ul>

            <Link
                href={claimUrl}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-[#F1A91B] hover:bg-[#f0b93a] text-black font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 relative z-10"
            >
                <span>Get Verified Status</span>
                <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
    );
}
