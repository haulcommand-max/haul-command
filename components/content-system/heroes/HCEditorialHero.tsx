import React from 'react';
import { ContentLayout } from '../config/content-system.tokens';
import { HCContentContainer } from '../shell/HCContentPageShell';

export interface HCEditorialHeroProps {
    title: string;
    description?: string;
    eyebrow?: string;
    imageUrl?: string;
    imageAlt?: string;
    overlayOpacity?: 'light' | 'medium' | 'dark' | 'heavy';
    children?: React.ReactNode;
    metaRow?: React.ReactNode;
}

export function HCEditorialHero({
    title,
    description,
    eyebrow,
    imageUrl,
    imageAlt,
    overlayOpacity = 'heavy',
    children,
    metaRow,
}: HCEditorialHeroProps) {
    const opacityMap = {
        light: 'bg-black/40',
        medium: 'bg-black/60',
        dark: 'bg-[#0B0B0C]/80',
        heavy: 'bg-[#0B0B0C]/90',
    };

    const gradientMap = {
        light: 'from-black/60 via-black/40 to-transparent',
        medium: 'from-[#0B0B0C]/90 via-[#0B0B0C]/60 to-[#0B0B0C]/30',
        dark: 'from-[#0B0B0C] via-[#0B0B0C]/80 to-[#0B0B0C]/40',
        heavy: 'from-[#0B0B0C] via-[#0B0B0C]/90 to-[#0B0B0C]/70',
    };

    return (
        <section className="hc-surface-a relative w-full overflow-hidden min-h-[500px] lg:min-h-[600px] flex items-end pb-12 lg:pb-24 pt-32 transition-all">
            {/* Background Image Layer */}
            {imageUrl && (
                <div className="absolute inset-0 w-full h-full z-0">
                    <img 
                        src={imageUrl} 
                        alt={imageAlt || "Background"} 
                        className="w-full h-full object-cover object-center"
                    />
                    {/* Multi-step gradient overlay for precise readability */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${gradientMap[overlayOpacity]} z-10`}></div>
                    <div className={`absolute inset-0 ${opacityMap[overlayOpacity]} z-[15] backdrop-blur-[2px]`}></div>
                </div>
            )}
            
            {/* Fallback solid background if no image */}
            {!imageUrl && (
                <div className="absolute inset-0 w-full h-full bg-[#111214] z-0"></div>
            )}

            {/* Content Layer */}
            <HCContentContainer className="relative z-20">
                <div className="max-w-[800px] flex flex-col gap-6">
                    {eyebrow && (
                        <div className="inline-flex">
                            <span className="bg-[#C6923A]/10 text-[#E0B05C] border border-[#C6923A]/30 px-3 py-1.5 rounded-full text-[13px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(198,146,58,0.15)]">
                                {eyebrow}
                            </span>
                        </div>
                    )}
                    
                    <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-[72px] font-black tracking-[-0.03em] leading-[1.05] text-[#F3F4F6] text-balance">
                        {title}
                    </h1>
                    
                    {description && (
                        <p className="text-lg md:text-xl text-[#B0B8C4] leading-[1.6] max-w-[720px] text-balance">
                            {description}
                        </p>
                    )}

                    {metaRow && (
                        <div className="mt-2">
                            {metaRow}
                        </div>
                    )}

                    {children && (
                        <div className="mt-4 flex flex-wrap gap-4 items-center">
                            {children}
                        </div>
                    )}
                </div>
            </HCContentContainer>
        </section>
    );
}
