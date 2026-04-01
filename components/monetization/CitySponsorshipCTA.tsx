'use client';

import React from 'react';
import { Crown, Zap, TrendingUp, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CitySponsorshipCTAProps {
    cityName: string;
    regionName: string;
    pricePerMonth: number;
}

export function CitySponsorshipCTA({ cityName, regionName, pricePerMonth }: CitySponsorshipCTAProps) {
    return (
        <div className="bg-gradient-to-br from-[#F1A91B]/10 via-[#111] to-[#111] border border-[#F1A91B]/20 rounded-3xl p-8 relative overflow-hidden group">

            {/* Background FX */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F1A91B]/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-[#F1A91B]/20 transition-colors duration-700" />

            <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center relative z-10">

                {/* Pitch Content */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Crown className="w-5 h-5 text-[#F1A91B]" />
                        <span className="text-xs font-bold uppercase tracking-widest text-[#F1A91B]">Exclusive Placement</span>
                    </div>

                    <h3 className="text-3xl font-black text-white tracking-tight mb-2">
                        Dominate {cityName}, {regionName}
                    </h3>

                    <p className="text-slate-400 text-sm md:text-base max-w-xl leading-relaxed">
                        Secure the #1 Featured Spot on this page. Capture 100% of organic broker searches and lock out competing pilots in the {cityName} market.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                            <Zap className="w-4 h-4 text-emerald-500" /> Instant Leads
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                            <TrendingUp className="w-4 h-4 text-blue-500" /> 15x Visibility
                        </div>
                    </div>
                </div>

                {/* Pricing / CTA */}
                <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 text-center shadow-2xl relative min-w-[280px]">
                    <div className="absolute -top-3 -right-3 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    </div>

                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Monthly Sponsorship</div>
                    <div className="flex items-baseline justify-center gap-1 mb-6">
                        <span className="text-2xl font-bold text-slate-400">$</span>
                        <span className="text-5xl font-black text-white tracking-tighter">{pricePerMonth}</span>
                        <span className="text-sm font-bold text-slate-500">/mo</span>
                    </div>

                    <Link
                        href={`/sponsor/checkout?geo=${encodeURIComponent(cityName.toLowerCase() + '-' + regionName.toLowerCase())}`}
                        className="w-full py-4 bg-[#F1A91B] hover:bg-[#d97706] text-black font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_4px_20px_rgba(241,169,27,0.3)]">
                        Claim {cityName} <ChevronRight className="w-5 h-5" />
                    </Link>
                    <p className="text-[10px] text-slate-500 mt-3 font-medium">Only 1 slot available per city.</p>
                </div>

            </div>
        </div>
    );
}
