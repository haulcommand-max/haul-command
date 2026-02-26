"use client";

import React, { useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    AreaChart, Area, CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";
import { Activity, TrendingUp, TrendingDown, Zap, Users, Truck } from "lucide-react";
import { fetchMarketPulse, fetchLiquidityMetrics, type MarketPulse, type LiquidityCorridorData, type LiquidityTimeSeries } from "@/lib/actions/market-pulse";

// ===== ANIMATION VARIANTS =====
const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    }),
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

// ===== TYPES =====
interface LiquidityMetric {
    label: string;
    value: number;
    change: number;       // +/- percentage
    unit: string;
    icon: any;
    color: string;
}

interface SupplyDemandBar {
    corridor: string;
    supply: number;
    demand: number;
}

interface TimeSeriesPoint {
    hour: string;
    escorts_online: number;
    loads_open: number;
}

// ===== DEFAULT DATA (fallback if Supabase unreachable) =====
const DEFAULT_METRICS: LiquidityMetric[] = [
    { label: "Escorts Online", value: 47, change: 12, unit: "", icon: Users, color: "#22c55e" },
    { label: "Open Loads", value: 23, change: -3, unit: "", icon: Truck, color: "#F1A91B" },
    { label: "Fill Rate (60m)", value: 68, change: 5, unit: "%", icon: TrendingUp, color: "#3b82f6" },
    { label: "Avg Response", value: 2.4, change: -18, unit: "min", icon: Zap, color: "#a855f7" },
];

const DEFAULT_CORRIDORS: SupplyDemandBar[] = [
    { corridor: "I-95 SE", supply: 12, demand: 8 },
    { corridor: "I-10 Gulf", supply: 6, demand: 11 },
    { corridor: "I-75 FL", supply: 9, demand: 7 },
    { corridor: "I-40 Cross", supply: 4, demand: 9 },
    { corridor: "I-81 NE", supply: 7, demand: 5 },
    { corridor: "TX Triangle", supply: 8, demand: 14 },
];

const DEFAULT_TIMESERIES: TimeSeriesPoint[] = [
    { hour: "6am", escorts_online: 12, loads_open: 8 },
    { hour: "8am", escorts_online: 28, loads_open: 15 },
    { hour: "10am", escorts_online: 42, loads_open: 22 },
    { hour: "12pm", escorts_online: 47, loads_open: 23 },
    { hour: "2pm", escorts_online: 44, loads_open: 19 },
    { hour: "4pm", escorts_online: 38, loads_open: 16 },
    { hour: "6pm", escorts_online: 25, loads_open: 11 },
    { hour: "8pm", escorts_online: 15, loads_open: 6 },
];

// ===== CUSTOM TOOLTIP =====
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload) return null;
    return (
        <div className="bg-[#111] border border-[#222] rounded-xl px-4 py-3 shadow-2xl">
            <p className="text-[10px] text-[#666] uppercase tracking-[0.2em] font-bold mb-2">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
                    {p.name}: {p.value}
                </p>
            ))}
        </div>
    );
}

// ===== METRIC CARD =====
function MetricCard({ metric, index }: { metric: LiquidityMetric; index: number }) {
    const Icon = metric.icon;
    const isPositive = metric.change >= 0;

    return (
        <motion.div
            custom={index}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 hover:border-[#222] transition-colors duration-300"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${metric.color}10` }}>
                    <Icon className="w-4 h-4" style={{ color: metric.color }} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${isPositive ? "text-emerald-500" : "text-red-400"}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isPositive ? "+" : ""}{metric.change}%
                </div>
            </div>
            <div className="text-3xl font-black text-white tracking-tight">
                {metric.value}{metric.unit}
            </div>
            <div className="text-[10px] text-[#555] uppercase tracking-[0.2em] font-semibold mt-1">
                {metric.label}
            </div>
        </motion.div>
    );
}

// ===== MAIN COMPONENT =====
export function LiquidityDashboard() {
    const [metrics, setMetrics] = useState<LiquidityMetric[]>(DEFAULT_METRICS);
    const [corridorData, setCorridorData] = useState<SupplyDemandBar[]>(DEFAULT_CORRIDORS);
    const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>(DEFAULT_TIMESERIES);

    useEffect(() => {
        // Fetch live data and override defaults
        Promise.all([fetchMarketPulse(), fetchLiquidityMetrics()]).then(([pulse, liquid]) => {
            if (pulse && pulse.escorts_online_now > 0) {
                setMetrics([
                    { label: "Escorts Online", value: pulse.escorts_online_now, change: 12, unit: "", icon: Users, color: "#22c55e" },
                    { label: "Open Loads", value: pulse.open_loads_now, change: -3, unit: "", icon: Truck, color: "#F1A91B" },
                    { label: "Fill Rate", value: Math.round(pulse.fill_rate_7d ?? 0), change: 5, unit: "%", icon: TrendingUp, color: "#3b82f6" },
                    { label: "Median Fill", value: Math.round(pulse.median_fill_time_min_7d ?? 0), change: -18, unit: "min", icon: Zap, color: "#a855f7" },
                ]);
            }
            if (liquid.corridors.length > 0) setCorridorData(liquid.corridors);
            if (liquid.timeSeries.length > 0) setTimeSeriesData(liquid.timeSeries);
        });
    }, []);
    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-[#F1A91B]" />
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">Market Liquidity</h2>
                </div>
                <div className="flex items-center gap-2 bg-[#F1A91B]/8 border border-[#F1A91B]/15 px-3 py-1.5 rounded-full">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F1A91B] opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#F1A91B]" />
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#F1A91B] tracking-[0.2em]">Live</span>
                </div>
            </motion.div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {metrics.map((m, i) => (
                    <MetricCard key={m.label} metric={m} index={i} />
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Supply vs Demand by Corridor */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={scaleIn}
                    className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Corridor Balance</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[10px] text-[#555] font-semibold uppercase tracking-wider">Supply</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#F1A91B]" />
                                <span className="text-[10px] text-[#555] font-semibold uppercase tracking-wider">Demand</span>
                            </div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={corridorData} barGap={2} barSize={12}>
                            <XAxis
                                dataKey="corridor"
                                tick={{ fill: "#555", fontSize: 10, fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis hide />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="supply" name="Supply" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="demand" name="Demand" fill="#F1A91B" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Time Series: Online Escorts vs Open Loads */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={scaleIn}
                    className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Today&apos;s Pulse</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[10px] text-[#555] font-semibold uppercase tracking-wider">Escorts</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#F1A91B]" />
                                <span className="text-[10px] text-[#555] font-semibold uppercase tracking-wider">Loads</span>
                            </div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={timeSeriesData}>
                            <defs>
                                <linearGradient id="escortGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#F1A91B" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#F1A91B" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#1a1a1a" strokeDasharray="3 3" />
                            <XAxis
                                dataKey="hour"
                                tick={{ fill: "#555", fontSize: 10, fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis hide />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="escorts_online"
                                name="Escorts"
                                stroke="#22c55e"
                                strokeWidth={2}
                                fill="url(#escortGrad)"
                            />
                            <Area
                                type="monotone"
                                dataKey="loads_open"
                                name="Loads"
                                stroke="#F1A91B"
                                strokeWidth={2}
                                fill="url(#loadGrad)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>
        </div>
    );
}
