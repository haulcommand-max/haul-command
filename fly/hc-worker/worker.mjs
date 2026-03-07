/**
 * HC-WORKER — Fly.io Background Worker
 * 
 * Architecture: Polls Supabase hc_queue via SKIP LOCKED pattern.
 * Handles: crawlers, enrichment, scoring, media pipeline, digest flush, push delivery.
 * 
 * This is the "always-on" worker that replaces edge function cron limitations.
 */

import http from 'node:http';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS || '5000');
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10');

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
}

// ═══ Supabase RPC helper ═══
async function rpc(fnName, params = {}) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify(params),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`RPC ${fnName} failed: ${res.status} ${text}`);
    }
    return res.json();
}

// ═══ Job Handlers ═══
const handlers = {
    PUSH_DELIVER: async (payload) => {
        console.log(`📱 Push delivery: ${payload.notification_id}`);
        // TODO: Wire to Firebase Admin SDK
        // admin.messaging().send({ token, notification: { title, body } })
        return { status: 'delivered' };
    },

    MATCH_SCORE_BUILD: async (payload) => {
        console.log(`🎯 Building match scores for load ${payload.load_id}`);
        // TODO: Call hc_match_candidates() and create offers
        return { status: 'scored' };
    },

    TRUST_RECALC: async (payload) => {
        console.log(`🔒 Trust recalc batch`);
        await rpc('hc_trust_recalc_batch', { p_country_code: null, p_limit: 100 });
        return { status: 'recalculated' };
    },

    SEO_REPUBLISH: async (payload) => {
        console.log(`🌐 SEO republish: ${payload.entity_type}/${payload.entity_id}`);
        // Regenerate and publish the SEO page
        return { status: 'republished' };
    },

    LEADERBOARD_RECALC: async (payload) => {
        console.log(`🏆 Leaderboard recalc`);
        await rpc('hc_refresh_leaderboard');
        return { status: 'recalculated' };
    },

    DIGEST_FLUSH: async () => {
        console.log(`📬 Flushing notification digests`);
        const count = await rpc('hc_digest_flush');
        return { status: 'flushed', count };
    },

    COUNTRY_ROLLUP: async () => {
        console.log(`🌍 Country rollup refresh`);
        await rpc('hc_country_rollup_refresh');
        return { status: 'refreshed' };
    },

    SEO_DAILY_BUNDLE: async (payload) => {
        console.log(`📄 SEO daily bundle: ${payload?.country_code || 'all'}`);
        await rpc('hc_seo_daily_bundle');
        return { status: 'bundled' };
    },

    CRAWL_DISCOVERY: async (payload) => {
        console.log(`🕷️ Crawl discovery: ${payload?.source || 'unknown'}`);
        // TODO: Wire to crawl engine
        return { status: 'crawled' };
    },

    ENRICHMENT_BATCH: async (payload) => {
        console.log(`🧬 Enrichment batch: ${payload?.count || 0} records`);
        // TODO: Wire to enrichment engine
        return { status: 'enriched' };
    },

    LISTMONK_SYNC: async () => {
        console.log(`📧 Listmonk sync`);
        // TODO: Sync subscriber lists to Listmonk
        return { status: 'synced' };
    },

    REQUEST_REVIEW: async (payload) => {
        console.log(`⭐ Review request for operator ${payload.subject_id}`);
        if (payload.subject_id) {
            await rpc('hc_push_throttled', {
                p_profile_id: payload.subject_id,
                p_notif_type: 'review_request',
                p_title: '⭐ How was your last job?',
                p_body: 'Leave a quick review to help the community.',
                p_topic_key: 'review_request',
                p_payload: payload,
            });
        }
        return { status: 'requested' };
    },

    // ═══ New: Corridor + Page Factory + OSM Jobs ═══
    CORRIDOR_SCORE_ALL: async () => {
        console.log(`🛤️ Scoring all corridors`);
        const result = await rpc('hc_corridor_score_all');
        return { status: 'scored', ...result };
    },

    CORRIDOR_ENRICH_INFRA: async () => {
        console.log(`🏗️ Enriching corridors with infrastructure data`);
        const result = await rpc('hc_corridor_enrich_infrastructure');
        return { status: 'enriched', ...result };
    },

    CORRIDOR_SNAPSHOT: async (payload) => {
        console.log(`📸 Building corridor snapshot`);
        const result = await rpc('hc_corridor_snapshot_build', {
            p_week_start: payload?.week_start || undefined,
        });
        return { status: 'snapshot_built', ...result };
    },

    SURFACE_ROLLUP: async () => {
        console.log(`📊 Refreshing surface rollups`);
        const result = await rpc('hc_surface_rollup_all');
        return { status: 'rolled_up', countries: result?.length || 0 };
    },

    SURFACE_SCORE: async (payload) => {
        console.log(`⭐ Scoring surfaces for ${payload?.country_code || 'ALL'}`);
        const result = await rpc('hc_surface_score_country', {
            p_country: payload?.country_code,
        });
        return { status: 'scored', ...result };
    },

    OSM_CRAWL: async (payload) => {
        console.log(`🌍 OSM crawl: ${payload?.country_code} / ${payload?.surface_type}`);
        // Uses the hc_surface_upsert_from_overpass RPC
        // The actual Overpass query would be run here externally
        return { status: 'queued_for_crawl', ...payload };
    },
};

