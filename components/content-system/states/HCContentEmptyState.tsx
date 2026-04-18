import React from 'react';
import { HCButton } from '../callouts/HCButton';

export function HCContentEmptyState({
    title = "Awaiting Intelligence",
    description = "The operations desk is compiling data. Check back shortly.",
    icon,
    actionLabel,
    actionHref,
    secondaryActionLabel,
    secondaryActionHref
}: {
    title?: string;
    description?: string;
    icon?: React.ReactNode;
    actionLabel?: string;
    actionHref?: string;
    secondaryActionLabel?: string;
    secondaryActionHref?: string;
}) {
    return (
        <div className="w-full flex justify-center py-20 px-4">
            <div className="max-w-[500px] w-full text-center p-12 bg-[#111214] border border-[#23262B] rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.4)] flex flex-col items-center">
                {icon ? icon : (
                    <div className="w-16 h-16 rounded-full bg-[#16181B] border border-[#23262B] flex items-center justify-center mb-6 shadow-inner text-[#C6923A]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    </div>
                )}
                <h3 className="text-2xl font-bold text-[#F3F4F6] mb-3">{title}</h3>
                <p className="text-[#9CA3AF] text-balance mb-8 leading-relaxed text-sm">
                    {description}
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                    {actionLabel && actionHref && (
                        <HCButton href={actionHref} variant="primary">
                            {actionLabel}
                        </HCButton>
                    )}
                    {secondaryActionLabel && secondaryActionHref && (
                        <HCButton href={secondaryActionHref} variant="secondary">
                            {secondaryActionLabel}
                        </HCButton>
                    )}
                </div>
            </div>
        </div>
    );
}
