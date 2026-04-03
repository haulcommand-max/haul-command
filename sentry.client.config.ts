import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,

    // Production: capture 10% of transactions for performance tracing
    // Increase once baseline is established
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session replay: only on error in production (zero cost during normal sessions)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0,

    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

    // Release tracking: auto-detected from Vercel env vars
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
        ? `haul-command@${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA}`
        : undefined,

    // Only enable if DSN is present (safe for missing credentials)
    enabled: !!(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN),

    // Suppress known noise that creates alert fatigue
    ignoreErrors: [
        // Browser noise
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'Non-Error promise rejection captured',
        // Network conditions
        'NetworkError',
        'Failed to fetch',
        'Load failed',
        // User cancellations
        'AbortError',
        'The user aborted a request',
    ],

    // Filter out bot/crawler traffic from Sentry
    beforeSend(event) {
        // Drop events from known bot user agents
        const ua = event.request?.headers?.['User-Agent'] ?? '';
        if (/bot|crawler|spider|scraper/i.test(ua)) {
            return null;
        }
        return event;
    },
});
