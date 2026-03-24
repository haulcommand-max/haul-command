/**
 * Haul Command — Queue System
 *
 * "Queue everything non-critical."
 * Off main request cycle: ingestion, scoring, analytics, agent decisions.
 *
 * Architecture:
 * - Primary: Supabase queue table (no external deps, works on Vercel)
 * - Pattern: fire-and-forget + cron-processed workers
 * - Upgrade path: swap for BullMQ/Upstash when volume demands
 */

export type QueueJob =
  | { type: 'ingestion';    data: Record<string, unknown> }
  | { type: 'scoring';      loadId: string }
  | { type: 'analytics';    event: string; payload: Record<string, unknown> }
  | { type: 'agent_action'; action: string; context: Record<string, unknown> }
  | { type: 'email';        to: string; template: string; vars: Record<string, unknown> }
  | { type: 'match';        loadId: string; escortIds: string[] };

export interface QueueEntry {
  id?: string;
  job_type: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'processing' | 'done' | 'failed';
  attempts: number;
  scheduled_at?: string;
  processed_at?: string;
  error?: string;
  created_at?: string;
}

// ─── In-memory fallback queue (for edge runtime / tests) ──────
const memQueue: QueueEntry[] = [];

// ─── Primary queue: Supabase-backed ───────────────────────────
/**
 * Add a job to the queue. Fire-and-forget — never blocks response.
 * Uses Supabase by default; falls back to in-memory for edge.
 */
export async function queue(
  job: QueueJob,
  opts?: { delayMs?: number; priority?: number }
): Promise<void> {
  const entry: QueueEntry = {
    job_type: job.type,
    payload: job as unknown as Record<string, unknown>,
    status: 'pending',
    attempts: 0,
    scheduled_at: opts?.delayMs
      ? new Date(Date.now() + opts.delayMs).toISOString()
      : new Date().toISOString(),
  };

  // Non-blocking: don't await, don't throw, don't block response
  Promise.resolve().then(async () => {
    try {
      // Dynamic import to avoid edge runtime issues with Supabase SSR
      const { supabaseServer } = await import('@/lib/supabase-server');
      const sb = supabaseServer();
      await sb.from('job_queue').insert(entry);
    } catch {
      // Fallback: in-memory (will be lost on function restart, but won't crash)
      memQueue.push(entry);
    }
  });
}

// ─── Convenience wrappers ──────────────────────────────────────

export const queues = {
  /** Ingest a scraped load into the normalization pipeline */
  ingest: (data: Record<string, unknown>) =>
    queue({ type: 'ingestion', data }),

  /** Re-score a load after data changes */
  score: (loadId: string) =>
    queue({ type: 'scoring', loadId }),

  /** Track an analytics event off cycle */
  analytics: (event: string, payload: Record<string, unknown>) =>
    queue({ type: 'analytics', event, payload }),

  /** Trigger an autonomous agent action */
  agent: (action: string, context: Record<string, unknown>) =>
    queue({ type: 'agent_action', action, context }),

  /** Send an email via template */
  email: (to: string, template: string, vars: Record<string, unknown> = {}) =>
    queue({ type: 'email', to, template, vars }),

  /** Try to match a load to available escorts */
  match: (loadId: string, escortIds: string[] = []) =>
    queue({ type: 'match', loadId, escortIds }),
};
