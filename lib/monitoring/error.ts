/**
 * lib/monitoring/error.ts — Self-healing error monitoring
 * 
 * If SENTRY_DSN is set → sends to Sentry
 * Always → logs to system_errors Supabase table
 * Always → console.error in development
 * 
 * Replaces bare console.error calls across all API routes.
 */

import { createClient } from '@supabase/supabase-js';

let _supabase: ReturnType<typeof createClient> | null = null;

function getSb() {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _supabase = createClient(url, key, { auth: { persistSession: false } });
  return _supabase;
}

interface ErrorContext {
  route?: string;
  userId?: string;
  extra?: Record<string, unknown>;
}

/**
 * Capture an error — logs to Supabase system_errors + Sentry if configured.
 * Fire-and-forget: never throws, never blocks.
 */
export async function captureError(
  error: Error | string,
  context?: ErrorContext
): Promise<void> {
  const err = typeof error === 'string' ? new Error(error) : error;
  const message = err.message || 'Unknown error';
  const stack = err.stack ?? '';

  // Always log in dev
  if (process.env.NODE_ENV === 'development') {
    console.error(`[captureError] ${context?.route ?? ''}:`, message);
  }

  // Sentry — if configured
  if (process.env.SENTRY_DSN) {
    try {
      // Dynamic import to avoid bundling Sentry when not used
      const Sentry = await import('@sentry/nextjs').catch(() => null);
      if (Sentry?.captureException) {
        Sentry.captureException(err, {
          tags: { route: context?.route },
          user: context?.userId ? { id: context.userId } : undefined,
          extra: context?.extra,
        });
      }
    } catch {
      // Sentry SDK not installed — that's fine
    }
  }

  // Always → Supabase system_errors table
  try {
    const sb = getSb();
    if (!sb) return;

    // Cast to any because system_errors may not be in generated types
    await (sb.from('system_errors') as any).upsert({
      route: context?.route ?? 'unknown',
      message: message.slice(0, 500),
      stack: stack.slice(0, 2000),
      user_id: context?.userId ?? null,
      extra: context?.extra ?? {},
      created_at: new Date().toISOString(),
      count: 1,
    }, {
      onConflict: 'route,message',
    }).then(() => {});
  } catch {
    // Last resort — don't let error logging itself cause errors
    if (process.env.NODE_ENV === 'development') {
      console.error('[captureError] Failed to log to Supabase');
    }
  }
}

/**
 * Wrap an async handler with automatic error capture.
 * Use in API routes: export const GET = withErrorCapture('/api/foo', handler);
 */
export function withErrorCapture(
  route: string,
  handler: (...args: any[]) => Promise<Response>
) {
  return async (...args: any[]): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error: any) {
      await captureError(error, { route });
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}
