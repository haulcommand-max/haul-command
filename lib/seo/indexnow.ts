/**
 * lib/seo/indexnow.ts
 *
 * S3-04: IndexNow trigger on content publish.
 *
 * Call `triggerIndexNow(urls)` from any content publish path:
 * - blog post publish
 * - glossary term upsert
 * - corridor page publish
 * - regulations page publish
 * - directory listing claim
 * - training content publish
 *
 * Internally calls POST /api/indexnow with rate-limit awareness.
 * Safe to call from Server Actions, API routes, and edge functions via internal fetch.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.haulcommand.com';

export type IndexNowResult = {
  ok: boolean;
  urls_submitted?: number;
  skipped?: boolean;
  reason?: string;
  error?: string;
};

/**
 * Canonicalize and deduplicate URL list.
 * Accepts full URLs or path strings like '/glossary/oversized-load'.
 */
function normalizeUrls(rawUrls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of rawUrls) {
    const full = u.startsWith('http') ? u : `${SITE_URL}${u.startsWith('/') ? u : `/${u}`}`;
    if (!seen.has(full)) {
      seen.add(full);
      out.push(full);
    }
  }
  return out;
}

/**
 * Enqueue URLs for IndexNow + Google Indexing API submission.
 *
 * Usage (from a Server Action or API route):
 *   import { triggerIndexNow } from '@/lib/seo/indexnow';
 *   await triggerIndexNow(['/glossary/oversize-load', '/regulations/texas']);
 */
export async function triggerIndexNow(rawUrls: string[]): Promise<IndexNowResult> {
  if (!rawUrls || rawUrls.length === 0) {
    return { ok: false, skipped: true, reason: 'no_urls' };
  }

  const urls = normalizeUrls(rawUrls);
  if (urls.length === 0) return { ok: false, skipped: true, reason: 'no_valid_urls' };

  // Batch to 100 per IndexNow spec
  const batch = urls.slice(0, 100);

  try {
    const res = await fetch(`${SITE_URL}/api/indexnow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: batch }),
    });

    if (res.status === 429) {
      // Rate limited — log but don't throw. Content already published.
      const data = await res.json();
      console.warn(`[IndexNow] Rate limited. ${data.retry_after_seconds}s until next submission.`);
      return { ok: false, skipped: true, reason: 'rate_limited', ...data };
    }

    if (!res.ok) {
      const text = await res.text();
      console.error(`[IndexNow] Submission failed: ${res.status} ${text}`);
      return { ok: false, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    console.log(`[IndexNow] Submitted ${data.urls_submitted} URLs.`);
    return { ok: true, ...data };
  } catch (err: any) {
    // Network failure — graceful degradation, don't block publish
    console.error('[IndexNow] Network error:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Convenience: trigger IndexNow for a single glossary term.
 */
export function indexGlossaryTerm(slug: string) {
  return triggerIndexNow([
    `/glossary/${slug}`,
    `/glossary`, // hub page freshness
  ]);
}

/**
 * Convenience: trigger IndexNow for a corridor page.
 */
export function indexCorridorPage(corridorSlug: string, countryCode = 'us') {
  return triggerIndexNow([
    `/routes/${corridorSlug}`,
    `/directory/${countryCode}`, // parent country page
  ]);
}

/**
 * Convenience: trigger IndexNow for a regulations page.
 */
export function indexRegulationsPage(regionSlug: string) {
  return triggerIndexNow([
    `/regulations/${regionSlug}`,
    `/regulations`,
  ]);
}

/**
 * Convenience: trigger IndexNow for a blog/intelligence article.
 */
export function indexBlogPost(slug: string) {
  return triggerIndexNow([
    `/intelligence/${slug}`,
    `/intelligence`,
  ]);
}
