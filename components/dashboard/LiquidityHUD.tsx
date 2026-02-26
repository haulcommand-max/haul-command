"use client";

import React from "react";
import { Activity, Zap, Shield, TrendingUp, TrendingDown } from "lucide-react";

interface LiquidityHUDProps {
    metrics: {
        driver_count: number;
        load_count: number;
        liquidity_ratio: number;
    };
    isLoading?: boolean;
}

export default function LiquidityHUD({ metrics, isLoading }: LiquidityHUDProps) {
    const { driver_count, load_count, liquidity_ratio } = metrics;

    // Determine Market Status
    let status = "BALANCED";
    let statusColor = "text-green-400";
    let statusBg = "bg-green-500/10 border-green-500/20";

    if (liquidity_ratio > 2.0) {
        status = "OVERSUPPLY";
        statusColor = "text-blue-400";
        statusBg = "bg-blue-500/10 border-blue-500/20";
    } else if (liquidity_ratio < 0.5 && load_count > 0) {
        status = "SURGE";
        statusColor = "text-red-400";
        statusBg = "bg-red-500/10 border-red-500/20";
    } else if (load_count === 0 && driver_count === 0) {
        status = "QUIET";
        statusColor = "text-slate-400";
        statusBg = "bg-slate-500/10 border-slate-500/20";
    }

    return (
        <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
            {/* Primary Status Card */}
            <div className={`backdrop-blur-md bg-slate-900/90 border ${statusBg} rounded-xl p-4 shadow-2xl min-w-[280px]`}>
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-mono mb-1">Market Pulse</div>
                        <div className={`text-xl font-bold flex items-center gap-2 ${statusColor}`}>
                            <Activity size={18} />
                            {status}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] uppercase tracking-widest text-slate-400 font-mono mb-1">Liq. Ratio</div>
                        <div className="text-2xl font-mono font-bold text-white tracking-tighter">
                            {liquidity_ratio.toFixed(2)}<span className="text-sm text-slate-500 ml-0.5">x</span>
                        </div>
                    </div>
                </div>

                {/* Counts */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-700/50">
                    <div className="bg-slate-800/50 rounded p-2 flex items-center justify-between">
                        <span className="text-xs text-slate-400 flex items-center gap-1.5"><Shield size={12} /> Escorts</span>
                        <span className="font-mono font-bold text-blue-400">{driver_count}</span>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2 flex items-center justify-between">
                        <span className="text-xs text-slate-400 flex items-center gap-1.5"><Zap size={12} /> Loads</span>
                        <span className="font-mono font-bold text-orange-400">{load_count}</span>
                    </div>
                </div>
            </div>

            {/* Ticker (Placeholder for Step 2) */}
            <div className="backdrop-blur-md bg-slate-900/80 border border-slate-700/50 rounded-lg p-2 px-3 flex items-center gap-2 shadow-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] text-slate-300 font-mono uppercase tracking-wide">
                    Live: FL &rarr; TX Corridor Active
                </span>
            </div>
        </div>
    );
}
