
import { HttpFetcher } from './http_fetcher';
import { PlaywrightWorker } from './playwright_worker';

export interface IngestJob {
    id: string;
    url: string;
    sourceId: string;
    requiredFields: string[]; // Simplistic validation for now
}

export class IngestionManager {
    private httpFetcher: HttpFetcher;
    private playwrightWorker: PlaywrightWorker;

    constructor() {
        this.httpFetcher = new HttpFetcher();
        this.playwrightWorker = new PlaywrightWorker();
    }

    async processJob(job: IngestJob) {
        console.log(`[Ingest] Processing Job ${job.id}: ${job.url}`);

        // Step 1: Try HTTP (Fast Path)
        const httpResult = await this.httpFetcher.fetch(job.url);

        if (httpResult.success && httpResult.html) {
            // Check if we need browser (JS trap or SPA)
            if (!this.httpFetcher.needsBrowser(httpResult.html)) {
                console.log(`[Ingest] HTTP Success for ${job.url}`);
                return {
                    status: 'success',
                    method: 'http',
                    html: httpResult.html
                };
            }
            console.log(`[Ingest] JS/Browser required for ${job.url}. Upgrading to Playwright...`);
        } else {
            console.log(`[Ingest] HTTP Failed (${httpResult.statusCode}). Upgrading to Playwright...`);
        }

        // Step 2: Playwright (Slow Path)
        const pwResult = await this.playwrightWorker.fetchPage(job.url);
        if (pwResult.success) {
            console.log(`[Ingest] Playwright Success for ${job.url}`);
            return {
                status: 'success',
                method: 'playwright',
                html: pwResult.html
            };
        }

        console.error(`[Ingest] Job Failed: ${pwResult.error}`);
        return {
            status: 'failed',
            error: pwResult.error,
            screenshot: pwResult.screenshotPath
        };
    }

    async shutdown() {
        await this.playwrightWorker.close();
    }
}
