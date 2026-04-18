'use client';

import React, { ReactNode } from 'react';

/**
 * SectionShell — Shared spacing/background/layout wrapper
 *
 * Provides consistent section structure across all pages:
 * - Standardized padding (mobile-first)
 * - Background variants (dark, subtle, featured)
 * - Optional eyebrow, title, subtitle
 * - Divider modes
 */

type BackgroundVariant = 'dark' | 'subtle' | 'featured' | 'transparent' | 'gradient';
type PaddingMode = 'compact' | 'standard' | 'spacious';
type DividerMode = 'none' | 'top' | 'bottom' | 'both';

interface SectionShellProps {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  backgroundVariant?: BackgroundVariant;
  paddingMode?: PaddingMode;
  dividerMode?: DividerMode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  id?: string;
}

const BG_CLASSES: Record<BackgroundVariant, string> = {
  dark: 'bg-[#050505]',
  subtle: 'bg-white/[0.01]',
  featured: 'bg-gradient-to-br from-amber-500/[0.04] to-transparent',
  transparent: '',
  gradient: 'bg-gradient-to-b from-[#0a0a0a] to-[#050505]',
};

const PADDING_CLASSES: Record<PaddingMode, string> = {
  compact: 'py-7 sm:py-8',
  standard: 'py-10 sm:py-12',
  spacious: 'py-14 sm:py-16',
};

const MAX_WIDTH_CLASSES: Record<string, string> = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  full: 'max-w-full',
};

const DIVIDER_CLASSES: Record<DividerMode, string> = {
  none: '',
  top: 'border-t border-white/[0.05]',
  bottom: 'border-b border-white/[0.05]',
  both: 'border-t border-b border-white/[0.05]',
};

export function SectionShell({
  children,
  eyebrow,
  title,
  subtitle,
  backgroundVariant = 'dark',
  paddingMode = 'standard',
  dividerMode = 'none',
  maxWidth = 'lg',
  className = '',
  id,
}: SectionShellProps) {
  return (
    <section
      id={id}
      className={`${BG_CLASSES[backgroundVariant]} ${PADDING_CLASSES[paddingMode]} ${DIVIDER_CLASSES[dividerMode]} ${className}`}
    >
      <div className={`${MAX_WIDTH_CLASSES[maxWidth]} mx-auto px-4 sm:px-6`}>
        {(eyebrow || title || subtitle) && (
          <div className="mb-6 sm:mb-8">
            {eyebrow && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-[0.1em]">
                  {eyebrow}
                </span>
              </div>
            )}
            {title && (
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-snug tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm sm:text-base text-white/50 mt-2 leading-relaxed max-w-xl">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
