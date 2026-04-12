// =====================================================================
// Haul Command Command Layer — Heartbeat Client Library
// Import this into any edge function or API route to report work
// through the Command Layer heartbeat protocol.
//
// Usage:
//   import { CommandHeartbeat } from '@/lib/command-heartbeat';
//   const hb = new CommandHeartbeat('search-indexer', 'hb-search-indexer');
//   const runId = await hb.start();
//   try {
//     // ... do work ...
//     await hb.complete(runId, { entities_processed: 42 });
//   } catch (err) {
//     await hb.fail(runId, err.message);
//   }
// =====================================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface HeartbeatStartResult {
  run_id: string;
  agent_id: string;
}

interface HeartbeatCompleteOptions {
  cost_cents?: number;
  revenue_cents?: number;
  leads_generated?: number;
  entities_processed?: number;
  pages_published?: number;
  notifications_sent?: number;
  result?: Record<string, unknown> | null;
}

export class CommandHeartbeat {
  private agentSlug: string;
  private heartbeatSlug: string | null;
  private supabase: SupabaseClient;
  private baseUrl: string;

  constructor(
    agentSlug: string,
    heartbeatSlug?: string,
    options?: { supabase?: SupabaseClient; baseUrl?: string }
  ) {
    this.agentSlug = agentSlug;
    this.heartbeatSlug = heartbeatSlug ?? null;

    // Use provided supabase client or create one
    this.supabase = options?.supabase ?? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.baseUrl = options?.baseUrl ?? (
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
      'http://localhost:3000'
    );
  }

