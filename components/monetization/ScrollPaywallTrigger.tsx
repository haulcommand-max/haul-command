'use client';

// ══════════════════════════════════════════════════════════════════
// SCROLL PAYWALL TRIGGER
//
// Renders the PaywallBanner when the user scrolls past a threshold
// percentage of the page (default: 66% — 2/3 scroll depth).
//
// Usage:
//   import dynamic from 'next/dynamic';
//   const ScrollPaywallTrigger = dynamic(() =>
//     import('@/components/monetization/ScrollPaywallTrigger')
//   );
//   ...
//   <ScrollPaywallTrigger surfaceName="Blog" tier="Pro" />
//
// Design choices:
// - Uses IntersectionObserver on a sentinel element positioned at
//   the scroll threshold, rather than scroll event listeners (perf).
// - Animates in from below using CSS transition (no dependency).
// - Respects the 24h localStorage dismiss from PaywallBanner.
// ══════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { PaywallBanner } from './PaywallBanner';

interface ScrollPaywallTriggerProps {
  /** Name of the surface for attribution + per-surface dismiss */
  surfaceName: string;
  /** Plan tier to suggest */
  tier?: string;
  /** Fraction of page to scroll before triggering (0–1, default 0.67) */
  threshold?: number;
  /** Urgency: 'soft' | 'medium' | 'hard' (default 'soft') */
  urgencyLevel?: 'soft' | 'medium' | 'hard';
  /** Custom headline override */
  headline?: string;
}

export default function ScrollPaywallTrigger({
  surfaceName,
  tier = 'Pro',
  threshold = 0.67,
  urgencyLevel = 'soft',
  headline,
}: ScrollPaywallTriggerProps) {
  const [triggered, setTriggered] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Check if already dismissed — avoid showing again immediately
  useEffect(() => {
    const key = `hc_paywall_dismissed_${surfaceName}`;
    const ts = localStorage.getItem(key);
    if (ts) {
      const age = Date.now() - parseInt(ts, 10);
      if (age < 86_400_000) return; // Still within 24h dismiss window
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTriggered(true);
          observer.disconnect(); // Only trigger once per session
        }
      },
      { threshold: 0, rootMargin: '0px' }
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [surfaceName]);

  return (
    <>
      {/* Sentinel element positioned at the scroll threshold */}
      {/* It uses a percentage-based top calculated via inline style — */}
      {/* IntersectionObserver fires when this element enters the viewport */}
      <div
        ref={sentinelRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: `${Math.round(threshold * 100)}%`,
          left: 0,
          width: 1,
          height: 1,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      {/* Sticky bottom banner — slides up when triggered */}
      {triggered && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 transition-transform duration-500"
          style={{
            background: 'linear-gradient(to top, rgba(10,10,10,0.98) 60%, transparent)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="max-w-3xl mx-auto">
            <PaywallBanner
              forceShow
              suggestedTier={tier}
              surfaceName={surfaceName}
              urgencyLevel={urgencyLevel}
            />
          </div>
        </div>
      )}
    </>
  );
}
