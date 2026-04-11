import React from 'react';
import Link from 'next/link';

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
        <div className={`group flex flex-col overflow-hidden rounded-[24px] bg-[#111214] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.18)] hover:-translate-y-1 transition-all duration-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4),_0_0_0_1px_rgba(198,146,58,0.12)] ${className}`}>
            {imageUrl && (
                <div className={`w-full relative overflow-hidden bg-[#16181B] ${isCompact ? 'aspect-[4/3]' : 'aspect-video'} ${isFeatured ? 'md:aspect-[21/9]' : ''}`}>
                    <img 
                        src={imageUrl} 
                        alt={imageAlt || title} 
                        className="w-full h-full object-cover transition-transform duration-[400ms] group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111214] to-transparent opacity-60"></div>
                    {topicLabel && (
                        <div className="absolute top-4 left-4">
                            <span className="bg-[#111214]/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[12px] font-bold tracking-widest uppercase text-[#E0B05C] border border-[#C6923A]/30">
                                {topicLabel}
                            </span>
                        </div>
                    )}
                </div>
            )}
            
            <div className={`flex flex-col flex-grow ${isCompact ? 'p-4' : 'p-6 lg:p-8'}`}>
                <div className="flex gap-4 items-center text-[13px] text-[#9CA3AF] mb-3 font-medium">
                    {date && <span>{date}</span>}
                    {date && readTime && <span className="w-1 h-1 rounded-full bg-[#4B5563]"></span>}
                    {readTime && <span>{readTime}</span>}
                </div>
                
                <h3 className={`font-bold text-[#F3F4F6] mb-3 leading-tight group-hover:text-[#E0B05C] transition-colors ${isFeatured ? 'text-2xl md:text-4xl' : isCompact ? 'text-lg' : 'text-xl md:text-2xl'}`}>
                    <Link href={href} className="focus:outline-none">
                        <span className="absolute inset-0" aria-hidden="true" />
                        {title}
                    </Link>
                </h3>
                
                {excerpt && !isCompact && (
                    <p className={`text-[#B0B8C4] leading-[1.6] ${isFeatured ? 'text-lg line-clamp-3' : 'text-base line-clamp-2'}`}>
                        {excerpt}
                    </p>
                )}
            </div>
        </div>
    );
}
