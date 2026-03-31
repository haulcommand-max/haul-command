"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import {
    Lock, CheckCircle2, Camera, MapPin, Calendar,
    ChevronDown, Shield, FileCheck2, ExternalLink,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
// VerifiedJobLedger — Append-only immutable job record display
// Spec: HC_DOMINATION_PATCH_V1 Phase 3 — Verified Job Ledger
// Public summary visible • Detailed view gated
// Feeds into: trust score, ranking engine, anti-gaming
// ══════════════════════════════════════════════════════════════

interface LedgerEntry {
    jobId: string;
    date: string;
    corridorLabel?: string;
    originCity?: string;
    destCity?: string;
    brokerVerified: boolean;
    escortVerified: boolean;
    evidenceCount: number;
    equipmentType?: string;
    lockedAt: string;
}

interface VerifiedJobLedgerProps {
    entries: LedgerEntry[];
    operatorName?: string;
    /** How many entries to show initially */
    previewCount?: number;
    /** If true, hide detailed info (gated) */
    gated?: boolean;
    className?: string;
}

export function VerifiedJobLedger({
    entries, operatorName, previewCount = 5, gated = false, className,
}: VerifiedJobLedgerProps) {
    const [expanded, setExpanded] = useState(false);
    const visible = expanded ? entries : entries.slice(0, previewCount);
    const hasMore = entries.length > previewCount;

    return (
        <div className={cn("rounded-2xl border border-white/[0.06] bg-[#0d1117] overflow-hidden", className)}>
            {/* Header */}
            <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <FileCheck2 className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white">Verified Job Ledger</div>
                        <div className="text-[10px] text-white/40">
                            {entries.length} confirmed jobs • Append-only record
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg">
                    <Lock className="w-3 h-3" />
                    Immutable
                </div>
            </div>

            {/* Summary stats strip */}
            <div className="px-5 pb-3 grid grid-cols-3 gap-2">
                <SummaryStat
                    label="Total Verified"
                    value={entries.length}
                    color="#6366f1"
                />
                <SummaryStat
                    label="With Evidence"
                    value={entries.filter(e => e.evidenceCount > 0).length}
                    color="#8b5cf6"
                />
                <SummaryStat
                    label="Dual Confirmed"
                    value={entries.filter(e => e.brokerVerified && e.escortVerified).length}
                    color="#10b981"
                />
            </div>

            {/* Entries list */}
            <div className="px-5 pb-2">
                {visible.map((entry, i) => (
                    <motion.div
                        key={entry.jobId}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn(
                            "flex items-center gap-3 py-2.5 border-t border-white/[0.04] first:border-0",
                        )}
                    >
                        {/* Lock icon */}
                        <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                            <Lock className="w-3 h-3 text-indigo-400" />
                        </div>

                        {/* Job info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white/80 truncate">
                                    {gated
                                        ? `Job #${entry.jobId.slice(-6)}`
                                        : entry.corridorLabel || `${entry.originCity} → ${entry.destCity}`
                                    }
                                </span>
                                {entry.equipmentType && !gated && (
                                    <span className="text-[8px] font-bold text-white/30 bg-white/5 px-1 py-0.5 rounded truncate max-w-[80px]">
                                        {entry.equipmentType}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-white/30">
                                    <Calendar className="w-2.5 h-2.5 inline mr-0.5" />
                                    {new Date(entry.date).toLocaleDateString()}
                                </span>
                                {entry.evidenceCount > 0 && (
                                    <span className="text-[10px] text-violet-400/60">
                                        <Camera className="w-2.5 h-2.5 inline mr-0.5" />
                                        {entry.evidenceCount}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Dual confirmation badges */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <ConfirmBadge role="B" confirmed={entry.brokerVerified} />
                            <ConfirmBadge role="E" confirmed={entry.escortVerified} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Show more / gated */}
            {hasMore && !expanded && (
                <div className="px-5 pb-4">
                    <button aria-label="Interactive Button"
                        onClick={() => setExpanded(true)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white/40 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all"
                    >
                        <ChevronDown className="w-3.5 h-3.5" />
                        Show {entries.length - previewCount} more entries
                    </button>
                </div>
            )}

            {/* Immutability footer */}
            <div className="px-5 py-2.5 bg-white/[0.02] border-t border-white/[0.04] flex items-center gap-2">
                <Shield className="w-3 h-3 text-white/20" />
                <span className="text-[9px] text-white/20">
                    Each entry is dual-confirmed and append-only. Records cannot be altered or deleted.
                </span>
            </div>
        </div>
    );
}

// ── Sub-components ──

function SummaryStat({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="text-center p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="text-lg font-black" style={{ color }}>{value}</div>
            <div className="text-[8px] font-bold text-white/30 uppercase tracking-wider">{label}</div>
        </div>
    );
}

function ConfirmBadge({ role, confirmed }: { role: string; confirmed: boolean }) {
    return (
        <div className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-extrabold",
            confirmed
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-white/5 text-white/20"
        )}>
            {confirmed ? <CheckCircle2 className="w-3 h-3" /> : role}
        </div>
    );
}
