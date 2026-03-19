// SHIM: Re-export from canonical location.
// All enterprise imports continue to work without changes.
// The canonical singleton lives in lib/stripe/client.ts.
import { getStripeClient } from '@/lib/stripe/client';

/**
 * @deprecated Use `getStripeClient()` from `@/lib/stripe/client` instead.
 * This shim exists for backwards compatibility — it returns the same singleton.
 */
export const getStripe = getStripeClient;
