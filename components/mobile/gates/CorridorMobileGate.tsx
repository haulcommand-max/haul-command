'use client';

import React, { Suspense, lazy } from 'react';
import { MobileGate } from '@/components/mobile/MobileGate';

const MobileCorridors = lazy(() => import('@/components/mobile/screens/MobileCorridors'));

export function CorridorMobileGate({ children }: { children: React.ReactNode }) {
  return (
    <MobileGate
      mobile={
        <Suspense fallback={<div style={{ background: 'var(--m-bg, #060b12)', minHeight: '100vh' }} />}>
          <MobileCorridors />
        </Suspense>
      }
      desktop={children}
    />
  );
}
