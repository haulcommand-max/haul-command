"use client";

import React from "react";
import { LiquidityDashboard } from "@/components/dashboard/LiquidityDashboard";
import { TodayCommandCenter } from "@/components/intelligence/TodayCommandCenter";
import { motion } from "framer-motion";
import { Activity, Shield, Zap } from "lucide-react";

export default function CommandDashboardPage() {
    return (
        <div className="min-h-screen bg-[#000] text-[#C0C0C0] font-[family-name:var(--font-space-grotesk)]">
            {/* Grid Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(241,169,27,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(241,169,27,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#000]/90 backdrop-blur-xl border-b border-[#1a1a1a]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#F1A91B] rounded-xl flex items-center justify-center font-black text-black text-sm shadow-[0_0_20px_rgba(241,169,27,0.3)]">
                            HC
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white uppercase tracking-[0.15em]">Command Tower</h1>
                            <div className="text-[10px] text-[#444] uppercase tracking-[0.2em] font-semibold">Live Operations · All Corridors</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/15 px-3 py-1.5 rounded-full">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                            </span>
                            <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-[0.2em]">System Online</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content — 2-col on desktop */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Today Command Center — right rail on desktop, top on mobile */}
                    <div className="lg:col-span-1 lg:order-2">
                        <TodayCommandCenter
                            data={null} /* null = skeleton; wire a useCommandData() hook here */
                        />
                    </div>

                    {/* Liquidity Dashboard — main area */}
                    <div className="lg:col-span-2 lg:order-1">
                        <LiquidityDashboard />
                    </div>
                </div>
            </main>
        </div>
    );
}

