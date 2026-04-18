'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function PaywallGate({ children, fallbackMessage = "You've reached your free access limit." }: { children: React.ReactNode, fallbackMessage?: string }) {
    const { paywall } = useAuth();
    const fallbackMessageDisplay = fallbackMessage || "You've reached your free access limit.";

    if (paywall?.show && paywall?.urgencyLevel === 'hard') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center bg-[#070707] border border-[#1a1a1a] rounded-2xl m-4 md:m-12">
                <div className="text-4xl mb-4">🛑</div>
                <h2 className="text-xl font-bold text-white mb-2">Limit Reached</h2>
                <p className="text-[#888] text-sm max-w-md mx-auto mb-6">
                    {fallbackMessageDisplay} Upgrade to {paywall?.suggestedTier} to unlock unlimited access.
                </p>
                <Link 
                    href="/dashboard/billing" 
                    className="font-bold text-sm bg-gradient-to-r from-[#F1A91B] to-[#d97706] text-black px-6 py-3 rounded-xl transition-transform hover:scale-105"
                >
                    Upgrade to {paywall?.suggestedTier}
                </Link>
            </div>
        );
    }

    return (
        <>
            {paywall?.show && (paywall?.urgencyLevel === 'soft' || paywall?.urgencyLevel === 'medium') && (
                <div className="bg-[#F1A91B]/10 border-b border-[#F1A91B]/20 text-center py-2 px-4 shadow-[0_4px_12px_rgba(241,169,27,0.05)] text-xs text-[#F1A91B] flex justify-center items-center gap-3 w-full">
                    <span>⚠️ Approaching volume limits.</span>
                    <Link href="/dashboard/billing" className="font-bold underline hover:text-white transition-colors">
                        Upgrade Option Available
                    </Link>
                </div>
            )}
            {children}
        </>
    );
}
