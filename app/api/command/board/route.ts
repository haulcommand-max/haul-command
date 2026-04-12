// =====================================================================
// Haul Command Command Layer — Board API
// GET  /api/command/board → Full board dashboard
// POST /api/command/board → Execute board actions (approve, pause, invoke)
//
// Paperclip equivalent: Dashboard + Activity Log + Costs + Approvals
// HC adaptation: Industry-aware board with revenue tracking + proof status
// =====================================================================
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── GET: Full Board Dashboard ───────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel queries for maximum speed — 11 parallel queries
    const [
      agentsRes,
      heartbeatsRes,
      pendingApprovalsRes,
      recentRunsRes,
      taskStatsRes,
      moneyStatsRes,
      readinessRes,
      osEventsRes,
      marketStatesRes,
      coverageGapsRes,
      moneyDashboardRes,
    ] = await Promise.all([
      // 1. Agent roster with status rollup
      supabase
        .from('hc_command_agents')
        .select('*')
        .order('domain', { ascending: true }),

      // 2. Heartbeat definitions with last run
      supabase
        .from('hc_command_heartbeats')
        .select('*, hc_command_agents(slug, name, domain)')
        .order('enabled', { ascending: false }),

      // 3. Pending approvals (board action queue)
      supabase
        .from('hc_command_approvals')
        .select('*, hc_command_agents(slug, name), hc_command_tasks(title, domain)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50),

      // 4. Recent runs (last 100)
      supabase
        .from('hc_command_runs')
        .select('*, hc_command_agents(slug, name, domain)')
        .order('started_at', { ascending: false })
        .limit(100),

      // 5. Task statistics by status
      supabase.rpc('command_task_stats'),

      // 6. Money event rollup (30 days)
      supabase.rpc('command_money_stats', { p_since: thirtyDaysAgo.toISOString() }),

      // 7. Readiness gates
      supabase
        .from('hc_readiness_gates')
        .select('*')
        .order('gate_category', { ascending: true }),

      // 8. Recent OS events (last 50)
      supabase
        .from('os_event_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),

      // 9. Market mode states (from legacy swarm — now visible in Board)
      supabase
        .from('market_states')
        .select('*')
        .order('mode', { ascending: true }),

      // 10. Unresolved coverage gap alerts
      supabase
        .from('coverage_gap_alerts')
        .select('*')
        .eq('resolved', false)
        .order('severity', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(100),

      // 11. Money dashboard (revenue stream breakdown from triggers)
      supabase
        .from('command_money_dashboard')
        .select('*'),
    ]);

    // Compute agent status rollup
    const agents = agentsRes.data ?? [];
    const agentRollup = {
      total: agents.length,
      active: agents.filter(a => a.status === 'active').length,
      idle: agents.filter(a => a.status === 'idle').length,
      running: agents.filter(a => a.status === 'running').length,
      paused: agents.filter(a => a.status === 'paused').length,
      error: agents.filter(a => a.status === 'error').length,
      terminated: agents.filter(a => a.status === 'terminated').length,
    };

    // Compute domain-level aggregation
    const domainMap = new Map<string, {
      agents: number;
      tasks_completed: number;
      tasks_failed: number;
      revenue_cents: number;
      leads: number;
    }>();

    for (const agent of agents) {
      const existing = domainMap.get(agent.domain) ?? {
        agents: 0, tasks_completed: 0, tasks_failed: 0,
        revenue_cents: 0, leads: 0,
      };
      existing.agents += 1;
      existing.tasks_completed += agent.tasks_completed ?? 0;
      existing.tasks_failed += agent.tasks_failed ?? 0;
      existing.revenue_cents += agent.revenue_generated_cents ?? 0;
      existing.leads += agent.leads_generated ?? 0;
      domainMap.set(agent.domain, existing);
    }

    // Compute heartbeat health
    const heartbeats = heartbeatsRes.data ?? [];
    const staleCutoff = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2h
    const heartbeatHealth = {
      total: heartbeats.length,
      enabled: heartbeats.filter(h => h.enabled).length,
      stale: heartbeats.filter(h =>
        h.enabled && h.last_run_at && new Date(h.last_run_at) < staleCutoff
      ).length,
      never_run: heartbeats.filter(h => h.enabled && !h.last_run_at).length,
    };

    // Compute run success rate
    const runs = recentRunsRes.data ?? [];
    const runStats = {
      total: runs.length,
      completed: runs.filter(r => r.status === 'completed').length,
      failed: runs.filter(r => r.status === 'failed').length,
      running: runs.filter(r => r.status === 'running').length,
      success_rate: runs.length > 0
        ? Math.round((runs.filter(r => r.status === 'completed').length / runs.length) * 100)
        : 100,
      total_cost_cents: runs.reduce((sum, r) => sum + (r.cost_cents ?? 0), 0),
      total_revenue_cents: runs.reduce((sum, r) => sum + (r.revenue_generated_cents ?? 0), 0),
    };

    // Build board response
    const board = {
      timestamp: now.toISOString(),
      system_status: agentRollup.error > 0 ? 'degraded' : 'healthy',

      // Paperclip: Company overview
      company: {
        name: 'Haul Command',
        mission: 'Default operating system for the global heavy haul ecosystem',
        market_scope: '120 countries',
        priority_markets: ['US', 'CA', 'AU'],
      },

      // Paperclip: Agent roster
      agents: {
        rollup: agentRollup,
        by_domain: Object.fromEntries(domainMap),
        roster: agents,
      },

      // Paperclip: Heartbeat health
      heartbeats: {
        health: heartbeatHealth,
        definitions: heartbeats,
      },

      // Paperclip: Task queue
      tasks: taskStatsRes.data ?? { backlog: 0, todo: 0, in_progress: 0, in_review: 0, done: 0, blocked: 0 },

      // Paperclip: Approvals (governance)
      approvals: {
        pending_count: (pendingApprovalsRes.data ?? []).length,
        items: pendingApprovalsRes.data ?? [],
      },

      // Paperclip: Runs (activity log)
      runs: runStats,

      // HC-specific: Money tracking (Paperclip only tracks cost)
      money: moneyStatsRes.data ?? {
        revenue_30d_cents: 0,
        cost_30d_cents: 0,
        net_30d_cents: 0,
        by_type: {},
      },

      // HC-specific: Readiness gates
      readiness: {
        gates: readinessRes.data ?? [],
        all_passing: (readinessRes.data ?? []).every((g: any) => g.is_passing),
      },

      // HC-specific: Recent OS events
      recent_events: (osEventsRes.data ?? []).slice(0, 20),

      // HC-specific: Market mode states (from legacy swarm, now unified)
      market_modes: (() => {
        const markets = marketStatesRes.data ?? [];
        const modes = new Map<string, number>();
        for (const m of markets) {
          modes.set(m.mode, (modes.get(m.mode) ?? 0) + 1);
        }
        return {
          total_markets: markets.length,
          by_mode: Object.fromEntries(modes),
          rescue_markets: markets.filter((m: any) => m.mode === 'rescue').map((m: any) => m.market_key),
          shortage_markets: markets.filter((m: any) => m.mode === 'shortage').map((m: any) => m.market_key),
          live_markets: markets.filter((m: any) => m.mode === 'live').length,
          all: markets,
        };
      })(),

      // HC-specific: Supply gap alerts (unresolved)
      coverage_gaps: (() => {
        const gaps = coverageGapsRes.data ?? [];
        return {
          total_unresolved: gaps.length,
          critical: gaps.filter((g: any) => g.severity === 'critical').length,
          high: gaps.filter((g: any) => g.severity === 'high').length,
          items: gaps.slice(0, 25),
        };
      })(),

      // HC-specific: Revenue streams (real-time from DB triggers)
      revenue_streams: moneyDashboardRes.data ?? [],
    };


    return NextResponse.json(board, { status: 200 });
  } catch (error: any) {
    console.error('[command/board] GET error:', error);
    return NextResponse.json(
      { error: 'Board query failed', details: error.message },
      { status: 500 }
    );
  }
}

// ─── POST: Board Actions ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, target_id, payload } = body;

    switch (action) {
      // Paperclip: Approve/reject pending item
      case 'approve':
      case 'reject': {
        const { data, error } = await supabase
          .from('hc_command_approvals')
          .update({
            status: action === 'approve' ? 'approved' : 'rejected',
            resolved_by: 'william',
            resolution_note: payload?.note ?? null,
            resolved_at: new Date().toISOString(),
          })
          .eq('id', target_id)
          .eq('status', 'pending')
          .select()
          .single();

        if (error) throw error;

        // Log to OS event bus
        await supabase.from('os_event_log').insert({
          event_type: `approval.${action}ed`,
          entity_id: target_id,
          entity_type: 'approval',
          payload: { action, resolved_by: 'william', note: payload?.note },
        });

        return NextResponse.json({ result: 'ok', approval: data });
      }

      // Paperclip: Pause/resume agent
      case 'pause_agent':
      case 'resume_agent': {
        const newStatus = action === 'pause_agent' ? 'paused' : 'active';
        const { data, error } = await supabase
          .from('hc_command_agents')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', target_id)
          .select()
          .single();

        if (error) throw error;

        await supabase.from('os_event_log').insert({
          event_type: `agent.${newStatus}`,
          entity_id: target_id,
          entity_type: 'agent',
          payload: { action, by: 'william' },
        });

        return NextResponse.json({ result: 'ok', agent: data });
      }

      // Paperclip: Manual invoke (heartbeat trigger)
      case 'invoke_heartbeat': {
        const { data: hb, error: hbErr } = await supabase
          .from('hc_command_heartbeats')
          .select('*, hc_command_agents(slug, name)')
          .eq('id', target_id)
          .single();

        if (hbErr) throw hbErr;

        // Create a run record
        const { data: run, error: runErr } = await supabase
          .from('hc_command_runs')
          .insert({
            agent_id: hb.agent_id,
            heartbeat_id: hb.id,
            status: 'running',
            provider: 'worker',
            model: 'manual_invoke',
            started_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (runErr) throw runErr;

        // Update heartbeat last_run
        await supabase
          .from('hc_command_heartbeats')
          .update({
            last_run_at: new Date().toISOString(),
            last_run_status: 'running',
            run_count: (hb.run_count ?? 0) + 1,
          })
          .eq('id', target_id);

        await supabase.from('os_event_log').insert({
          event_type: 'heartbeat.manual_invoke',
          entity_id: target_id,
          entity_type: 'heartbeat',
          payload: { heartbeat_slug: hb.slug, agent_slug: hb.hc_command_agents?.slug, by: 'william' },
        });

        return NextResponse.json({ result: 'ok', run });
      }

      // Create task (assign work)
      case 'create_task': {
        const { data: task, error: taskErr } = await supabase
          .from('hc_command_tasks')
          .insert({
            title: payload.title,
            description: payload.description,
            priority: payload.priority ?? 5,
            domain: payload.domain,
            market: payload.market,
            assigned_to: payload.assigned_to ?? null,
            status: payload.assigned_to ? 'todo' : 'backlog',
          })
          .select()
          .single();

        if (taskErr) throw taskErr;

        if (payload.assigned_to) {
          await supabase.from('os_event_log').insert({
            event_type: 'task.assigned',
            entity_id: task.id,
            entity_type: 'task',
            payload: { title: task.title, assigned_to: payload.assigned_to },
          });
        }

        return NextResponse.json({ result: 'ok', task });
      }

      // Record money event
      case 'record_money': {
        const { data: evt, error: evtErr } = await supabase
          .from('hc_command_money_events')
          .insert({
            event_type: payload.event_type,
            amount_cents: payload.amount_cents,
            currency: payload.currency ?? 'USD',
            entity_type: payload.entity_type,
            entity_id: payload.entity_id,
            market: payload.market,
            metadata: payload.metadata ?? {},
          })
          .select()
          .single();

        if (evtErr) throw evtErr;
        return NextResponse.json({ result: 'ok', money_event: evt });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('[command/board] POST error:', error);
    return NextResponse.json(
      { error: 'Board action failed', details: error.message },
      { status: 500 }
    );
  }
}
