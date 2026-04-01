'use client';

import React from 'react';
import { Shield, Truck, Zap } from 'lucide-react';
import Link from 'next/link';

interface GeoMarketplaceHeroProps {
    cityName: string;
    regionName: string;
    activeDrivers: number;
    activeLoads: number;
    supplyGapScore: number;
}

export function GeoMarketplaceHero({ cityName, regionName, activeDrivers, activeLoads, supplyGapScore }: GeoMarketplaceHeroProps) {
    // Generate a contextual query string to pre-fill the load posting flow
    const postLoadUrl = `/post-load?origin=${encodeURIComponent(`${cityName}, ${regionName}`)}`;

    return (
        <div className="relative overflow-hidden bg-[#0a0a0f] border border-white/10 rounded-3xl p-8 md:p-12 mb-12 shadow-2xl">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#F1A91B]/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/3" />

            <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">

                {/* Left Side: SEO Content & Branding */}
                <div>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="px-3 py-1 bg-[#F1A91B]/10 border border-[#F1A91B]/20 rounded-full flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-[#F1A91B]" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#F1A91B]">Verified Network</span>
                        </div>
                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Market Active</span>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
                        Pilot Car Coverage: <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F1A91B] to-orange-500">
                            {cityName}, {regionName}
                        </span>
                    </h1>

                    <p className="text-lg text-slate-400 leading-relaxed mb-8">
                        Directly connect with <strong className="text-white">{activeDrivers} pre-vetted</strong> oversize load escorts serving the {cityName} corridor. High-probability matching with integrated compliance verification.
                    </p>
                </div>

                {/* Right Side: The Smash Action Box */}
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6 relative">
                    <div className="absolute -top-3 -right-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1 shadow-red-600/20">
                        <Zap className="w-3 h-3 fill-current" /> High Demand
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 relative">
                        {/* Divider Line */}
                        <div className="absolute left-1/2 top-2 bottom-2 w-px bg-white/5 -translate-x-1/2" />

                        <div className="text-center">
                            <div className="text-3xl font-black text-white mb-1">{activeDrivers}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Available Escorts</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-black text-white mb-1">{activeLoads}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Loads</div>
                        </div>
                    </div>

                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-6">
                        <p className="text-sm text-emerald-400 font-medium text-center">
                            Fill probability is currently high. Post a load now for immediate bidding.
                        </p>
                    </div>

                    <Link
                        href={postLoadUrl}
                        className="w-full py-4 bg-[#F1A91B] hover:bg-[#d97706] text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_20px_rgba(241,169,27,0.25)] flex items-center justify-center gap-2 group">
                        <Truck className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        Post a Load from {cityName}
                    </Link>
                </div>

            </div>
        </div>
    );
}
