'use client';

import React, { useRef, ReactNode } from 'react';

/**
 * ChipRail — Horizontal pill scroller
 *
 * Replaces multi-line chip wrapping chaos with a clean
 * horizontal scrollable rail. Includes:
 * - Inertial scroll behavior
 * - Fade edges on overflow
 * - Keyboard scrollable
 * - Max 5 visible pills before scroll
 */

interface ChipRailProps {
  children: ReactNode;
  className?: string;
  /** Show fade edges when content overflows */
  showFades?: boolean;
  /** Gap between chips in px */
  gap?: number;
}

export function ChipRail({
  children,
  className = '',
  showFades = true,
  gap = 8,
}: ChipRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`relative ${className}`}>
      {/* Fade edges */}
      {showFades && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none opacity-0 transition-opacity" />
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />
        </>
      )}

      {/* Scrollable rail */}
      <div
        ref={scrollRef}
        role="list"
        tabIndex={0}
        className="flex overflow-x-auto scrollbar-hide scroll-smooth"
        style={{
          gap: `${gap}px`,
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x proximity',
          paddingRight: showFades ? 24 : 0,
        }}
        onKeyDown={(e) => {
          const el = scrollRef.current;
          if (!el) return;
          if (e.key === 'ArrowRight') el.scrollBy({ left: 120, behavior: 'smooth' });
          if (e.key === 'ArrowLeft') el.scrollBy({ left: -120, behavior: 'smooth' });
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Chip — Individual pill component for use inside ChipRail
 */
interface ChipProps {
  label: string;
  href?: string;
  active?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function Chip({
  label,
  href,
  active = false,
  icon,
  onClick,
  className = '',
}: ChipProps) {
  const baseClasses = `
    inline-flex items-center gap-2 h-11 px-4 
    rounded-full whitespace-nowrap text-sm font-semibold
    transition-all duration-200 scroll-snap-align-start
    ${active
      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
      : 'bg-white/[0.03] border border-white/[0.08] text-white/60 hover:bg-white/[0.06] hover:text-white/80 hover:border-white/[0.12]'
    }
    ${className}
  `;

  if (href) {
    return (
      <a href={href} className={baseClasses} role="listitem">
        {icon}
        {label}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={baseClasses} role="listitem">
      {icon}
      {label}
    </button>
  );
}
