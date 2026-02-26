
import { chromium, Browser, Page } from 'playwright';
import { randomUserAgent } from './utils';

interface BrowserResult {
    success: boolean;
    html?: string;
    screenshotPath?: string;
    error?: string;
}

export class PlaywrightWorker {
    private browser: Browser | null = null;

    async init() {
        if (!this.browser) {
            this.browser = await chromium.launch({ headless: true }); // Headless for production
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    async fetchPage(url: string, waitForSelector?: string): Promise<BrowserResult> {
        if (!this.browser) await this.init();

        const context = await this.browser!.newContext({
            userAgent: randomUserAgent(),
            viewport: { width: 1280, height: 800 }
        });
        const page = await context.newPage();

        try {
            await page.goto(url, { timeout: 60000, waitUntil: 'domcontentloaded' });

            if (waitForSelector) {
                try {
                    await page.waitForSelector(waitForSelector, { timeout: 10000 });
                } catch (e) {
                    console.warn(`Selector ${waitForSelector} not found, continuing...`);
                }
            } else {
                // Generic wait for network idle if no specific selector
                await page.waitForLoadState('networkidle');
            }

            const html = await page.content();
            return { success: true, html };

        } catch (error: any) {
            const screenshotPath = `logs/error_${Date.now()}.png`;
            try {
                await page.screenshot({ path: screenshotPath });
            } catch (err) {
                console.error('Failed to take error screenshot');
            }
            return {
                success: false,
                error: error.message,
                screenshotPath
            };
        } finally {
            await page.close();
            await context.close();
        }
    }
}
