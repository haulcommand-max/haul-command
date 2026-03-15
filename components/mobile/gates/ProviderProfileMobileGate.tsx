'use client';

import React, { Suspense, lazy } from 'react';
import { MobileGate } from '@/components/mobile/MobileGate';

const MobileProviderProfile = lazy(() => import('@/components/mobile/screens/MobileProviderProfile'));

/**
 * Client wrapper for the Provider Profile page.
 * On mobile: shows MobileProviderProfile (Frame 7).
 * On desktop: shows the children (server-rendered desktop profile).
 */
export function ProviderProfileMobileGate({ children }: { children: React.ReactNode }) {
  return (
    <MobileGate
      mobile={
        <Suspense fallback={
          <div style={{
            background: 'var(--m-bg, #060b12)', minHeight: '100vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--m-text-muted, #8fa3b8)',
          }}>Loading...</div>
        }>
          <MobileProviderProfile />
        </Suspense>
      }
      desktop={<>{children}</>}
    />
  );
}
