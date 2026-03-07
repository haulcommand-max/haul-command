'use client';

import { useEffect } from 'react';
import { initPostHog, identifyUser } from '@/lib/posthog';

/**
 * PostHog Provider — drop into app layout to initialize analytics
 * Replaces GA4, Plausible, GrowthBook, and Formbricks
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        initPostHog();
    }, []);

    return <>{children}</>;
}

/**
 * Hook to identify user after auth
 */
export function usePostHogIdentify(userId?: string, traits?: Record<string, unknown>) {
    useEffect(() => {
        if (userId) {
            identifyUser(userId, traits || {});
        }
    }, [userId, traits]);
}
