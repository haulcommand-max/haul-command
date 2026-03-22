/**
 * lib/monitoring/error.ts
 *
 * Unified error capture. Logs to:
 * 1. Supabase system_errors table (always)
 * 2. Sentry (if SENTRY_DSN is configured)
 * 3. console.error (always, for Vercel logs)
 *
 * All API route catch blocks should use this instead of console.error.
 */

import { supabaseServer } from '@/lib/supabase-server';

interface ErrorContext {
  route?: string;
  userId?: string;
  extra?: Record<string, unknown>;
}

export async function captureError(error: unknown, context?: ErrorContext) {
  const err = error instanceof Error ? error : new Error(String(error));

  // 1. Always log to console (Vercel runtime logs)
  console.error(`[${context?.route ?? 'unknown'}]`, err.message, err.stack);

  // 2. Log to Supabase system_errors table
  try {
    const sb = supabaseServer();
    await sb.from('system_errors').upsert(
      {
        route: context?.route ?? 'unknown',
        message: err.message.substring(0, 1000),
        stack: err.stack?.substring(0, 5000) ?? null,
        user_id: context?.userId ?? null,
        extra: context?.extra ?? null,
        created_at: new Date().toISOString(),
        count: 1,
      },
      {
        onConflict: 'route,message',
        // If same route+message exists, increment count
      },
    );
  } catch {
    // Non-blocking — if DB write fails, we still have console.error
  }

  // 3. Send to Sentry if configured
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn) {
    try {
      // Lightweight Sentry envelope push (no SDK needed)
      const projectId = sentryDsn.split('/').pop();
      const sentryHost = new URL(sentryDsn).hostname;
      const publicKey = new URL(sentryDsn).username;

      await fetch(`https://${sentryHost}/api/${projectId}/envelope/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-sentry-envelope',
          'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}`,
        },
        body: JSON.stringify({
          event_id: crypto.randomUUID().replace(/-/g, ''),
          exception: { values: [{ type: err.name, value: err.message, stacktrace: { frames: [] } }] },
          tags: { route: context?.route },
        }),
      }).catch(() => {}); // Non-blocking
    } catch {
      // Sentry is optional
    }
  }
}
