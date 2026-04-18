import React from 'react';
import { ShieldCheck, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export interface QuickAnswerProps {
    directAnswer: string;
    expandedExplanation: string;
    freshnessDate: string;
    confidenceScore: number; // 0-100
    sourcePathLabel: string;
    sourcePathHref: string;
    nextStepCtaLabel: string;
    nextStepCtaHref: string;
}

export function QuickAnswerBlock({
    directAnswer,
    expandedExplanation,
    freshnessDate,
    confidenceScore,
    sourcePathLabel,
    sourcePathHref,
    nextStepCtaLabel,
    nextStepCtaHref
}: QuickAnswerProps) {
    return (
        <div className="w-full bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 sm:p-8 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C6923A]/10 rounded-full blur-[80px] -z-10 pointer-events-none" />

            <div className="flex flex-col gap-6">
                {/* Header / Trust Metrics */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00FF66]/10 text-[#00FF66] text-[11px] font-bold uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Confidence: {confidenceScore}%
                    </div>
                    <div className="flex items-center gap-1.5 text-white/50 text-[11px] font-medium uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5" />
                        Verified: {freshnessDate}
                    </div>
                </div>

                {/* Direct Answer */}
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-3">
                        {directAnswer}
                    </h2>
                    <p className="text-sm sm:text-base text-[#8fa3b8] leading-relaxed">
                        {expandedExplanation}
                    </p>
                </div>

                {/* Footer Links & CTAs */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/[0.06]">
                    <Link 
                        href={sourcePathHref}
                        className="flex items-center gap-2 text-xs font-semibold text-[#5A6577] hover:text-white transition-colors"
                    >
                        <CheckCircle2 className="w-4 h-4 text-[#C6923A]" />
                        Source: {sourcePathLabel}
                    </Link>

                    <Link 
                        href={nextStepCtaHref}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C6923A] text-black font-bold text-sm tracking-wide hover:bg-[#C6923A]/90 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-[#C6923A]/20"
                    >
                        {nextStepCtaLabel}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
