import { NextRequest, NextResponse } from 'next/server';
import { processCrawlJob } from '../../../../lib/ingestion/global-crawler';
import { aiExtractFromText, AgentExtractionResult } from '../../../../lib/ingestion/ai-extractor';
import { matchAndInsertEntity } from '../../../../lib/ingestion/dedupe-engine';
import { createAdminClient } from '../../../../lib/supabase/admin';

// Vercel max duration for Cron
export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
    try {
        const supabase = createAdminClient();

        // 1. Fetch pending crawl jobs from the queue (limit 5 for time)
        const { data: jobs, error } = await supabase
            .from('crawl_queue')
            .select('*')
            .eq('status', 'pending')
            .order('priority', { ascending: false })
            .limit(5);

        if (error || !jobs || jobs.length === 0) {
            return NextResponse.json({ message: 'No pending jobs.' });
        }

        const results = [];

        // 2. Process each job
        for (const job of jobs) {
            console.log(`[CRAWLER] Processing URL: ${job.url}`);
            const result = await processCrawlJob(job.id);
            
            if (result && result.success && result.text) {
                // 3. Extract with Gemini Pro 2.5
                console.log(`[EXTRACTOR] Analyzing content: ${job.url}`);
                const extraction: AgentExtractionResult | null = await aiExtractFromText(result.text, job.url);
                
                if (extraction && extraction.entities.length > 0) {
                    console.log(`[DEDUPE] Extracted ${extraction.entities.length} entities. Merging...`);
                    // 4. Run Deduplication + Matching logic
                    await matchAndInsertEntity(extraction, job.url);
                }

                results.push({
                    url: job.url,
                    linksFound: result.outboundLinks.length,
                    entitiesFound: extraction?.entities.length || 0
                });
            } else {
                results.push({ url: job.url, success: false });
            }
        }

        return NextResponse.json({ message: 'Crawl batch complete', results });
    } catch (e: any) {
        console.error('Extraction Error:', e);
        return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
}
