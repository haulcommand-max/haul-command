"use client";

import React from "react";
import { PhoneCall, Heart, GitCompare, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ══════════════════════════════════════════════════════════════
// BrokerActionBar — Profile Section 7
// Sticky bottom bar providing immediate conversion actions.
// ══════════════════════════════════════════════════════════════

interface BrokerActionBarProps {
    className?: string;
    onSave?: () => void;
    onCompare?: () => void;
    onAlternates?: () => void;
}

export function BrokerActionBar({ className, onSave, onCompare, onAlternates }: BrokerActionBarProps) {
    return (
        <div className={cn(
            "fixed bottom-0 left-0 right-0 z-50 p-4 border-t border-[#1a1a1a]",
            // Heavy blur background to pop over page contents
            "bg-[#000]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#000]/60",
            className
        )}>
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Secondary Actions */}
                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                    <button
                        onClick={onSave}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] hover:border-[#333] rounded-xl text-xs font-bold text-[#aaa] uppercase tracking-widest transition-colors"
                    >
                        <Heart className="w-3.5 h-3.5" /> Save
                    </button>
                    <button
                        onClick={onCompare}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] hover:border-[#333] rounded-xl text-xs font-bold text-[#aaa] uppercase tracking-widest transition-colors"
                    >
                        <GitCompare className="w-3.5 h-3.5" /> Compare
                    </button>
                    <button
                        onClick={onAlternates}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] hover:border-[#333] rounded-xl text-xs font-bold text-[#aaa] uppercase tracking-widest transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" /> Alternates
                    </button>
                </div>

                {/* Primary Action */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button className="flex-1 md:flex-none h-12 flex items-center justify-center gap-2 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] hover:border-[#333] text-white font-bold uppercase tracking-widest text-xs px-6 rounded-xl transition-all">
                        <PhoneCall className="w-4 h-4 text-[#F1A91B]" />
                        Call
                    </button>
                    <button className="flex-1 md:flex-none h-12 px-8 bg-[#F1A91B] hover:bg-[#f0b93a] text-black font-black uppercase tracking-widest text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(241,169,27,0.15)] hover:shadow-[0_0_30px_rgba(241,169,27,0.3)]">
                        Request Escort
                    </button>
                </div>
            </div>
        </div>
    );
}
