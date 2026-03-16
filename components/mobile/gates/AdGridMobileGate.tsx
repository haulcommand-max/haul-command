'use client';

import React, { Suspense, lazy } from 'react';
import { MobileGate } from '@/components/mobile/MobileGate';

const MobileAdGrid = lazy(() => import('@/components/mobile/screens/MobileAdGrid'));

export function AdGridMobileGate({ children }: { children: React.ReactNode }) {
  return (
    <MobileGate
      mobile={
        <Suspense fallback={<div style={{ background: 'var(--m-bg, #060b12)', minHeight: '100vh' }} />}>
          <MobileAdGrid />
        </Suspense>
      }
      desktop={children}
    />
  );
}
