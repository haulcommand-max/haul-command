"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import {
    CheckCircle2, Clock, AlertTriangle, Lock, User, Truck,
    ChevronRight, Camera, FileText, MapPin, ShieldCheck,
} from "lucide-react";
import type { JobConfirmationState } from "@/lib/trust/dual-confirmation";

// ══════════════════════════════════════════════════════════════
// DualConfirmationPanel — Job close UI with state visualization
// Spec: HC_DOMINATION_PATCH_V1 Phase 3
// State machine: posted → assigned → completed_pending →
//   broker_confirmed / escort_confirmed → ledger_locked
// ══════════════════════════════════════════════════════════════

interface DualConfirmationPanelProps {
    jobId: string;
    state: JobConfirmationState;
    brokerName?: string;
    escortName?: string;
    brokerConfirmedAt?: string;
    escortConfirmedAt?: string;
    lockedAt?: string;
    timeoutAt?: string;
    evidenceCount?: number;
    userRole: "broker" | "escort";
    onConfirm?: () => void;
    onDispute?: () => void;
    onUploadEvidence?: () => void;
    className?: string;
}

const STATE_CONFIG: Record<JobConfirmationState, {
    label: string; color: string; icon: React.ElementType; description: string;
}> = {
    job_posted: { label: "Job Posted", color: "#6b7280", icon: Clock, description: "Waiting for escort assignment" },
    escort_assigned: { label: "Escort Assigned", color: "#3b82f6", icon: Truck, description: "Escort en route or active" },
    job_completed_pending: { label: "Awaiting Confirmation", color: "#f59e0b", icon: Clock, description: "Both parties must confirm completion" },
    broker_confirmed: { label: "Broker Confirmed", color: "#10b981", icon: CheckCircle2, description: "Waiting for escort confirmation" },
    escort_confirmed: { label: "Escort Confirmed", color: "#10b981", icon: CheckCircle2, description: "Waiting for broker confirmation" },
    ledger_locked: { label: "Ledger Locked", color: "#6366f1", icon: Lock, description: "Both parties confirmed — immutable record" },
    disputed: { label: "Disputed", color: "#ef4444", icon: AlertTriangle, description: "Under review" },
    timed_out: { label: "Timed Out", color: "#6b7280", icon: Clock, description: "Confirmation window expired" },
};

const STEPS: JobConfirmationState[] = [
    "job_posted", "escort_assigned", "job_completed_pending",
    "broker_confirmed", "ledger_locked",
];

function getStepIndex(state: JobConfirmationState): number {
    if (state === "escort_confirmed") return 3;
    const idx = STEPS.indexOf(state);
    return idx >= 0 ? idx : 0;
}

