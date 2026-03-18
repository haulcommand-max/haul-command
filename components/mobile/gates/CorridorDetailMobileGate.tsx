'use client';

import React, { Suspense, lazy } from 'react';
import { MobileGate } from '@/components/mobile/MobileGate';

const MobileCorridorDetail = lazy(() => import('@/components/mobile/screens/MobileCorridorDetail'));

/**
 * Client wrapper for /corridor/[corridor] detail pages.
 * On mobile: shows MobileCorridorDetail (specific corridor).
 * On desktop: shows the children (server-rendered desktop page).
 */
export function CorridorDetailMobileGate({
  children,
  corridorSlug,
}: {
  children: React.ReactNode;
  corridorSlug: string;
}) {
  return (
    <MobileGate
      mobile={
        <Suspense fallback={<div style={{ background: 'var(--m-bg, #060b12)', minHeight: '100vh' }} />}>
          <MobileCorridorDetail corridorSlug={corridorSlug} />
        </Suspense>
      }
      desktop={<>{children}</>}
    />
  );
}
