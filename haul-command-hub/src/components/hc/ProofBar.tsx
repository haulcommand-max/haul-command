'use client';

import { useEffect, useRef, useState } from 'react';
import type { HCMetric } from '@/lib/hc-types';

/* ═══════════════════════════════════════════════════════════
   PROOF BAR — Animated Live Metrics
   
   Upgraded with:
   - Scroll-triggered count-up animation
   - IntersectionObserver for lazy activation
   - Neon gold flash on number completion
   ═══════════════════════════════════════════════════════════ */

interface ProofBarProps {
  metrics: HCMetric[];
  hideIfEmpty?: boolean;
}

function parseNumeric(val: string): number | null {
  const cleaned = val.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function formatWithOriginal(current: number, original: string): string {
  // Preserve formatting (commas, dollar signs, etc.)
  const hasCommas = original.includes(',');
  const prefix = original.match(/^[^0-9]*/)?.[0] || '';
  const suffix = original.match(/[^0-9]*$/)?.[0] || '';
  const rounded = Math.floor(current);
  const formatted = hasCommas ? rounded.toLocaleString() : rounded.toString();
  return `${prefix}${formatted}${suffix}`;
}

function AnimatedNumber({ value, label }: { value: string; label: string }) {
  const [displayValue, setDisplayValue] = useState('0');
  const [hasAnimated, setHasAnimated] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const target = parseNumeric(value);
          if (target === null) {
            setDisplayValue(value);
            return;
          }

          const duration = 1200;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * target;

            setDisplayValue(formatWithOriginal(current, value));

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setDisplayValue(value);
              setFlashActive(true);
              setTimeout(() => setFlashActive(false), 600);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, hasAnimated]);

  return (
    <div ref={ref} className={`text-xl sm:text-2xl md:text-3xl font-black text-accent tabular-nums transition-all ${flashActive ? 'ag-text-glow' : ''}`}>
      {displayValue}
    </div>
  );
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return '';
  }
}

export default function HCProofBar({ metrics, hideIfEmpty = true }: ProofBarProps) {
  const validMetrics = metrics.filter(
    (m) => m.value && m.value !== '0' && m.value !== '$0' && m.value.toLowerCase() !== 'initializing'
  );

  if (hideIfEmpty && validMetrics.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-10 py-3 sm:py-4 px-3 sm:px-4 ag-glass rounded-2xl w-full max-w-full">
      {validMetrics.map((metric, i) => (
        <div key={i} className="text-center group relative min-w-0">
          <AnimatedNumber value={metric.value} label={metric.label} />
          <div className="text-[9px] sm:text-[10px] md:text-xs text-[#8b95a5] uppercase tracking-wider mt-0.5 font-medium break-words">
            {metric.label}
          </div>
          {metric.freshness?.lastUpdatedAt && (
            <div className="text-[9px] text-gray-600 mt-1 flex items-center justify-center gap-1">
              <span className="w-1 h-1 rounded-full bg-green-500/60 inline-block animate-pulse" />
              {formatTimestamp(metric.freshness.lastUpdatedAt)}
            </div>
          )}
          {metric.geographyScope && (
            <div className="text-[9px] text-gray-600">
              {metric.geographyScope}
            </div>
          )}
          {metric.methodologyUrl && (
            <a
              href={metric.methodologyUrl}
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-accent/50 hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
            >
              methodology
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
