import * as Sentry from '@sentry/nextjs';

// Edge runtime Sentry config (Next.js middleware & edge routes)
Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Lower sample rate for edge — high throughput
    tracesSampleRate: 0.05,

    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
        ? `haul-command@${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA}`
        : undefined,

    enabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
});
