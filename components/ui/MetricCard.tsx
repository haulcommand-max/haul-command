'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * MetricCard — Shared stat/trust/rate card shell
 *
 * Consistent card component for all numeric displays:
 * - Count-up animation on viewport entry
 * - Semantic color coding
 * - Label + value + optional delta/freshness
 * - Unified border/shadow system
 */

type MetricColor = 'gold' | 'green' | 'blue' | 'purple' | 'white' | 'red';

interface MetricCardProps {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  sublabel?: string;
  color?: MetricColor;
  animate?: boolean;
  /** Freshness tag, e.g. "Updated Apr 2026" */
  freshness?: string;
  /** Delta indicator, e.g. "+12%" */
  delta?: string;
  deltaPositive?: boolean;
  className?: string;
  onClick?: () => void;
}

const COLOR_MAP: Record<MetricColor, { text: string; glow: string }> = {
  gold: { text: 'text-amber-400', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.08)]' },
  green: { text: 'text-emerald-400', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.08)]' },
  blue: { text: 'text-sky-400', glow: 'shadow-[0_0_20px_rgba(56,189,248,0.08)]' },
  purple: { text: 'text-violet-400', glow: 'shadow-[0_0_20px_rgba(167,139,250,0.08)]' },
  white: { text: 'text-white', glow: '' },
  red: { text: 'text-red-400', glow: 'shadow-[0_0_20px_rgba(248,113,113,0.08)]' },
};

function useCountUp(target: number, animate: boolean, duration = 1200) {
  const [count, setCount] = useState(animate ? 0 : target);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!animate || hasAnimated.current) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, animate, duration]);

  return { count, ref };
}

export function MetricCard({
  label,
  value,
  prefix = '',
  suffix = '',
  sublabel,
  color = 'gold',
  animate = true,
  freshness,
  delta,
  deltaPositive,
  className = '',
  onClick,
}: MetricCardProps) {
  const numericValue = typeof value === 'number' ? value : parseInt(String(value).replace(/[^0-9]/g, ''), 10);
  const isNumeric = !isNaN(numericValue) && typeof value === 'number';
  const { count, ref } = useCountUp(isNumeric ? numericValue : 0, animate && isNumeric);

  const colors = COLOR_MAP[color];
  const displayValue = isNumeric
    ? `${prefix}${count.toLocaleString()}${suffix}`
    : `${prefix}${value}${suffix}`;

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`
        rounded-2xl p-5 
        bg-white/[0.02] border border-white/[0.08]
        ${colors.glow}
        transition-all duration-300
        ${onClick ? 'cursor-pointer hover:border-white/[0.15] hover:bg-white/[0.04]' : ''}
        ${className}
      `}
    >
      {/* Value */}
      <div className={`text-2xl sm:text-3xl font-black ${colors.text} leading-none mb-1`}>
        {displayValue}
      </div>

      {/* Delta */}
      {delta && (
        <span className={`text-xs font-bold ${deltaPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {delta}
        </span>
      )}

      {/* Label */}
      <div className="text-xs text-white/40 font-semibold uppercase tracking-wider mt-2">
        {label}
      </div>

      {/* Sublabel */}
      {sublabel && (
        <div className="text-[10px] text-white/25 mt-1 leading-snug">
          {sublabel}
        </div>
      )}

      {/* Freshness */}
      {freshness && (
        <div className="text-[9px] text-white/15 mt-2 uppercase tracking-wide">
          {freshness}
        </div>
      )}
    </div>
  );
}
