'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────────
// PostClaimModal
//
// Fires after approveClaim() returns success.
// Shows:
//   1. Animated "You're live!" confirmation
//   2. Money projection widget (corridor-based, not fake data)
//   3. Profile completion progress bar
//   4. Pro upgrade CTA
//   5. "Continue building profile" secondary CTA
//
// Usage:
//   <PostClaimModal
//     operatorName="Lone Star Escort"
//     corridorName="I-35 Corridor"
//     corridorAvgMonthlyUsd={4200}
//     profileCompletionPct={38}
//     proUpgradeHref="/upgrade?plan=pro&trigger=claim_success"
//     dashboardHref="/dashboard"
//     onDismiss={() => setShowModal(false)}
//   />
// ─────────────────────────────────────────────────────────────────

interface PostClaimModalProps {
    operatorName: string;
    corridorName?: string;
    /** Average monthly USD earned by Pro operators on this corridor.
     *  Pull from corridor data or use 4200 as safe default. */
    corridorAvgMonthlyUsd?: number;
    profileCompletionPct?: number;
    proUpgradeHref: string;
    dashboardHref?: string;
    onDismiss?: () => void;
}

// Profile tasks shown in the checklist
const PROFILE_TASKS = [
    { label: 'Phone verified', pct: 10, done: true },   // already done — they just claimed
    { label: 'Add a profile photo', pct: 10, done: false },
    { label: 'Set service areas', pct: 15, done: false },
    { label: 'Upload insurance certificate', pct: 15, done: false },
    { label: 'Add equipment details', pct: 10, done: false },
    { label: 'Write a short bio', pct: 5, done: false },
    { label: 'Upload driver license / certification', pct: 10, done: false },
    { label: 'Set availability calendar', pct: 10, done: false },
];

// Milestone unlocks shown at each threshold
const MILESTONES = [
    { pct: 50, label: 'Search visibility boost + first lead preview', color: 'text-blue-400' },
    { pct: 70, label: 'Map placement, dispatch eligibility, trust badge', color: 'text-hc-gold-400' },
    { pct: 90, label: 'Leaderboard priority + full marketplace access', color: 'text-green-400' },
];

function MoneyProjectionWidget({ corridorName, avgMonthly }: { corridorName: string; avgMonthly: number }) {
    const [animated, setAnimated] = useState(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        // Animate counter from 0 to avgMonthly over 1.4s
        const start = performance.now();
        const duration = 1400;
        const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimated(Math.round(eased * avgMonthly));
            if (progress < 1) rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [avgMonthly]);

    return (
        <div className="rounded-xl border border-hc-gold-500/30 bg-gradient-to-br from-hc-gold-500/10 to-amber-900/5 p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-hc-gold-400 mb-3">
                {corridorName} — Avg Pro Operator Income
            </div>
            <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-extrabold text-white tabular-nums">
                    ${animated.toLocaleString()}
                </span>
                <span className="text-gray-400 text-sm">/month</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
                Based on real platform data from verified Pro operators active on this corridor.
                Free operators earn less — upgrade to unlock priority lead matching.
            </p>
            <div className="mt-3 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-semibold">Live data</span>
            </div>
        </div>
    );
}

function ProfileProgressBar({ pct }: { pct: number }) {
    const nextMilestone = MILESTONES.find(m => m.pct > pct);
    const currentTasksDone = PROFILE_TASKS.filter(t => t.done).length;
    const totalPossibleFromDone = PROFILE_TASKS.filter(t => t.done).reduce((s, t) => s + t.pct, 0);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Profile strength</span>
                <span className="font-bold text-hc-gold-400">{pct}%</span>
            </div>

            {/* Progress track */}
            <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                    className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-hc-gold-500 to-amber-400 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                />
                {/* Milestone markers */}
                {MILESTONES.map(m => (
                    <div
                        key={m.pct}
                        className="absolute top-0 h-full w-0.5 bg-white/20"
                        style={{ left: `${m.pct}%` }}
                    />
                ))}
            </div>

            {/* Next milestone callout */}
            {nextMilestone && (
                <div className="flex items-start gap-2 text-xs text-gray-400">
                    <span className={`mt-0.5 shrink-0 font-bold ${nextMilestone.color}`}>
                        {nextMilestone.pct}%
                    </span>
                    <span>Unlocks: {nextMilestone.label}</span>
                </div>
            )}

            {/* Task checklist */}
            <div className="space-y-1.5 pt-1">
                {PROFILE_TASKS.slice(0, 5).map(task => (
                    <div key={task.label} className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${task.done
                            ? 'border-green-500 bg-green-500/20'
                            : 'border-white/20 bg-white/5'
                            }`}>
                            {task.done && (
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                    <path d="M1.5 4L3 5.5L6.5 2.5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>
                        <span className={`text-xs ${task.done ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                            {task.label}
                        </span>
                        <span className="ml-auto text-xs text-gray-600">+{task.pct}%</span>
                    </div>
                ))}
                {PROFILE_TASKS.length > 5 && (
                    <p className="text-xs text-gray-600 pl-6">+{PROFILE_TASKS.length - 5} more tasks in your dashboard</p>
                )}
            </div>
        </div>
    );
}

