const LOCALHOST_RE = /(^|\/\/|@)(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?/i;

export type ServiceStatus = 'ok' | 'disabled' | 'missing' | 'misconfigured' | 'test_mode' | 'live';

export function isProductionRuntime(): boolean {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
}

export function isLocalUrl(value: string | undefined): boolean {
  return Boolean(value && LOCALHOST_RE.test(value));
}

export function getStripeMode(): ServiceStatus {
  const secret = process.env.STRIPE_SECRET_KEY || '';
  const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

  if (process.env.PAYMENTS_ENABLED === 'false') return 'disabled';
  if (!secret || !publishable) return 'missing';
  if (secret.startsWith('sk_live_') && publishable.startsWith('pk_live_')) return 'live';
  if (secret.startsWith('sk_test_') || publishable.startsWith('pk_test_')) return 'test_mode';
  return 'misconfigured';
}

export function isStripeCheckoutEnabled(): boolean {
  const mode = getStripeMode();
  if (mode === 'disabled' || mode === 'missing' || mode === 'misconfigured') return false;
  if (isProductionRuntime() && mode !== 'live') return false;
  return true;
}

export function getStripeCheckoutBlockReason(): string | null {
  const mode = getStripeMode();
  if (isStripeCheckoutEnabled()) return null;
  if (mode === 'test_mode' && isProductionRuntime()) return 'production_test_keys_blocked';
  if (mode === 'disabled') return 'payments_disabled';
  if (mode === 'missing') return 'stripe_keys_missing';
  return 'stripe_misconfigured';
}

export function getPaperclipStatus(): ServiceStatus {
  if (process.env.PAPERCLIP_ENABLED === 'false') return 'disabled';
  const url = process.env.PAPERCLIP_DATABASE_URL;
  if (!url) return 'missing';
  if (isProductionRuntime() && isLocalUrl(url)) return 'misconfigured';
  return 'ok';
}

export function isFirebaseAdminEnabled(): boolean {
  if (process.env.FIREBASE_ADMIN_ENABLED === 'false') return false;
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
      process.env.FIREBASE_SERVICE_ACCOUNT ||
      (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY),
  );
}

export function getFirebaseAdminStatus(): ServiceStatus {
  if (process.env.FIREBASE_ADMIN_ENABLED === 'false') return 'disabled';
  return isFirebaseAdminEnabled() ? 'ok' : 'missing';
}

export function getUpstashStatus(): ServiceStatus {
  return process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? 'ok' : 'missing';
}
