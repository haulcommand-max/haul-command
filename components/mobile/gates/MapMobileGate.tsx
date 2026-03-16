'use client';

import React, { Suspense, lazy } from 'react';
import { MobileGate } from '@/components/mobile/MobileGate';

const MobileMapView = lazy(() => import('@/components/mobile/screens/MobileMapView'));

export function MapMobileGate({ children }: { children: React.ReactNode }) {
  return (
    <MobileGate
      mobile={
        <Suspense fallback={<div style={{ background: 'var(--m-bg, #060b12)', minHeight: '100vh' }} />}>
          <MobileMapView />
        </Suspense>
      }
      desktop={children}
    />
  );
}