export function DualConfirmationPanel({
    jobId, state, brokerName, escortName,
    brokerConfirmedAt, escortConfirmedAt, lockedAt, timeoutAt,
    evidenceCount = 0, userRole, onConfirm, onDispute, onUploadEvidence,
    className,
}: DualConfirmationPanelProps) {
    const config = STATE_CONFIG[state];
    const stepIdx = getStepIndex(state);
    const canConfirm = (userRole === "broker" && (state === "job_completed_pending" || state === "escort_confirmed"))
        || (userRole === "escort" && (state === "job_completed_pending" || state === "broker_confirmed"));
    const isLocked = state === "ledger_locked";

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "rounded-2xl border overflow-hidden",
                isLocked
                    ? "border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-transparent"
                    : "border-white/[0.06] bg-[#0d1117]",
                className
            )}
        >
            {/* Header */}
            <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: `${config.color}15` }}>
                        <config.icon className="w-4 h-4" style={{ color: config.color }} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white">{config.label}</div>
                        <div className="text-[10px] text-white/40">{config.description}</div>
                    </div>
                </div>
                {timeoutAt && !isLocked && state !== "timed_out" && (
                    <TimeoutBadge timeoutAt={timeoutAt} />
                )}
            </div>

            {/* Progress steps */}
            <div className="px-5 py-3">
                <div className="flex items-center gap-1">
                    {STEPS.map((step, i) => {
                        const isComplete = i <= stepIdx;
                        const isCurrent = i === stepIdx;
                        return (
                            <React.Fragment key={step}>
                                <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all",
                                    isComplete
                                        ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20"
                                        : "bg-white/5 text-white/20 border border-white/10",
                                    isCurrent && "ring-2 ring-indigo-500/30 ring-offset-2 ring-offset-[#0d1117]"
                                )}>
                                    {isComplete ? "✓" : i + 1}
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={cn(
                                        "flex-1 h-0.5 rounded-full transition-all",
                                        i < stepIdx ? "bg-indigo-500" : "bg-white/10"
                                    )} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
                <div className="flex justify-between mt-1.5">
                    {["Posted", "Assigned", "Pending", "Confirmed", "Locked"].map(l => (
                        <span key={l} className="text-[8px] text-white/25 text-center flex-1">{l}</span>
                    ))}
                </div>
            </div>

            {/* Confirmation status */}
            <div className="px-5 pb-3 grid grid-cols-2 gap-2">
                <ConfirmationCard
                    role="Broker"
                    name={brokerName}
                    icon={User}
                    confirmed={!!brokerConfirmedAt}
                    confirmedAt={brokerConfirmedAt}
                    isCurrentUser={userRole === "broker"}
                />
                <ConfirmationCard
                    role="Escort"
                    name={escortName}
                    icon={Truck}
                    confirmed={!!escortConfirmedAt}
                    confirmedAt={escortConfirmedAt}
                    isCurrentUser={userRole === "escort"}
                />
            </div>

            {/* Evidence count */}
            {evidenceCount > 0 && (
                <div className="px-5 pb-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/5 border border-violet-500/10">
                        <Camera className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-[11px] text-white/60">
                            <span className="font-bold text-violet-300">{evidenceCount}</span> evidence items attached
                        </span>
                    </div>
                </div>
            )}

            {/* Actions */}
            {!isLocked && state !== "timed_out" && (
                <div className="px-5 pb-4 flex gap-2">
                    {canConfirm && (
                        <button aria-label="Interactive Button"
                            onClick={onConfirm}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-400 hover:to-green-400 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            Confirm Completion
                        </button>
                    )}
                    <button aria-label="Interactive Button"
                        onClick={onUploadEvidence}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 border border-white/10 transition-all"
                    >
                        <Camera className="w-3.5 h-3.5" />
                        Evidence
                    </button>
                    {state === "job_completed_pending" && (
                        <button aria-label="Interactive Button"
                            onClick={onDispute}
                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-red-500/5 text-red-400/70 hover:bg-red-500/10 border border-red-500/10 transition-all"
                        >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Dispute
                        </button>
                    )}
                </div>
            )}

            {/* Locked state celebration */}
            {isLocked && (
                <div className="px-5 pb-4">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20">
                        <Lock className="w-5 h-5 text-indigo-400" />
                        <div>
                            <div className="text-xs font-bold text-indigo-300">Ledger Locked</div>
                            <div className="text-[10px] text-white/40">
                                Immutable record • Both parties verified • Feeds trust score
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

// ── Sub-components ──

function ConfirmationCard({ role, name, icon: Icon, confirmed, confirmedAt, isCurrentUser }: {
    role: string; name?: string; icon: React.ElementType;
    confirmed: boolean; confirmedAt?: string; isCurrentUser: boolean;
}) {
    return (
        <div className={cn(
            "rounded-xl p-3 border transition-all",
            confirmed
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "bg-white/[0.02] border-white/[0.06]",
            isCurrentUser && !confirmed && "ring-1 ring-amber-500/20"
        )}>
            <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-3.5 h-3.5" style={{ color: confirmed ? "#10b981" : "#ffffff30" }} />
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">{role}</span>
                {isCurrentUser && (
                    <span className="text-[8px] font-bold text-amber-400/60 bg-amber-500/10 px-1 rounded">You</span>
                )}
            </div>
            <div className="text-xs font-bold text-white/80 truncate">{name || "—"}</div>
            {confirmed ? (
                <div className="flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-[9px] text-emerald-400 font-bold">Confirmed</span>
                </div>
            ) : (
                <div className="text-[9px] text-white/30 mt-1">Pending</div>
            )}
        </div>
    );
}

function TimeoutBadge({ timeoutAt }: { timeoutAt: string }) {
    const remaining = Math.max(0, new Date(timeoutAt).getTime() - Date.now());
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    return (
        <div className={cn(
            "text-[10px] font-bold px-2 py-1 rounded-lg",
            hours < 12 ? "bg-red-500/10 text-red-400" : "bg-white/5 text-white/40"
        )}>
            <Clock className="w-3 h-3 inline mr-1" />
            {hours}h {mins}m left
        </div>
    );
}
