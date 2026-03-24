'use client';

import { Suspense } from 'react';
import { GoogleAnalytics } from './GoogleAnalytics';
import { LinkedInInsightTag } from './LinkedInInsightTag';
import { MetaPixel } from './MetaPixel';
import { GoogleTagManager } from './GoogleTagManager';

/**
 * Master analytics component — drop into app/layout.tsx
 * Loads: GTM, GA4, LinkedIn Insight Tag, Meta Pixel
 * All pixels are no-ops when env vars are missing (safe in dev)
 */
export function AnalyticsProvider() {
  return (
    <>
      <GoogleTagManager />
      <Suspense fallback={null}>
        <GoogleAnalytics />
      </Suspense>
      <LinkedInInsightTag />
      <MetaPixel />
    </>
  );
}
