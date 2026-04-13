import React from 'react';
import Link from 'next/link';
import { Briefcase, MapPin, UserPlus } from 'lucide-react';

export interface ClaimFirstCTAProps {
    mode: 'claim' | 'request_support' | 'app_install' | 'book_corridor';
    marketLabel: string;
    headline?: string;
}

export function ClaimFirstCTA({ mode, marketLabel, headline }: ClaimFirstCTAProps) {
    
    // Maps intent mode to the exact copy and linking rules specified in HC-W1-07
    const renderContent = () => {
        switch (mode) {
            case 'claim':
                return {
                    icon: UserPlus,
                    title: headline || `Leave no money on the table in ${marketLabel}`,
                    text: `Ensure dispatchers and brokers find you instantly. Claim your official operator presence and dominate this market.`,
                    ctaLabel: "Claim Your Listing",
                    ctaHref: "/claim",
                    accentCode: "border-[#C6923A]"
                };
            case 'request_support':
                return {
                    icon: MapPin,
                    title: headline || `Urgent coverage needed near ${marketLabel}?`,
                    text: `Instantly match with certified lead cars, chase cars, and high-pole operators already validated for this region.`,
                    ctaLabel: "Request Available Operators",
                    ctaHref: "/loads",
                    accentCode: "border-[#00FF66]"
                };
            case 'book_corridor':
                return {
                    icon: Briefcase,
                    title: headline || `Running the ${marketLabel} lane?`,
                    text: `Access historical rates, exact bridge clearances, and available escorts who specialize in this specific corridor infrastructure.`,
                    ctaLabel: "Book Route Support",
                    ctaHref: "/corridors",
                    accentCode: "border-[#3B82F6]"
                };
            default:
                return {
                    icon: Briefcase,
                    title: `Take Command in ${marketLabel}`,
                    text: `The ultimate logistics OS for oversize loads.`,
                    ctaLabel: "Join the Network",
                    ctaHref: "/onboarding",
                    accentCode: "border-white/[0.2]"
                };
        }
    };

    const content = renderContent();
    const IconComponent = content.icon;

    return (
        <div className={`relative isolate w-full rounded-2xl bg-[#0f1420] border-l-4 ${content.accentCode} border-y border-r border-y-white/[0.05] border-r-white/[0.05] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden`}>
            {/* Soft backdrop glare */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#C6923A]/5 to-transparent z-[-1]" />

            <div className="flex gap-4">
                <div className="hidden sm:flex mt-1 w-12 h-12 bg-black/40 border border-white/10 rounded-full items-center justify-center">
                    <IconComponent className="w-5 h-5 text-white/70" />
                </div>
                <div className="max-w-2xl">
                    <h4 className="text-xl font-bold text-white mb-2 leading-tight">
                        {content.title}
                    </h4>
                    <p className="text-[#8fa3b8] text-sm leading-relaxed">
                        {content.text}
                    </p>
                </div>
            </div>

            <Link href={content.ctaHref} className="whitespace-nowrap w-full md:w-auto text-center px-6 py-3 bg-white text-black font-bold text-sm tracking-wide rounded hover:bg-white/90 transition-colors">
                {content.ctaLabel}
            </Link>
        </div>
    );
}
