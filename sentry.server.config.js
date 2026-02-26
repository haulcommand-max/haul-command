/**
 * Sentry Server Config — Backend error tracking.
 *
 * Activates ONLY when SENTRY_DSN is set.
 * No-op otherwise.
 */

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
    import('@sentry/nextjs').then((Sentry) => {
        Sentry.init({
            dsn: SENTRY_DSN,
            release: process.env.NEXT_PUBLIC_APP_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
            environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',

            tracesSampleRate: 0.1,

            // PII safety
            sendDefaultPii: false,

            beforeSend(event) {
                // Scrub sensitive headers
                if (event.request?.headers) {
                    delete event.request.headers['authorization'];
                    delete event.request.headers['cookie'];
                    delete event.request.headers['x-supabase-auth'];
                }
                return event;
            },
        });
    }).catch(() => {
        // @sentry/nextjs not installed — no-op
    });
}
