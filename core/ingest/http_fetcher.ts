
import axios from 'axios';
import * as cheerio from 'cheerio';
import { randomUserAgent } from './utils'; // We will create this

interface FetchResult {
    success: boolean;
    statusCode?: number;
    html?: string;
    error?: string;
    rateLimited?: boolean;
}

export class HttpFetcher {
    private timeoutMs: number;

    constructor(timeoutMs = 10000) {
        this.timeoutMs = timeoutMs;
    }

    async fetch(url: string): Promise<FetchResult> {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': randomUserAgent(),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                },
                timeout: this.timeoutMs,
                validateStatus: (status) => status < 500 // Resolve even on 404/403 to handle logic
            });

            if (response.status === 429) {
                return { success: false, statusCode: 429, rateLimited: true, error: 'Rate Limited' };
            }

            if (response.status === 403) {
                return { success: false, statusCode: 403, error: 'Access Denied (Likely Bot Block)' };
            }

            return {
                success: true,
                statusCode: response.status,
                html: response.data
            };

        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                statusCode: error.response?.status
            };
        }
    }

    // Quick check if HTML looks like a JS shell or requires Browser
    needsBrowser(html: string): boolean {
        if (!html) return true;

        const $ = cheerio.load(html);
        const bodyText = $('body').text().trim();
        const scripts = $('script').length;

        // Classic "You need to enable JavaScript" trap
        if (bodyText.includes('enable JavaScript') || bodyText.includes('You need to enable JavaScript')) {
            return true;
        }

        // SPA Shell Detection: Little text, many scripts, div#root or similar
        if (bodyText.length < 500 && scripts > 3) {
            // Further heuristic: check for common SPA roots
            if ($('#app').length > 0 || $('#root').length > 0 || $('#__next').length > 0) {
                return true;
            }
        }

        return false;
    }
}
