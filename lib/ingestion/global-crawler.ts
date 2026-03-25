import { load } from 'cheerio';
import crypto from 'crypto';
import { createAdminClient } from '../supabase/admin';

export interface CrawlResult {
    url: string;
    html: string;
    text: string;
    outboundLinks: string[];
    title: string;
    success: boolean;
    error?: string;
}

/**
 * Normalizes a URL to prevent duplicate crawls (removes hash, query parsing, trailing slash)
 */
export function normalizeUrl(targetUrl: string): string {
    try {
        const u = new URL(targetUrl);
        u.hash = ''; // Remove fragments
        // Remove tracking query params
        const paramsToKeep = ['p', 'page', 'id', 'category'];
        for (const key of Array.from(u.searchParams.keys())) {
            if (!paramsToKeep.includes(key.toLowerCase())) {
                u.searchParams.delete(key);
            }
        }
        let clean = u.toString().toLowerCase();
        if (clean.endsWith('/')) {
            clean = clean.slice(0, -1);
        }
        return clean;
    } catch {
        return targetUrl; // Fallback
    }
}

/**
 * Fetches the URL, parses with Cheerio to extract links and clean text
 */
export async function crawlPage(targetUrl: string): Promise<CrawlResult> {
    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 HaulCommandBot/1.0',
            },
            signal: AbortSignal.timeout(15000), // 15 sec timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        const $ = load(html);
        const title = $('title').text().trim();

        // Remove noise
        $('script, style, noscript, iframe, img, svg, header, footer, nav').remove();
        const text = $('body').text().replace(/\s+/g, ' ').trim();

        // Extract outbound links
        const outboundLinks: string[] = [];
        const baseUrl = new URL(targetUrl);

        $('a[href]').each((_, el) => {
            let href = $(el).attr('href');
            if (!href) return;
            
            // Resolve relative URLs
            try {
                if (href.startsWith('/')) {
                    href = new URL(href, baseUrl.origin).toString();
                } else if (!href.startsWith('http')) {
                    return; // Skip tel:, mailto:, javascript: etc (handled in extraction)
                }

                const normalized = normalizeUrl(href);
                // Basic filtering map
                if (
                    normalized.includes('twitter.com') ||
                    normalized.includes('facebook.com') ||
                    normalized.includes('linkedin.com') ||
                    normalized.includes('instagram.com') ||
                    normalized.includes('youtube.com')
                ) {
                    outboundLinks.push(normalized); // Keep social links for later graph extraction
                } else if (!outboundLinks.includes(normalized)) {
                    outboundLinks.push(normalized);
                }
            } catch (err) {
                // ignore invalid links
            }
        });

        return {
            url: targetUrl,
            html,
            text,
            outboundLinks,
            title,
            success: true,
        };
    } catch (error: any) {
        return {
            url: targetUrl,
            html: '',
            text: '',
            outboundLinks: [],
            title: '',
            success: false,
            error: error?.message || 'Unknown crawl error',
        };
    }
}

/**
 * Orchestrates a queue item: fetches, updates state, writes new discovered links.
 */
export async function processCrawlJob(queueId: string) {
    const supabase = createAdminClient();

    // 1. Lock job
    const { data: job, error: updateErr } = await supabase
        .from('crawl_queue')
        .update({ status: 'crawling' })
        .eq('id', queueId)
        .eq('status', 'pending')
        .select('*')
        .single();
        
    if (updateErr || !job) {
        console.warn(`Job ${queueId} unavailable or already running.`);
        return null;
    }

    // 2. Crawl
    const result = await crawlPage(job.url);

    if (!result.success) {
        await supabase
            .from('crawl_queue')
            .update({ status: 'failed', updated_at: new Date().toISOString() })
            .eq('id', queueId);
        return null;
    }

    // 3. Mark Done
    await supabase
        .from('crawl_queue')
        .update({ status: 'done', updated_at: new Date().toISOString() })
        .eq('id', queueId);

    // 4. Push Discovered Links (if depth < max_depth)
    if (job.depth < 3) {
        const toInsert = result.outboundLinks.map((url) => ({
            url,
            status: 'pending',
            depth: job.depth + 1,
            discovered_from: job.url,
            priority: job.priority + 1,
        }));
        
        // Upsert ignoring dupes (ON CONFLICT DO NOTHING relies on postgres but supabase JS does it via upsert config)
        if (toInsert.length > 0) {
            // Chunked to avoid limits
            const chunks = [];
            for (let i = 0; i < toInsert.length; i += 100) {
                chunks.push(toInsert.slice(i, i + 100));
            }
            for (const chunk of chunks) {
                await supabase.from('crawl_queue').upsert(chunk, { onConflict: 'url', ignoreDuplicates: true });
            }
        }
    }

    return result;
}
