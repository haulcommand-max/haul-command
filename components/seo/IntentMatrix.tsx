import React from 'react';
import Link from 'next/link';

export interface IntentLink {
    label: string;
    url: string;
    searchVolumeEstimate?: 'high' | 'medium' | 'long-tail';
}

export interface IntentMatrixProps {
    category: string;
    intents: IntentLink[];
}

/**
 * HC-W2-02 — Role × Intent × Market Landing Grid
 * A dense SEO module exposing long-tail, high-intent landing pages. 
 * Converts empty state searches into structured HTML exploration paths.
 */
export function IntentMatrix({ category, intents }: IntentMatrixProps) {
    return (
        <div className="w-full py-8 border-t border-white/[0.05]">
            <h4 className="text-xs font-black text-[#5A6577] uppercase tracking-[0.2em] mb-4">
                Popular in {category}
            </h4>
            <div className="flex flex-wrap gap-2.5">
                {intents.map((intent) => {
                    // Visually weight links by estimated volume to create natural hierarchy
                    const isHigh = intent.searchVolumeEstimate === 'high';
                    const isMed = intent.searchVolumeEstimate === 'medium';
                    
                    return (
                        <Link
                            key={intent.url}
                            href={intent.url}
                            className={`
                                inline-flex items-center rounded-lg border transition-colors whitespace-nowrap
                                ${isHigh 
                                    ? 'bg-white/[0.04] border-white/[0.1] text-white font-medium px-4 py-2 hover:bg-white/[0.08]' 
                                    : isMed 
                                        ? 'bg-transparent border-white/[0.05] text-[#8fa3b8] px-3.5 py-1.5 text-sm hover:text-white hover:border-white/[0.15]'
                                        : 'bg-transparent border-transparent text-[#5A6577] px-2 py-1.5 text-xs hover:text-[#8fa3b8] hover:bg-white/[0.02]'
                                }
                            `}
                        >
                            {intent.label}
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