// ═══ Queue Poller ═══
async function pollQueue() {
    let totalProcessedThisPoll = 0;

    // Try legacy queue (hc_queue_dequeue)
    try {
        const jobs = await rpc('hc_queue_dequeue', { p_batch_size: BATCH_SIZE });
        if (jobs && jobs.length > 0) {
            for (const job of jobs) {
                const handler = handlers[job.job_type];
                if (!handler) {
                    console.warn(`⚠️ Unknown job type: ${job.job_type}`);
                    await rpc('hc_queue_fail', { p_job_id: job.job_id, p_error: `Unknown job type: ${job.job_type}` });
                    continue;
                }
                try {
                    await handler(job.payload || {});
                    await rpc('hc_queue_complete', { p_job_id: job.job_id });
                    totalProcessedThisPoll++;
                    console.log(`✅ ${job.job_type} completed (${job.job_id})`);
                } catch (err) {
                    console.error(`❌ ${job.job_type} failed: ${err.message}`);
                    await rpc('hc_queue_fail', { p_job_id: job.job_id, p_error: err.message });
                }
            }
        }
    } catch (err) {
        // Legacy queue may not exist yet — that's OK
        if (!err.message.includes('does not exist')) {
            console.error(`❌ Legacy poll error: ${err.message}`);
        }
    }

    // Try new queue (hc_job_claim)
    try {
        const jobs = await rpc('hc_job_claim', { p_batch: BATCH_SIZE });
        if (jobs && jobs.length > 0) {
            for (const job of jobs) {
                const handler = handlers[job.job_type];
                if (!handler) {
                    console.warn(`⚠️ Unknown hc_jobs type: ${job.job_type}`);
                    await rpc('hc_job_finish', { p_job_id: job.id, p_success: false, p_result: { error: 'unknown type' } });
                    continue;
                }
                try {
                    const result = await handler(job.payload || {});
                    await rpc('hc_job_finish', { p_job_id: job.id, p_success: true, p_result: result || {} });
                    totalProcessedThisPoll++;
                    console.log(`✅ [hc_jobs] ${job.job_type} completed (${job.id})`);
                } catch (err) {
                    console.error(`❌ [hc_jobs] ${job.job_type} failed: ${err.message}`);
                    await rpc('hc_job_finish', { p_job_id: job.id, p_success: false, p_result: { error: err.message } });
                }
            }
        }
    } catch (err) {
        if (!err.message.includes('does not exist')) {
            console.error(`❌ New queue poll error: ${err.message}`);
        }
    }

    return totalProcessedThisPoll;
}

// ═══ Scheduled Jobs (cron-like) ═══
let lastDigestFlush = 0;
let lastCountryRollup = 0;
let lastCorridorScore = 0;
let lastSurfaceRollup = 0;

async function runScheduled() {
    const now = Date.now();

    // Flush digests every 15 minutes
    if (now - lastDigestFlush > 15 * 60 * 1000) {
        try {
            await handlers.DIGEST_FLUSH();
            lastDigestFlush = now;
        } catch (e) { console.error('Digest flush error:', e.message); }
    }

    // Country rollup every 6 hours
    if (now - lastCountryRollup > 6 * 60 * 60 * 1000) {
        try {
            await handlers.COUNTRY_ROLLUP();
            lastCountryRollup = now;
        } catch (e) { console.error('Country rollup error:', e.message); }
    }

    // Corridor scoring every hour
    if (now - lastCorridorScore > 60 * 60 * 1000) {
        try {
            await handlers.CORRIDOR_SCORE_ALL();
            await handlers.CORRIDOR_ENRICH_INFRA();
            lastCorridorScore = now;
        } catch (e) { console.error('Corridor score error:', e.message); }
    }

    // Surface rollup refresh every 3 hours
    if (now - lastSurfaceRollup > 3 * 60 * 60 * 1000) {
        try {
            await handlers.SURFACE_ROLLUP();
            lastSurfaceRollup = now;
        } catch (e) { console.error('Surface rollup error:', e.message); }
    }
}

// ═══ Main Loop ═══
let running = true;
let totalProcessed = 0;
const startTime = Date.now();

async function mainLoop() {
    console.log(`🚀 HC-WORKER started | Poll: ${POLL_INTERVAL}ms | Batch: ${BATCH_SIZE}`);

    while (running) {
        const count = await pollQueue();
        totalProcessed += count;
        await runScheduled();
        await new Promise(r => setTimeout(r, count > 0 ? 100 : POLL_INTERVAL));
    }
}

// ═══ Health Check Server ═══
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
            total_processed: totalProcessed,
            version: '1.0.0',
        }));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(8080, () => {
    console.log('🏥 Health check on :8080');
    mainLoop().catch(err => {
        console.error('💀 Fatal:', err);
        process.exit(1);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => { running = false; server.close(); });
process.on('SIGINT', () => { running = false; server.close(); });
