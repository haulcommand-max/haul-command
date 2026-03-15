'use client';

import React, { useEffect, useState } from 'react';

/* ══════════════════════════════════════════════════════════════
   MobileGate — Responsive wrapper that renders mobile or desktop
   children based on viewport width. Uses matchMedia for hydration
   safety (renders nothing on first paint, then shows correct view).
   
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

  // During SSR / first paint, render desktop (SEO-friendly default)
  if (isMobile === null) {
    return <>{desktop}</>;
  }

  return <>{isMobile ? mobile : desktop}</>;
}

export default MobileGate;
