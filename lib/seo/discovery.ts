/**
 * Discovery Acceleration — IndexNow + Sitemap Pinging
 *
 * Submits newly-indexable URLs to search engines for rapid discovery.
 *
 * IndexNow: instant notification to Bing + partners (Yandex, Naver, etc.)
 * Sitemap Ping: legacy ping to Google & Bing when sitemap changes.
 *
 * Usage:
 *   import { submitToIndexNow, pingSitemaps } from '@/lib/seo/discovery';
 *   await submitToIndexNow(['https://haulcommand.com/directory/us/fl/miami']);
 *   await pingSitemaps();
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com';

// IndexNow key — generate a random key and place it as a static file at /{key}.txt
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;

/**
 * Submit URLs to IndexNow (Bing + partner engines).
 * Batches up to 10000 URLs per request.
 */
export async function submitToIndexNow(urls: string[]): Promise<{ success: boolean; submitted: number }> {
    if (!INDEXNOW_KEY || urls.length === 0) {
        return { success: false, submitted: 0 };
    }

    const batches: string[][] = [];
    for (let i = 0; i < urls.length; i += 10000) {
        batches.push(urls.slice(i, i + 10000));
    }

    let totalSubmitted = 0;

    for (const batch of batches) {
        try {
            const res = await fetch('https://api.indexnow.org/indexnow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    host: new URL(BASE_URL).hostname,
                    key: INDEXNOW_KEY,
                    keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
                    urlList: batch,
                }),
            });

            if (res.ok || res.status === 202) {
                totalSubmitted += batch.length;
                console.log(`[IndexNow] Submitted ${batch.length} URLs`);
            } else {
                console.warn(`[IndexNow] Failed: ${res.status} ${await res.text()}`);
            }
        } catch (err: any) {
            console.error(`[IndexNow] Error:`, err.message);
        }
    }

    return { success: totalSubmitted > 0, submitted: totalSubmitted };
}

/**
 * Ping search engines that the sitemap has been updated.
 * Google deprecated this in 2023 but Bing still supports it.
 */
export async function pingSitemaps(): Promise<void> {
    const sitemapUrl = encodeURIComponent(`${BASE_URL}/sitemap_index.xml`);

    const targets = [
        // Google deprecated ping but it's harmless to try
        `https://www.google.com/ping?sitemap=${sitemapUrl}`,
        // Bing still supports ping
        `https://www.bing.com/ping?sitemap=${sitemapUrl}`,
    ];

    for (const url of targets) {
        try {
            const res = await fetch(url, { method: 'GET' });
            console.log(`[SitemapPing] ${url} → ${res.status}`);
        } catch (err: any) {
            console.warn(`[SitemapPing] ${url} → failed: ${err.message}`);
        }
    }
}

/**
 * Notify search engines about newly-indexable URLs.
 * Call this after content pipeline generates new pages.
 */
export async function notifyNewIndexableUrls(slugs: string[]): Promise<void> {
    if (slugs.length === 0) return;

    const urls = slugs.map(s => `${BASE_URL}/${s}`);

    // IndexNow for instant discovery
    await submitToIndexNow(urls);

    // Ping sitemaps for broader discovery
    await pingSitemaps();

    console.log(`[Discovery] Notified engines about ${urls.length} new URLs`);
}
