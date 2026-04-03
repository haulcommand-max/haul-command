import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Server-side: capture more errors for full visibility
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
        ? `haul-command@${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA}`
        : undefined,

    // Only enable if DSN is present
    enabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),

    // Capture unhandled promise rejections and uncaught exceptions
    integrations: [
        Sentry.captureConsoleIntegration({ levels: ['error'] }),
    ],

    // Filter out expected errors that don't indicate real issues
    ignoreErrors: [
        // Supabase expected user-facing errors
        'Invalid login credentials',
        'JWT expired',
        'Email not confirmed',
    ],

    // Add extra server context
    beforeSend(event) {
        // Attach deployment info from Vercel env
        event.tags = {
            ...event.tags,
            vercel_env: process.env.VERCEL_ENV ?? 'unknown',
            region: process.env.VERCEL_REGION ?? 'unknown',
        };
        return event;
    },
});
