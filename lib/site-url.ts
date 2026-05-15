const PRODUCTION_SITE_URL = 'https://www.haulcommand.com';
const PRODUCTION_APP_URL = 'https://app.haulcommand.com';

function normalizeSiteUrl(value: string | undefined): string {
  if (!value) return PRODUCTION_SITE_URL;
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed || trimmed.includes('localhost')) return PRODUCTION_SITE_URL;
  if (trimmed.includes('.vercel.app')) return PRODUCTION_SITE_URL;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

function normalizeAppUrl(value: string | undefined): string {
  if (!value) return PRODUCTION_APP_URL;
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed || trimmed.includes('localhost')) return PRODUCTION_APP_URL;
  if (trimmed.includes('.vercel.app')) return PRODUCTION_APP_URL;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

export function getSiteUrl(): string {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL);
}

export function absoluteUrl(path = '/'): string {
  const siteUrl = getSiteUrl();
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export const SITE_URL = getSiteUrl();
export const APP_URL = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL);
