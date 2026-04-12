import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface HCContentCardProps {
    title: string;
    excerpt?: string;
    href: string;
    imageUrl?: string;
    imageAlt?: string;
    date?: string;
    topicLabel?: string;
    readTime?: string;
    variant?: 'featured' | 'standard' | 'compact' | 'rail';
    className?: string;
}

export function HCContentCard({
    title,
    excerpt,
    href,
    imageUrl,
    imageAlt,
    date,
    topicLabel,
    readTime,
    variant = 'standard',
    className = ''
}: HCContentCardProps) {
    
    const isCompact = variant === 'compact' || variant === 'rail';
    const isFeatured = variant === 'featured';

    return (
        <div className={`group relative flex flex-col overflow-hidden rounded-[24px] bg-[#111214] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(198,146,58,0.25)] transition-all duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.5),_0_0_0_1px_rgba(198,146,58,0.08)] ${className}`}>
            {imageUrl && (
                <div className={`w-full relative overflow-hidden bg-[#16181B] ${isCompact ? 'aspect-[4/3]' : 'aspect-[16/10]'} ${isFeatured ? 'md:aspect-[21/9]' : ''}`}>
                    <img 
                        src={imageUrl} 
                        alt={imageAlt || title} 
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111214] via-[#111214]/20 to-transparent opacity-70"></div>
                    {topicLabel && (
                        <div className="absolute top-5 left-5">
                            <span className="bg-[#111214]/70 backdrop-blur-xl px-4 py-2 rounded-full text-[11px] font-bold tracking-[0.15em] uppercase text-[#E0B05C] border border-[#C6923A]/20">
                                {topicLabel}
                            </span>
                        </div>
                    )}
                </div>
            )}
            
            <div className={`flex flex-col flex-grow ${isCompact ? 'p-5' : 'p-7 lg:p-9'}`}>
                {/* Date / Read Time meta row - Mapbox style: lighter, more spaced */}
                <div className="flex gap-3 items-center text-[13px] text-[#6B7280] mb-4 font-medium tracking-wide">
                    {date && <span>{date}</span>}
                    {date && readTime && <span className="w-[3px] h-[3px] rounded-full bg-[#374151]"></span>}
                    {readTime && <span>{readTime}</span>}
                </div>
                
                {/* Title - cleaner weight, better line-height for readability */}
                <h3 className={`font-bold text-[#F3F4F6] leading-[1.25] tracking-[-0.01em] group-hover:text-[#E0B05C] transition-colors duration-300 ${isFeatured ? 'text-2xl md:text-[32px] mb-5' : isCompact ? 'text-lg mb-3' : 'text-xl md:text-[22px] mb-4'}`}>
                    <Link href={href} className="focus:outline-none">
                        <span className="absolute inset-0" aria-hidden="true" />
                        {title}
                    </Link>
                </h3>
                
                {/* Excerpt - better line-height and color contrast */}
                {excerpt && !isCompact && (
                    <p className={`text-[#9CA3AF] leading-[1.7] ${isFeatured ? 'text-[17px] line-clamp-3' : 'text-[15px] line-clamp-2'}`}>
                        {excerpt}
                    </p>
                )}

                {/* Read More link - Mapbox signature pattern */}
                {!isCompact && (
                    <div className="mt-auto pt-6">
                        <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#C6923A] group-hover:text-[#E0B05C] transition-colors duration-300">
                            Read more
                            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
