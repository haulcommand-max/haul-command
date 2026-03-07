/**
 * HAUL COMMAND — Stripe Client (Server-Side Only)
 * Singleton Stripe instance for API route handlers.
 */
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('[HC Stripe] STRIPE_SECRET_KEY not set — payment features disabled');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-12-18.acacia' as any,
    typescript: true,
    appInfo: {
        name: 'Haul Command',
        version: '1.0.0',
    },
});

export const PLATFORM_FEE_BPS = parseInt(process.env.STRIPE_PLATFORM_FEE_BPS || '600');
export const ESCROW_HOLD_DAYS = parseInt(process.env.STRIPE_ESCROW_HOLD_DAYS || '3');
