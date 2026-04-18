'use client';

// components/auth/PushRegistrationGate.tsx
// Silently registers for push notifications when a user is authenticated.
// Drop this into any layout that has userId available.
// Uses the existing usePushRegistration hook with autoRequest=true.

import { usePushRegistration } from '@/lib/hooks/usePushRegistration';

interface Props {
  userId: string | null;
  roleKey?: string;
  countryCode?: string;
}

/**
 * Invisible component that triggers FCM token collection once per session.
 * Will not show any UI. Will not block rendering. Will not break if FCM
 * is unavailable (graceful degradation built into usePushRegistration).
 * 
 * Usage in a layout or page:
 *   <PushRegistrationGate userId={user.id} roleKey="operator" countryCode="US" />
 */
export function PushRegistrationGate({ userId, roleKey, countryCode }: Props) {
  usePushRegistration({
    userId,
    roleKey,
    countryCode,
    autoRequest: true, // trigger on mount when userId is present
  });

  return null; // no UI — silent registration
}
