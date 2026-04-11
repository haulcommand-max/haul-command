import React from 'react';

export function HCTopicChip({ label, href, active, semanticType = 'topic' }: { label: string, href?: string, active?: boolean, semanticType?: 'topic' | 'market' | 'utility' }) {
    
    // Topic: Gold focus
    // Market: Violet/Blue focus
    // Utility: Neutral focus
    
    let baseStyles = "inline-flex items-center justify-center px-4 py-2 text-[13px] font-medium transition-all duration-200 border whitespace-nowrap rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0C] ";
    
    if (semanticType === 'topic') {
        baseStyles += active 
            ? "bg-[#C6923A] text-white border-[#C6923A] shadow-[0_0_15px_rgba(198,146,58,0.25)] focus-visible:ring-[#C6923A]" 
            : "bg-[#16181B] text-[#B0B8C4] border-[#23262B] hover:border-[#8A6428] hover:text-[#F3F4F6] hover:bg-[#1E2028] focus-visible:ring-[#8A6428]";
    } else if (semanticType === 'market') {
         baseStyles += active 
            ? "bg-[#3B82F6] text-white border-[#3B82F6] shadow-[0_0_15px_rgba(59,130,246,0.25)] focus-visible:ring-[#3B82F6]" 
            : "bg-[#16181B] text-[#B0B8C4] border-[#23262B] hover:border-[#3B82F6]/50 hover:text-[#F3F4F6] hover:bg-[#1E2028] focus-visible:ring-[#3B82F6]/50";
    } else {
        baseStyles += active 
            ? "bg-[#F3F4F6] text-[#0B0B0C] border-[#F3F4F6] focus-visible:ring-[#F3F4F6]" 
            : "bg-[#16181B] text-[#9CA3AF] border-[#23262B] hover:border-[rgba(255,255,255,0.18)] hover:text-[#F3F4F6] hover:bg-[#1E2028] focus-visible:ring-white";
    }

    if (href) {
        return (
            <a href={href} className={baseStyles}>
                {label}
            </a>
        );
    }
    
    return (
        <button type="button" className={baseStyles} aria-pressed={active}>
            {label}
        </button>
    );
}
