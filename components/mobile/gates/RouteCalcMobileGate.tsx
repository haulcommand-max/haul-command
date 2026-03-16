'use client';

import React, { Suspense, lazy } from 'react';
import { MobileGate } from '@/components/mobile/MobileGate';

const MobileRouteCalculator = lazy(() => import('@/components/mobile/screens/MobileRouteCalculator'));

export function RouteCalcMobileGate({ children }: { children: React.ReactNode }) {
  return (
    <MobileGate
      mobile={
        <Suspense fallback={<div style={{ background: 'var(--m-bg, #060b12)', minHeight: '100vh' }} />}>
          <MobileRouteCalculator />
        </Suspense>
      }
      desktop={children}
    />
  );
}
