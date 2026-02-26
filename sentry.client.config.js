/**
 * Sentry Client Config — Frontend error tracking + performance.
 *
 * Activates ONLY when NEXT_PUBLIC_SENTRY_DSN is set.
 * No-op otherwise — zero cost in dev or when Sentry isn't configured.
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
    import('@sentry/nextjs').then((Sentry) => {
        Sentry.init({
            dsn: SENTRY_DSN,
            release: process.env.NEXT_PUBLIC_APP_RELEASE || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'dev',
            environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

            // Performance monitoring
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

            // Session replay (optional, disabled by default)
            replaysSessionSampleRate: 0,
            replaysOnErrorSampleRate: 0.1,

            // PII safety
            sendDefaultPii: false,

            beforeSend(event) {
                // Scrub PII from breadcrumbs
                if (event.breadcrumbs) {
                    event.breadcrumbs = event.breadcrumbs.map(b => {
                        if (b.data?.url) {
                            try {
                                const url = new URL(b.data.url);
                                url.searchParams.delete('email');
                                url.searchParams.delete('phone');
                                url.searchParams.delete('token');
                                b.data.url = url.toString();
                            } catch { /* ignore */ }
                        }
                        return b;
                    });
                }
                return event;
            },
        });
    }).catch(() => {
        // @sentry/nextjs not installed — no-op
    });
}
