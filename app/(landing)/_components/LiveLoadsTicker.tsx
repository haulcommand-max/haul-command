"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, ArrowRight, ChevronRight, Clock } from "lucide-react";

/* =•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•
   LIVE LOADS TICKER — Stock-market"“style scrolling load feed
   Creates constant-activity feel. Falls back to demo data
   when live data is sparse.
   =•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=•=• */

interface TickerLoad {
    id: string;
    origin: string;
    destination: string;
    type: string;
    rate: string;
    urgency?: "hot" | "normal";
    timeAgo?: string;
}

const DEMO_LOADS: TickerLoad[] = [
    { id: "t1", origin: "Houston, TX", destination: "Beaumont, TX", type: "Wind Blade Escort", rate: "$420/day", urgency: "hot", timeAgo: "2m ago" },
    { id: "t2", origin: "Oklahoma City, OK", destination: "Wichita, KS", type: "Turbine Transport", rate: "$380/day", urgency: "normal", timeAgo: "5m ago" },
    { id: "t3", origin: "Jacksonville, FL", destination: "Savannah, GA", type: "Transformer Move", rate: "$350/day", urgency: "normal", timeAgo: "8m ago" },
    { id: "t4", origin: "Bakersfield, CA", destination: "Las Vegas, NV", type: "Solar Equipment", rate: "$310/day", urgency: "normal", timeAgo: "12m ago" },
    { id: "t5", origin: "Port Arthur, TX", destination: "Lake Charles, LA", type: "Refinery Module", rate: "$450/day", urgency: "hot", timeAgo: "15m ago" },
    { id: "t6", origin: "Charlotte, NC", destination: "Raleigh, NC", type: "Oversize Load", rate: "$340/day", urgency: "normal", timeAgo: "18m ago" },
    { id: "t7", origin: "Tulsa, OK", destination: "Amarillo, TX", type: "Wind Tower Section", rate: "$400/day", urgency: "hot", timeAgo: "22m ago" },
    { id: "t8", origin: "Mobile, AL", destination: "Gulfport, MS", type: "Heavy Equipment", rate: "$320/day", urgency: "normal", timeAgo: "25m ago" },
];

function cityAbbr(city: string): string {
    // Extract state abbreviation for compact display
    const parts = city.split(", ");
    return parts.length > 1 ? parts[1] : parts[0];
}

export function LiveLoadsTicker() {
    const [visibleIdx, setVisibleIdx] = useState(0);
    const loads = DEMO_LOADS; // Will connect to live API later

    // Rotate visible loads
    useEffect(() => {
        const timer = setInterval(() => {
            setVisibleIdx(prev => (prev + 1) % loads.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [loads.length]);

    // Show 4 loads at a time on desktop, 2 on mobile
    const getVisibleLoads = () => {
        const result: TickerLoad[] = [];
        for (let i = 0; i < 4; i++) {
            result.push(loads[(visibleIdx + i) % loads.length]);
        }
        return result;
    };

    const visible = getVisibleLoads();

    return (
        <section className="relative z-10 py-6 sm:py-8">
            <div className="hc-container">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                        <h3 className="text-[11px] font-bold text-emerald-400 uppercase tracking-[0.2em]">
                            Live Load Activity
                        </h3>
                    </div>
                    <Link aria-label="Navigation Link" href="/loads" className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.15em] hover:text-[#E0B05C] transition-colors inline-flex items-center gap-1">
                        View All <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>

                {/* Ticker Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {visible.map((load, i) => (
                        <Link aria-label="Navigation Link"
                            key={`${load.id}-${visibleIdx}`}
                            href="/loads"
                            className="group block"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.05 }}
                                className={`relative rounded-xl border px-3 py-3 transition-all cursor-pointer
                                    ${load.urgency === "hot"
                                        ? "border-red-500/20 bg-red-500/[0.04] hover:bg-red-500/[0.08]"
                                        : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    {/* Route */}
                                    <div className="flex items-center gap-1 min-w-0 flex-1">
                                        <span className="text-xs font-bold text-white truncate">{cityAbbr(load.origin)}</span>
                                        <ArrowRight className="w-3 h-3 text-[#5A6577] flex-shrink-0" />
                                        <span className="text-xs font-bold text-white truncate">{cityAbbr(load.destination)}</span>
                                    </div>
                                    {/* Rate */}
                                    <span className="text-xs font-black text-emerald-400 font-mono flex-shrink-0">
                                        {load.rate}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-[#8fa3b8] truncate">{load.type}</span>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {load.urgency === "hot" && (
                                            <span className="text-[8px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded uppercase">Hot</span>
                                        )}
                                        <span className="text-[9px] text-[#5A6577]">{load.timeAgo}</span>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}