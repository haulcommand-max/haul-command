"use client";

import { cn } from "../../../lib/utils/cn";
import { motion } from "framer-motion";

interface OnboardingProgressProps {
    currentStep: number;
    totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
    const progress = (currentStep / totalSteps) * 100;

    return (
        <div className="w-full max-w-md mx-auto mb-8">
            <div className="flex justify-between mb-2 text-xs font-medium text-brand-muted uppercase tracking-wider">
                <span>Start</span>
                <span>Claim</span>
            </div>
            <div className="h-2 w-full bg-brand-dark/50 rounded-full overflow-hidden border border-brand-steel/30">
                <motion.div
                    className="h-full bg-brand-gold shadow-[0_0_10px_rgba(245,197,24,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                />
            </div>
        </div>
    );
}
