/**
 * HAUL COMMAND — Stripe Client (Server-Side Only)
 * Singleton Stripe instance for API route handlers.
 * Lazy-initialized to prevent build-time crashes when STRIPE_SECRET_KEY is missing.
 */
import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
    if (!_stripe) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('[HC Stripe] STRIPE_SECRET_KEY not set — cannot create Stripe client');
        }
        _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2024-12-18.acacia' as any,
            typescript: true,
            appInfo: {
                name: 'Haul Command',
                version: '1.0.0',
            },
        });
    }
    return _stripe;
}

/**
 * @deprecated Use getStripeClient() instead. 
 * This getter exists for backward compatibility with imports that use `stripe` directly.
 * It will throw at runtime (not build time) if STRIPE_SECRET_KEY is missing.
 */
export const stripe = new Proxy({} as Stripe, {
    get(_target, prop) {
        return (getStripeClient() as any)[prop];
    },
});

export const PLATFORM_FEE_BPS = parseInt(process.env.STRIPE_PLATFORM_FEE_BPS || '600');
export const ESCROW_HOLD_DAYS = parseInt(process.env.STRIPE_ESCROW_HOLD_DAYS || '3');
