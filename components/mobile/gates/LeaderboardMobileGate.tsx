'use client';

import React, { Suspense, lazy } from 'react';
import { MobileGate } from '@/components/mobile/MobileGate';

const MobileLeaderboard = lazy(() => import('@/components/mobile/screens/MobileLeaderboard'));

/**
 * Client wrapper for the Leaderboards page.
 * On mobile: shows MobileLeaderboard (Frame 8).
 * On desktop: shows the children (server-rendered desktop leaderboard).
 */
export function LeaderboardMobileGate({ children }: { children: React.ReactNode }) {
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
          <MobileLeaderboard />
        </Suspense>
      }
      desktop={<>{children}</>}
    />
  );
}
