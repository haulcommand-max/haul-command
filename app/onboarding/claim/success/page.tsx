"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Crown, ArrowRight } from "lucide-react";
import { Suspense } from "react";

function SuccessContent() {
    const searchParams = useSearchParams();
    const surfaceId = searchParams.get("surface_id");
    const plan = searchParams.get("plan");
    const isPremium = plan === "premium";

    return (
        <div className="min-h-screen bg-hc-bg flex items-center justify-center text-hc-text p-4 font-sans">
            <div className="max-w-md w-full text-center space-y-6">
                <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center border
                    ${isPremium ? "bg-[#C6923A]/10 border-[#C6923A]/30 text-[#C6923A]" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"}
                `}>
                    {isPremium ? <Crown className="w-10 h-10" /> : <CheckCircle className="w-10 h-10" />}
                </div>

                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">Claim Successful</h1>
                    <p className="text-gray-400 text-sm">
                        {isPremium
                            ? "Your Premium Profile is activated and pending review."
                            : "Your Free Profile is claimed and pending verification."}
                    </p>
                </div>

                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold font-mono text-left mb-2">Next Steps</p>
                    <ul className="text-left text-sm text-gray-300 space-y-2">
                        <li>1. A specialist will verify your credentials within 2-4 hours.</li>
                        <li>2. Any required FMCSA/DOT manual review will trigger an email.</li>
                        <li>3. Profile visibility changes will sync automatically.</li>
                    </ul>
                </div>

                <Link href="/directory" className="inline-flex w-full items-center justify-center gap-2 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-all mt-4">
                    Return to Directory <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-hc-bg flex items-center justify-center text-hc-text">
                <div className="animate-pulse text-gray-500">Loading...</div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