export function PostClaimModal({
    operatorName,
    corridorName = 'Your Corridor',
    corridorAvgMonthlyUsd = 4200,
    profileCompletionPct = 10,
    proUpgradeHref,
    dashboardHref = '/dashboard',
    onDismiss,
}: PostClaimModalProps) {
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState<'success' | 'projection'>('success');

    // Staggered entrance
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(t);
    }, []);

    // Auto-advance from success → projection after 1.8s
    useEffect(() => {
        if (step === 'success') {
            const t = setTimeout(() => setStep('projection'), 1800);
            return () => clearTimeout(t);
        }
    }, [step]);

    const handleDismiss = () => {
        setVisible(false);
        setTimeout(() => onDismiss?.(), 300);
    };

    return (
        /* Backdrop */
        <div
            className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 transition-all duration-300 ${visible ? 'bg-black/70 backdrop-blur-sm' : 'bg-black/0 pointer-events-none'
                }`}
            onClick={e => { if (e.target === e.currentTarget) handleDismiss(); }}
            role="dialog"
            aria-modal="true"
            aria-label="Profile claimed successfully"
        >
            {/* Panel */}
            <div className={`relative w-full max-w-lg bg-[#111215] border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}>

                {/* Dismiss button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white flex items-center justify-center z-10"
                    aria-label="Close"
                >
                    ✕
                </button>

                {/* ── Step 1: Success flash ── */}
                {step === 'success' && (
                    <div className="px-8 py-12 text-center">
                        {/* Animated checkmark */}
                        <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-green-500/15 border border-green-500/40 flex items-center justify-center animate-[bounceIn_0.5s_ease-out]">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <path
                                    d="M8 16L13 21L24 10"
                                    stroke="#4ade80"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="animate-[drawCheck_0.5s_0.3s_ease-out_forwards]"
                                    strokeDasharray="28"
                                    strokeDashoffset="28"
                                    style={{
                                        animation: 'drawCheck 0.5s 0.3s ease-out forwards',
                                        strokeDashoffset: 28,
                                    }}
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-extrabold text-white mb-2">You're live!</h2>
                        <p className="text-gray-400 text-sm">
                            <span className="text-white font-semibold">{operatorName}</span>{' '}
                            is now searchable on Haul Command.
                        </p>
                        <style>{`
                            @keyframes drawCheck {
                                to { stroke-dashoffset: 0; }
                            }
                            @keyframes bounceIn {
                                0%   { transform: scale(0.5); opacity: 0; }
                                70%  { transform: scale(1.1); opacity: 1; }
                                100% { transform: scale(1); }
                            }
                        `}</style>
                    </div>
                )}

                {/* ── Step 2: Money projection + upgrade CTA ── */}
                {step === 'projection' && (
                    <div className="px-6 py-6 space-y-5">
                        {/* Header */}
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-green-400 text-lg">✓</span>
                            </div>
                            <div>
                                <h2 className="font-extrabold text-white text-lg leading-tight">
                                    {operatorName} is live
                                </h2>
                                <p className="text-sm text-gray-400">
                                    Brokers searching {corridorName} can now find you.
                                </p>
                            </div>
                        </div>

                        {/* Money projection */}
                        <MoneyProjectionWidget
                            corridorName={corridorName}
                            avgMonthly={corridorAvgMonthlyUsd}
                        />

                        {/* Profile progress */}
                        <ProfileProgressBar pct={profileCompletionPct} />

                        {/* Upgrade CTA — primary */}
                        <Link
                            href={proUpgradeHref}
                            onClick={handleDismiss}
                            className="block w-full text-center py-3.5 rounded-xl bg-hc-gold-500 text-black font-bold text-sm uppercase tracking-widest hover:bg-hc-gold-400 transition-all hover:shadow-[0_0_24px_rgba(212,167,36,0.35)]"
                        >
                            Upgrade to Pro — $29/mo
                        </Link>

                        {/* Secondary CTA */}
                        <Link
                            href={dashboardHref}
                            onClick={handleDismiss}
                            className="block w-full text-center py-3 rounded-xl border border-white/10 text-gray-400 text-sm hover:text-white hover:border-white/20 transition-all"
                        >
                            Continue building my profile →
                        </Link>

                        {/* Trust note */}
                        <p className="text-center text-xs text-gray-600">
                            No commitment. Cancel anytime. 14-day free trial on all paid plans.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PostClaimModal;