  /**
   * Start a run. Call this at the beginning of the agent's work.
   * Returns a run_id that must be passed to complete() or fail().
   */
  async start(options?: {
    provider?: string;
    model?: string;
    task_id?: string;
  }): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/command/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_slug: this.agentSlug,
          heartbeat_slug: this.heartbeatSlug,
          action: 'start',
          provider: options?.provider ?? 'worker',
          model: options?.model ?? 'worker',
          task_id: options?.task_id,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        console.error(`[CommandHeartbeat] start failed for ${this.agentSlug}:`, errBody);
        // Don't throw — heartbeat failures shouldn't block work
        return '';
      }

      const data = await response.json();
      return data.run_id ?? '';
    } catch (err) {
      console.error(`[CommandHeartbeat] start error for ${this.agentSlug}:`, err);
      return '';
    }
  }

  /**
   * Report successful work completion.
   */
  async complete(runId: string, options?: HeartbeatCompleteOptions): Promise<void> {
    if (!runId) return; // Silently skip if start failed

    try {
      await fetch(`${this.baseUrl}/api/command/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_slug: this.agentSlug,
          heartbeat_slug: this.heartbeatSlug,
          action: 'complete',
          run_id: runId,
          cost_cents: options?.cost_cents ?? 0,
          revenue_cents: options?.revenue_cents ?? 0,
          leads_generated: options?.leads_generated ?? 0,
          entities_processed: options?.entities_processed ?? 0,
          pages_published: options?.pages_published ?? 0,
          notifications_sent: options?.notifications_sent ?? 0,
          result: options?.result ?? null,
        }),
      });
    } catch (err) {
      console.error(`[CommandHeartbeat] complete error for ${this.agentSlug}:`, err);
    }
  }

  /**
   * Report a failure.
   */
  async fail(runId: string, errorMessage: string, options?: {
    cost_cents?: number;
    entities_processed?: number;
  }): Promise<void> {
    if (!runId) return;

    try {
      await fetch(`${this.baseUrl}/api/command/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_slug: this.agentSlug,
          heartbeat_slug: this.heartbeatSlug,
          action: 'fail',
          run_id: runId,
          error_message: errorMessage,
          cost_cents: options?.cost_cents ?? 0,
          entities_processed: options?.entities_processed ?? 0,
        }),
      });
    } catch (err) {
      console.error(`[CommandHeartbeat] fail error for ${this.agentSlug}:`, err);
    }
  }

  /**
   * Check in to see assigned tasks (Paperclip: task checkout).
   * Returns available work for this agent.
   */
  async checkin(): Promise<{
    assigned_tasks: any[];
    available_tasks: any[];
    pending_approvals: any[];
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/command/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_slug: this.agentSlug,
          action: 'checkin',
        }),
      });

      if (!response.ok) {
        return { assigned_tasks: [], available_tasks: [], pending_approvals: [] };
      }

      return await response.json();
    } catch (err) {
      console.error(`[CommandHeartbeat] checkin error for ${this.agentSlug}:`, err);
      return { assigned_tasks: [], available_tasks: [], pending_approvals: [] };
    }
  }

  /**
   * Direct DB write — use when the API isn't available (e.g., edge functions).
   * Writes directly to hc_command_runs via Supabase.
   */
  async startDirect(options?: { provider?: string; model?: string }): Promise<string> {
    try {
      // Lookup agent
      const { data: agent } = await this.supabase
        .from('hc_command_agents')
        .select('id')
        .eq('slug', this.agentSlug)
        .single();

      if (!agent) return '';

      // Lookup heartbeat
      let heartbeatId: string | null = null;
      if (this.heartbeatSlug) {
        const { data: hb } = await this.supabase
          .from('hc_command_heartbeats')
          .select('id')
          .eq('slug', this.heartbeatSlug)
          .single();
        heartbeatId = hb?.id ?? null;
      }

      // Create run
      const { data: run } = await this.supabase
        .from('hc_command_runs')
        .insert({
          agent_id: agent.id,
          heartbeat_id: heartbeatId,
          status: 'running',
          provider: options?.provider ?? 'worker',
          model: options?.model ?? 'worker',
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      return run?.id ?? '';
    } catch (err) {
      console.error(`[CommandHeartbeat] startDirect error:`, err);
      return '';
    }
  }

  /**
   * Direct DB write — complete a run via Supabase RPC.
   */
  async completeDirect(runId: string, options?: HeartbeatCompleteOptions): Promise<void> {
    if (!runId) return;

    try {
      await this.supabase.rpc('command_complete_run', {
        p_run_id: runId,
        p_status: 'completed',
        p_cost_cents: options?.cost_cents ?? 0,
        p_revenue_cents: options?.revenue_cents ?? 0,
        p_leads: options?.leads_generated ?? 0,
        p_entities_processed: options?.entities_processed ?? 0,
        p_pages_published: options?.pages_published ?? 0,
        p_result: options?.result ?? null,
        p_error_message: null,
      });
    } catch (err) {
      console.error(`[CommandHeartbeat] completeDirect error:`, err);
    }
  }

  /**
   * Direct DB write — report failure via Supabase RPC.
   */
  async failDirect(runId: string, errorMessage: string): Promise<void> {
    if (!runId) return;

    try {
      await this.supabase.rpc('command_complete_run', {
        p_run_id: runId,
        p_status: 'failed',
        p_cost_cents: 0,
        p_revenue_cents: 0,
        p_leads: 0,
        p_entities_processed: 0,
        p_pages_published: 0,
        p_result: null,
        p_error_message: errorMessage,
      });
    } catch (err) {
      console.error(`[CommandHeartbeat] failDirect error:`, err);
    }
  }
}

/**
 * Convenience: wrap an async function with automatic heartbeat tracking.
 *
 * Usage:
 *   const result = await withHeartbeat('search-indexer', 'hb-search-indexer', async () => {
 *     const processed = await doSearchIndexing();
 *     return { entities_processed: processed };
 *   });
 */
export async function withHeartbeat<T extends HeartbeatCompleteOptions>(
  agentSlug: string,
  heartbeatSlug: string | undefined,
  fn: () => Promise<T>,
  options?: { provider?: string; model?: string; useDirect?: boolean }
): Promise<T> {
  const hb = new CommandHeartbeat(agentSlug, heartbeatSlug);

  const runId = options?.useDirect
    ? await hb.startDirect(options)
    : await hb.start(options);

  try {
    const result = await fn();

    if (options?.useDirect) {
      await hb.completeDirect(runId, result);
    } else {
      await hb.complete(runId, result);
    }

    return result;
  } catch (err: any) {
    if (options?.useDirect) {
      await hb.failDirect(runId, err.message ?? 'Unknown error');
    } else {
      await hb.fail(runId, err.message ?? 'Unknown error');
    }
    throw err; // Re-throw so the caller sees the error
  }
}
