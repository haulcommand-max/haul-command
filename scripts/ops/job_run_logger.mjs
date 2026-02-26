/**
 * Job Run Logger — writes structured execution records to ops_job_runs.
 *
 * Usage in data-jobs:
 *   import { JobRunLogger } from '../ops/job_run_logger.mjs';
 *   const logger = new JobRunLogger('corridor-liquidity-refresh');
 *   await logger.start();
 *   // ... do work ...
 *   await logger.finish('success', rowsWritten);
 *   // or on error:
 *   await logger.finish('fail', 0, error.message);
 */

import { createClient } from '@supabase/supabase-js';

export class JobRunLogger {
    constructor(jobName) {
        this.jobName = jobName;
        this.startedAt = null;
        this.supabase = null;
        this.sha = process.env.GITHUB_SHA?.slice(0, 7) || process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local';
    }

    _init() {
        if (this.supabase) return;
        const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) {
            console.warn(`[JobRunLogger] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — logging disabled`);
            return;
        }
        this.supabase = createClient(url, key);
    }

    async start() {
        this.startedAt = new Date();
        console.log(`[${this.jobName}] Starting at ${this.startedAt.toISOString()}`);
    }

    /**
     * @param {'success'|'fail'|'partial'} status
     * @param {number} rowsWritten
     * @param {string} [errorMsg]
     * @param {Record<string,any>} [meta]
     */
    async finish(status, rowsWritten = 0, errorMsg = null, meta = null) {
        const finishedAt = new Date();
        const durationMs = this.startedAt ? finishedAt - this.startedAt : 0;

        console.log(`[${this.jobName}] Finished: status=${status} rows=${rowsWritten} duration=${durationMs}ms`);
        if (errorMsg) console.error(`[${this.jobName}] Error: ${errorMsg}`);

        this._init();
        if (!this.supabase) return;

        const record = {
            job_name: this.jobName,
            status,
            started_at: this.startedAt?.toISOString(),
            finished_at: finishedAt.toISOString(),
            rows_written: rowsWritten,
            duration_ms: durationMs,
            sha: this.sha,
            meta: {
                ...(meta || {}),
                ...(errorMsg ? { error: errorMsg } : {}),
            },
        };

        const { error } = await this.supabase.from('ops_job_runs').insert(record);
        if (error) {
            // Fallback: try cron_runs table (legacy)
            console.warn(`[JobRunLogger] ops_job_runs insert failed (${error.message}), trying cron_runs`);
            await this.supabase.from('cron_runs').insert({
                job_name: this.jobName,
                started_at: record.started_at,
                finished_at: record.finished_at,
                status: record.status,
                items_processed: rowsWritten,
                metadata: record.meta,
            });
        }
    }
}
