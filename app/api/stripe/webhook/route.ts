/**
 * ══════════════════════════════════════════════════════════
 * DEPRECATED — Redirects to unified handler at /api/webhooks/stripe
 *
 * The unified handler at /api/webhooks/stripe merges 5 previous
 * Stripe webhook routes into one. This file is kept as a fallback
 * re-export so any existing Stripe webhook configurations pointing
 * to /api/stripe/webhook continue to work.
 *
 * DO NOT add new logic here. All Stripe webhook logic lives in:
 *   app/api/webhooks/stripe/route.ts
 * ══════════════════════════════════════════════════════════
 */
export { POST } from '@/app/api/webhooks/stripe/route';
