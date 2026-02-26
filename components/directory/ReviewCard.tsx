"use client";

import React from "react";
import { Star, Clock, Truck, MessageSquare, Camera } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDistanceToNow } from "date-fns";

// ══════════════════════════════════════════════════════════════
// ReviewCard — Haul Command Directory
// Displays a single broker-submitted operator review.
// 3-axis ratings: Punctuality, Communication, Equipment/Prof.
// Pattern from: GeoDirectory MultiRatings & Reviews add-on.
// ══════════════════════════════════════════════════════════════

export interface OperatorReview {
    id: string;
    reviewer_company?: string;
    reviewer_role?: string;
    created_at: string;
    body?: string;
    photo_url?: string;
    // 5-axis operational scores (1–5)
    score_on_time: number;
    score_communication: number;
    score_professionalism: number;
    score_equipment_ready: number;
    score_route_awareness: number;
    // Derived
    would_use_again?: boolean;
    verified_job?: boolean;
    job_corridor?: string;
}

function StarRow({ score, label, icon: Icon }: {
    score: number;
    label: string;
    icon: React.ElementType;
}) {
    return (
        <div className="flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 text-hc-subtle shrink-0" />
            <span className="text-[10px] text-hc-muted uppercase tracking-widest font-semibold w-24 shrink-0">
                {label}
            </span>
            <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                        key={i}
                        className={cn(
                            "w-3 h-3",
                            i < Math.round(score)
                                ? "text-hc-gold-500 fill-hc-gold-500"
                                : "text-hc-border"
                        )}
                    />
                ))}
            </div>
            <span className="text-[11px] font-black text-hc-text ml-1">
                {score.toFixed(1)}
            </span>
        </div>
    );
}

interface ReviewCardProps {
    review: OperatorReview;
    className?: string;
}

export function ReviewCard({ review, className }: ReviewCardProps) {
    const avgScore = (
        review.score_on_time + review.score_communication +
        review.score_professionalism + review.score_equipment_ready + review.score_route_awareness
    ) / 5;

    return (
        <div className={cn("hc-card p-5 space-y-4", className)}>
            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-hc-elevated border border-hc-border flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-hc-muted">
                            {(review.reviewer_company ?? "B").charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-hc-text">
                            {review.reviewer_company ?? "Verified Broker"}
                        </p>
                        <p className="text-[10px] text-hc-subtle uppercase tracking-widest">
                            {review.reviewer_role ?? "Broker"}
                            {review.job_corridor && ` · ${review.job_corridor}`}
                        </p>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    {/* Big avg score */}
                    <div className="text-2xl font-black text-hc-gold-500 tracking-tight">
                        {avgScore.toFixed(1)}
                    </div>
                    <div className="text-[10px] text-hc-subtle uppercase tracking-widest">
                        Overall
                    </div>
                </div>
            </div>

            {/* 5-axis operational ratings */}
            <div className="space-y-1.5 py-3 border-y border-hc-border-bare">
                <StarRow score={review.score_on_time} label="On Time" icon={Clock} />
                <StarRow score={review.score_communication} label="Communication" icon={MessageSquare} />
                <StarRow score={review.score_professionalism} label="Professionalism" icon={Truck} />
                <StarRow score={review.score_equipment_ready} label="Equipment" icon={Truck} />
                <StarRow score={review.score_route_awareness} label="Route Awareness" icon={MessageSquare} />
            </div>

            {/* Review body */}
            {review.body && (
                <p className="text-[13px] text-hc-muted leading-relaxed">
                    "{review.body}"
                </p>
            )}

            {/* Review photo */}
            {review.photo_url && (
                <div className="relative aspect-video rounded-xl overflow-hidden border border-hc-border-bare">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={review.photo_url}
                        alt="Job site photo"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded text-white text-[10px] font-bold uppercase tracking-widest">
                        <Camera className="w-3 h-3" />
                        Job Photo
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {review.verified_job && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-hc-success/10 border border-hc-success/20 text-[9px] font-black text-hc-success uppercase tracking-widest">
                            ✓ Verified Job
                        </span>
                    )}
                    {review.would_use_again !== undefined && (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${review.would_use_again
                                ? 'bg-hc-success/10 border-hc-success/20 text-hc-success'
                                : 'bg-hc-danger/10 border-hc-danger/20 text-hc-danger'
                            }`}>
                            {review.would_use_again ? '↩ Would Use Again' : '✗ Would Not Use Again'}
                        </span>
                    )}
                </div>
                <span className="text-[10px] text-hc-subtle">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </span>
            </div>
        </div>
    );
}

/** Aggregate summary bar — "Overall · 4.8 based on 24 reviews" */
export function ReviewSummaryBar({ reviews, className }: {
    reviews: OperatorReview[];
    className?: string;
}) {
    if (reviews.length === 0) return null;

    const avg = (key: keyof Pick<OperatorReview, 'score_on_time' | 'score_communication' | 'score_professionalism' | 'score_equipment_ready' | 'score_route_awareness'>) =>
        reviews.reduce((sum, r) => sum + (r[key] as number), 0) / reviews.length;

    const avgOnTime = avg('score_on_time');
    const avgComm = avg('score_communication');
    const avgProf = avg('score_professionalism');
    const avgEquip = avg('score_equipment_ready');
    const avgRoute = avg('score_route_awareness');
    const overall = (avgOnTime + avgComm + avgProf + avgEquip + avgRoute) / 5;
    const wouldUseAgainPct = Math.round(
        100 * reviews.filter(r => r.would_use_again).length / reviews.length
    );

    return (
        <div className={cn("hc-card p-5 space-y-4", className)}>
            <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-hc-text uppercase tracking-widest">
                    Reviews
                </h3>
                <span className="text-[10px] text-hc-subtle">
                    {reviews.length} verified job{reviews.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Big overall score */}
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-center shrink-0">
                    <div className="text-5xl font-black text-hc-text tracking-tight">{overall.toFixed(1)}</div>
                    <div className="text-[9px] font-bold text-hc-muted uppercase tracking-widest mt-1">Overall</div>
                    {wouldUseAgainPct >= 0 && (
                        <div className="mt-2 text-[10px] font-black text-hc-success">{wouldUseAgainPct}%</div>
                    )}
                    <div className="text-[9px] text-hc-subtle uppercase tracking-widest">repeat</div>
                </div>
                <div className="flex-1 space-y-1.5">
                    <StarRow score={avgOnTime} label="On Time" icon={Clock} />
                    <StarRow score={avgComm} label="Communication" icon={MessageSquare} />
                    <StarRow score={avgProf} label="Professionalism" icon={Truck} />
                    <StarRow score={avgEquip} label="Equipment" icon={Truck} />
                    <StarRow score={avgRoute} label="Route Awareness" icon={MessageSquare} />
                </div>
            </div>
        </div>
    );
}

export default ReviewCard;
