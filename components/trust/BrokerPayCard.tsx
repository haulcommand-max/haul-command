"use client";

import React from "react";
import { DollarSign, Clock, AlertTriangle, TrendingUp, Users, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ══════════════════════════════════════════════════════════════
// BrokerPayCard — Haul Command Trust Layer
// Displays a broker's pay score and reputation metrics.
// Data source: v_broker_review_scores JOIN v_broker_report_card
//
// COMPETITIVE DIFFERENTIATOR: No other platform shows escort-
// reviewed broker pay behavior. This is the moat.
// ══════════════════════════════════════════════════════════════

export interface BrokerPayData {
    broker_id: string;
    company_name?: string;
    broker_pay_score?: number;        // 0–100 weighted composite
    avg_paid_on_time?: number;        // 1–5 star avg
    avg_days_to_pay?: number;         // from broker_pay_events
    would_work_again_pct?: number;    // 0–100 %
    review_count?: number;
    verified_count?: number;
    slow_pay_warning?: boolean;       // avg_days_to_pay > 21
    // Trust tier from v_broker_report_card
    broker_tier?: "Platinum Broker" | "Gold Broker" | "Verified Broker" | "Standard Broker" | "Watch List" | string;
    // Load volume
    total_loads?: number;
    on_time_payment_rate?: number;    // 0–100 %
}

type TierConfig = {
    label: string;
    className: string;
};

const TIER_CONFIG: Record<string, TierConfig> = {
    "Platinum Broker": {
        label: "Platinum",
        className: "text-hc-gold-400 border-hc-gold-400/40 bg-hc-gold-400/10",
    },
    "Gold Broker": {
        label: "Gold",
        className: "text-hc-gold-500 border-hc-gold-500/30 bg-hc-gold-500/8",
    },
    "Verified Broker": {
        label: "Verified",
        className: "text-[#38BDF8] border-[#38BDF8]/30 bg-[#38BDF8]/8",
    },
    "Standard Broker": {
        label: "Standard",
        className: "text-hc-muted border-hc-border bg-hc-elevated",
    },
    "Watch List": {
        label: "Watch List",
        className: "text-hc-danger border-hc-danger/30 bg-hc-danger/8",
    },
};

function PayScoreRing({ score }: { score: number }) {
    const color = score >= 80 ? "#22C55E" : score >= 60 ? "#D6A756" : "#EF4444";
    return (
        <div className="flex flex-col items-center gap-1">
            <div
                className="w-16 h-16 rounded-full border-4 flex items-center justify-center"
                style={{ borderColor: color }}
            >
                <span className="text-xl font-black text-hc-text tabular-nums">{Math.round(score)}</span>
            </div>
            <span className="text-[9px] font-bold text-hc-muted uppercase tracking-widest">Pay Score</span>
        </div>
    );
}

interface BrokerPayCardProps {
    data: BrokerPayData;
    compact?: boolean;
    className?: string;
}

export function BrokerPayCard({ data, compact = false, className }: BrokerPayCardProps) {
    const payScore = data.broker_pay_score ?? 0;
    const tier = data.broker_tier ?? "Standard Broker";
    const tierCfg = TIER_CONFIG[tier] ?? TIER_CONFIG["Standard Broker"];
    const wouldWork = data.would_work_again_pct ?? null;
    const avgDays = data.avg_days_to_pay;

    if (compact) {
        // Compact mode: single chip for load board cards
        return (
            <div className={cn(
                "inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border",
                payScore >= 80
                    ? "bg-hc-success/8 border-hc-success/20"
                    : payScore >= 60
                        ? "bg-hc-gold-500/8 border-hc-gold-500/20"
                        : "bg-hc-danger/8 border-hc-danger/20",
                className
            )}>
                <DollarSign className={cn(
                    "w-3 h-3",
                    payScore >= 80 ? "text-hc-success" : payScore >= 60 ? "text-hc-gold-500" : "text-hc-danger"
                )} />
                <span className={cn(
                    "text-[11px] font-black tabular-nums",
                    payScore >= 80 ? "text-hc-success" : payScore >= 60 ? "text-hc-gold-500" : "text-hc-danger"
                )}>
                    Pay {Math.round(payScore)}
                </span>
                {data.slow_pay_warning && (
                    <AlertTriangle className="w-3 h-3 text-hc-warning ml-0.5" />
                )}
                {/* Tier chip */}
                <span className={cn(
                    "px-1.5 py-0 rounded text-[9px] font-black uppercase tracking-widest border",
                    tierCfg.className
                )}>
                    {tierCfg.label}
                </span>
            </div>
        );
    }

    // Full card mode: broker profile top section
    return (
        <div className={cn("hc-card overflow-hidden", className)}>
            {/* Header band */}
            <div className="px-5 pt-5 pb-4 border-b border-hc-border-bare">
                <div className="flex items-start gap-4">
                    <PayScoreRing score={payScore} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-black text-hc-text uppercase tracking-tight">
                                Broker Pay Score
                            </h3>
                            <span className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                tierCfg.className
                            )}>
                                {tierCfg.label}
                            </span>
                        </div>
                        {data.review_count !== undefined && (
                            <p className="text-[10px] text-hc-subtle mt-1">
                                Based on {data.review_count} escort review{data.review_count !== 1 ? "s" : ""}
                                {data.verified_count ? ` · ${data.verified_count} verified` : ""}
                            </p>
                        )}
                        {/* Risk flags */}
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {data.slow_pay_warning && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-hc-warning/10 border border-hc-warning/25 text-[9px] font-black text-hc-warning uppercase tracking-widest">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    Slow Pay Alert
                                </span>
                            )}
                            {payScore < 60 && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-hc-danger/10 border border-hc-danger/25 text-[9px] font-black text-hc-danger uppercase tracking-widest">
                                    Payment Risk
                                </span>
                            )}
                            {payScore >= 85 && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-hc-success/10 border border-hc-success/25 text-[9px] font-black text-hc-success uppercase tracking-widest">
                                    <Star className="w-2.5 h-2.5" />
                                    Preferred Payer
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 divide-x divide-y divide-hc-border-bare">
                {/* Avg days to pay */}
                <div className="px-4 py-3 flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-hc-subtle" />
                        <span className="text-[9px] font-bold text-hc-muted uppercase tracking-widest">Avg Days to Pay</span>
                    </div>
                    <span className={cn(
                        "text-xl font-black tabular-nums",
                        avgDays == null ? "text-hc-muted" :
                            avgDays <= 14 ? "text-hc-success" :
                                avgDays <= 21 ? "text-hc-gold-500" : "text-hc-danger"
                    )}>
                        {avgDays != null ? `${Math.round(avgDays)}d` : "—"}
                    </span>
                    <span className="text-[9px] text-hc-subtle">
                        {avgDays == null ? "No data" : avgDays <= 14 ? "Fast payer" : avgDays <= 21 ? "Within terms" : "> 21 day threshold"}
                    </span>
                </div>

                {/* On time payment rate */}
                <div className="px-4 py-3 flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3 h-3 text-hc-subtle" />
                        <span className="text-[9px] font-bold text-hc-muted uppercase tracking-widest">Paid On Time</span>
                    </div>
                    <span className={cn(
                        "text-xl font-black tabular-nums",
                        data.on_time_payment_rate == null ? "text-hc-muted" :
                            data.on_time_payment_rate >= 90 ? "text-hc-success" :
                                data.on_time_payment_rate >= 70 ? "text-hc-gold-500" : "text-hc-danger"
                    )}>
                        {data.on_time_payment_rate != null ? `${Math.round(data.on_time_payment_rate)}%` : "—"}
                    </span>
                    <span className="text-[9px] text-hc-subtle">of invoices</span>
                </div>

                {/* Would work again */}
                <div className="px-4 py-3 flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-hc-subtle" />
                        <span className="text-[9px] font-bold text-hc-muted uppercase tracking-widest">Would Work Again</span>
                    </div>
                    <span className={cn(
                        "text-xl font-black tabular-nums",
                        wouldWork == null ? "text-hc-muted" :
                            wouldWork >= 80 ? "text-hc-success" :
                                wouldWork >= 60 ? "text-hc-gold-500" : "text-hc-danger"
                    )}>
                        {wouldWork != null ? `${Math.round(wouldWork)}%` : "—"}
                    </span>
                    <span className="text-[9px] text-hc-subtle">of escorts</span>
                </div>

                {/* Total loads */}
                <div className="px-4 py-3 flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-hc-subtle" />
                        <span className="text-[9px] font-bold text-hc-muted uppercase tracking-widest">Total Loads</span>
                    </div>
                    <span className="text-xl font-black text-hc-text tabular-nums">
                        {data.total_loads != null ? data.total_loads.toLocaleString() : "—"}
                    </span>
                    <span className="text-[9px] text-hc-subtle">posted on HC</span>
                </div>
            </div>

            {/* Footer note */}
            <div className="px-5 py-3 bg-hc-elevated/50 border-t border-hc-border-bare">
                <p className="text-[10px] text-hc-subtle text-center leading-relaxed">
                    Scores sourced from verified escort reviews + payment event data.
                    Individual reviewers are anonymous.
                </p>
            </div>
        </div>
    );
}

export default BrokerPayCard;
