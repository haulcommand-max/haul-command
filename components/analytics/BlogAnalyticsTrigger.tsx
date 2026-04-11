'use client';

import { useEffect } from 'react';
import { usePostHog } from 'posthog-js/react';

export function BlogAnalyticsTrigger({ eventName, properties }: { eventName: string, properties?: Record<string, any> }) {
  const posthog = usePostHog();

  useEffect(() => {
    if (posthog) {
      posthog.capture(eventName, properties);
    }
  }, [posthog, eventName, properties]);

  return null;
}
