/**
 * Motive Webhook — Canonical URL
 * POST/GET https://haulcommand.com/api/webhooks/motive
 *
 * This is the URL that should be configured in the Motive Developer Portal.
 * Re-exports the handler from /api/motive/webhook for consistency.
 */
export { GET, POST } from '@/app/api/motive/webhook/route';
