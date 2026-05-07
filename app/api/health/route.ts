import { NextResponse } from 'next/server';
import {
  getFirebaseAdminStatus,
  getPaperclipStatus,
  getStripeMode,
  getUpstashStatus,
  isLocalUrl,
  isProductionRuntime,
} from '@/lib/launch/production-guards';
import { getSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

type Check = {
  status: 'ok' | 'warn' | 'error';
  detail: string;
};

function envCheck(key: string, required = false): Check {
  const present = Boolean(process.env[key]);
  if (present) return { status: 'ok', detail: 'configured' };
  return { status: required ? 'error' : 'warn', detail: 'missing' };
}

async function checkSupabasePublicRead(): Promise<Check> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return { status: 'error', detail: 'missing_public_env' };

  try {
    const res = await fetch(`${url}/rest/v1/hc_countries?select=code&limit=1`, {
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
      },
      cache: 'no-store',
    });
    return res.ok
      ? { status: 'ok', detail: 'readable' }
      : { status: 'warn', detail: `http_${res.status}` };
  } catch {
    return { status: 'warn', detail: 'unreachable' };
  }
}

export async function GET() {
  const siteUrl = getSiteUrl();
  const stripeMode = getStripeMode();
  const paperclip = getPaperclipStatus();
  const firebaseAdmin = getFirebaseAdminStatus();
  const upstash = getUpstashStatus();
  const production = isProductionRuntime();

  const checks: Record<string, Check> = {
    site_url: {
      status: siteUrl.includes('localhost') ? 'error' : 'ok',
      detail: siteUrl,
    },
    supabase_public_read: await checkSupabasePublicRead(),
    supabase_service_role: envCheck('SUPABASE_SERVICE_ROLE_KEY', true),
    stripe: {
      status:
        stripeMode === 'live' || (!production && stripeMode === 'test_mode') || stripeMode === 'disabled'
          ? 'ok'
          : stripeMode === 'test_mode'
            ? 'error'
            : 'warn',
      detail: stripeMode,
    },
    upstash_rate_limit: {
      status: upstash === 'ok' ? 'ok' : 'warn',
      detail: upstash === 'ok' ? 'configured' : 'missing_using_strict_proxy_fallback',
    },
    firebase_admin: {
      status: firebaseAdmin === 'ok' || firebaseAdmin === 'disabled' ? 'ok' : 'warn',
      detail: firebaseAdmin,
    },
    paperclip: {
      status: paperclip === 'ok' || paperclip === 'disabled' || paperclip === 'missing' ? 'ok' : 'warn',
      detail: paperclip,
    },
    typesense: {
      status:
        process.env.TYPESENSE_API_KEY ||
        process.env.TYPESENSE_ADMIN_KEY ||
        process.env.TYPESENSE_ADMIN_API_KEY ||
        process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY
          ? 'ok'
          : 'warn',
      detail: 'optional',
    },
    livekit: envCheck('LIVEKIT_API_KEY'),
    livekit_secret: envCheck('LIVEKIT_API_SECRET'),
    mapbox: envCheck('NEXT_PUBLIC_MAPBOX_TOKEN'),
  };

  if (production && isLocalUrl(process.env.PAPERCLIP_DATABASE_URL) && process.env.PAPERCLIP_ENABLED !== 'false') {
    checks.paperclip = { status: 'error', detail: 'localhost_url_blocked_in_production' };
  }

  const hasError = Object.values(checks).some((check) => check.status === 'error');
  const hasWarn = Object.values(checks).some((check) => check.status === 'warn');

  return NextResponse.json(
    {
      status: hasError ? 'red' : hasWarn ? 'yellow' : 'green',
      service: 'haul-command',
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: hasError ? 503 : 200 },
  );
}
