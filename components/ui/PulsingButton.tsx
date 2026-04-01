'use client';

import React from 'react';

interface PulsingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    glowColor?: string;
    variant?: 'primary' | 'danger' | 'success';
}

export default function PulsingButton({
    children,
    glowColor = 'rgba(245, 158, 11, 0.6)', // Amber default
    variant = 'primary',
    className = '',
    ...props
}: PulsingButtonProps) {

    // Base styles
    const baseClasses = 'relative inline-flex items-center justify-center px-8 py-4 font-bold text-white rounded-xl overflow-hidden transition-transform active:scale-95';

    // Variant colors
    const variants = {
        primary: 'bg-hc-primary-gold text-hc-command-black',
        danger: 'bg-red-600',
        success: 'bg-emerald-600',
    };

    return (
        <button
            className={`${baseClasses} ${variants[variant]} ${className} group`}
            {...props}
        >
            {/* Liquid Glow Base */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out"
                style={{
                    background: `radial-gradient(circle at 50% 120%, ${glowColor} 0%, transparent 70%)`
                }}
            />

            {/* Liquid Shine Swiping Effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-shine bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            {/* Pulsing Border Glow */}
            <div className="absolute inset-0 rounded-xl border border-white/10 group-hover:border-white/30 group-hover:animate-pulse shadow-[0_0_20px_rgba(245,158,11,0)] group-hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all duration-300 pointer-events-none" />

            <span className="relative z-10 flex items-center justify-center gap-2 tracking-wide uppercase">
                {children}
            </span>
        </button>
    );
}
