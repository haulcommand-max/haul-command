'use client';

import React from 'react';
import { CheckCircle, ArrowRight, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function SponsorSuccessPage() {
    return (
        <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center">
            <div className="max-w-lg mx-auto text-center px-4">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-8">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>

                <h1 className="text-4xl font-black tracking-tight mb-4">
                    Territory Claimed! 🎉
                </h1>

                <p className="text-slate-400 text-lg mb-8">
                    Your sponsorship is now active. Your brand will appear on your sponsored city and corridor pages within minutes.
                </p>

                <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 mb-8 text-left">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
                        <Trophy className="w-4 h-4" /> What happens next
                    </h3>
                    <ul className="space-y-3 text-sm text-slate-300">
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            Your logo and CTA are now live on your sponsored pages
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            You&apos;ll receive lead analytics in your dashboard
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            Priority placement is active for your territory
                        </li>
                    </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/directory"
                        className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-xl transition-all"
                    >
                        View Directory <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-6 py-3 rounded-xl transition-all"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
