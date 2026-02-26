/**
 * Sentry Edge Config — Edge runtime error tracking.
 *
 * Activates ONLY when SENTRY_DSN is set.
 * Minimal config for edge functions.
 */

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
    import('@sentry/nextjs').then((Sentry) => {
        Sentry.init({
            dsn: SENTRY_DSN,
            release: process.env.NEXT_PUBLIC_APP_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
            environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
            tracesSampleRate: 0.05,
            sendDefaultPii: false,
        });
    }).catch(() => {
        // @sentry/nextjs not installed — no-op
    });
}
