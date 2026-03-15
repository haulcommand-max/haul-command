'use client';

import React, { useEffect, useState } from 'react';

/* ══════════════════════════════════════════════════════════════
   MobileGate — Responsive wrapper that renders mobile or desktop
   children based on viewport width. Uses matchMedia for hydration
   safety.

   Strategy: Renders nothing during SSR to avoid hydration mismatch.
   On client mount, immediately detects viewport and renders correct view.
   This eliminates the "1 Issue" hydration error and prevents flash.

   Threshold: 768px (matches Tailwind md breakpoint)
   ══════════════════════════════════════════════════════════════ */

interface MobileGateProps {
  mobile: React.ReactNode;
  desktop: React.ReactNode;
}

export function MobileGate({ mobile, desktop }: MobileGateProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // During SSR / first client paint, show a minimal loading shell
  // instead of rendering desktop (which causes hydration mismatch
  // when the client detects mobile and swaps the entire DOM tree)
  if (isMobile === null) {
    return (
      <div style={{
        background: 'var(--m-bg, #060b12)',
        minHeight: '100vh',
      }} />
    );
  }

  return <>{isMobile ? mobile : desktop}</>;
}

export default MobileGate;
