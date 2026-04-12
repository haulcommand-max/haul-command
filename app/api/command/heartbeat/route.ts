// =====================================================================
// Haul Command Command Layer — Heartbeat API
// POST /api/command/heartbeat → Agent reports work completion
//
// Paperclip equivalent: Agent heartbeat protocol
// HC adaptation: Industry-function heartbeats with revenue/proof tracking
//
// Flow:
//   1. Agent receives trigger (cron/event/manual)
//   2. Agent does work
//   3. Agent POSTs to this endpoint with results
//   4. System updates run record, agent stats, heartbeat status
//   5. System checks for next tasks to assign
// =====================================================================
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      agent_slug,
      heartbeat_slug,
      action,               // 'start' | 'complete' | 'fail' | 'checkin'
      run_id,               // required for 'complete' and 'fail'
      // Work results (for 'complete')
      cost_cents = 0,
      revenue_cents = 0,
      leads_generated = 0,
      entities_processed = 0,
      pages_published = 0,
      notifications_sent = 0,
      result = null,
      error_message = null,
      // Task checkout (for 'checkin')
      task_id = null,
    } = body;

    // Validate agent
    const { data: agent, error: agentErr } = await supabase
      .from('hc_command_agents')
      .select('id, slug, name, domain, status, budget_monthly_cents, budget_spent_cents')
      .eq('slug', agent_slug)
      .single();

    if (agentErr || !agent) {
      return NextResponse.json(
        { error: `Agent not found: ${agent_slug}` },
        { status: 404 }
      );
    }

    // Check agent is not paused/terminated
    if (agent.status === 'paused' || agent.status === 'terminated') {
      return NextResponse.json(
        { error: `Agent ${agent_slug} is ${agent.status}`, status: agent.status },
        { status: 403 }
      );
    }

    // Budget guard (Paperclip: hard budget enforcement)
    if (action === 'start' && agent.budget_monthly_cents > 0) {
      if ((agent.budget_spent_cents ?? 0) >= agent.budget_monthly_cents) {
        return NextResponse.json(
          {
            error: 'Budget exceeded',
            budget_monthly_cents: agent.budget_monthly_cents,
            budget_spent_cents: agent.budget_spent_cents,
          },
          { status: 429 }
        );
      }
    }

    switch (action) {
      // ── START: Agent begins a run ────────────────────────────────
      case 'start': {
        // Get heartbeat if specified
        let heartbeat_id: string | null = null;
        if (heartbeat_slug) {
          const { data: hb } = await supabase
            .from('hc_command_heartbeats')
            .select('id')
            .eq('slug', heartbeat_slug)
            .single();
          heartbeat_id = hb?.id ?? null;
        }

        // Create run record
        const { data: run, error: runErr } = await supabase
          .from('hc_command_runs')
          .insert({
            agent_id: agent.id,
            heartbeat_id,
            task_id: task_id ?? null,
            status: 'running',
            provider: body.provider ?? 'worker',
            model: body.model ?? 'worker',
            started_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (runErr) throw runErr;

        // Update agent status to running
        await supabase
          .from('hc_command_agents')
          .update({ status: 'running', updated_at: new Date().toISOString() })
          .eq('id', agent.id);

        // Update heartbeat tracking
        if (heartbeat_id) {
          await supabase
            .from('hc_command_heartbeats')
            .update({
              last_run_at: new Date().toISOString(),
              last_run_status: 'running',
              run_count: supabase.rpc ? undefined : 0, // incremented in SQL
            })
            .eq('id', heartbeat_id);
        }

        return NextResponse.json({
          result: 'ok',
          run_id: run.id,
          agent_id: agent.id,
          message: `Run started for ${agent.name}`,
        });
      }

      // ── COMPLETE: Agent finishes a run ───────────────────────────
      case 'complete': {
        if (!run_id) {
          return NextResponse.json(
            { error: 'run_id required for complete action' },
            { status: 400 }
          );
        }

        // Use the RPC to atomically complete the run + update stats
        const { data: completionResult, error: complErr } = await supabase.rpc(
          'command_complete_run',
          {
            p_run_id: run_id,
            p_status: 'completed',
            p_cost_cents: cost_cents,
            p_revenue_cents: revenue_cents,
            p_leads: leads_generated,
            p_entities_processed: entities_processed,
            p_pages_published: pages_published,
            p_result: result,
            p_error_message: null,
          }
        );

        if (complErr) throw complErr;

        // If revenue was generated, create a money event
        if (revenue_cents > 0) {
          await supabase.from('hc_command_money_events').insert({
            event_type: 'revenue_earned',
            amount_cents: revenue_cents,
            agent_id: agent.id,
            metadata: { run_id, source: agent_slug },
          });
        }

        // If cost was incurred, create a money event
        if (cost_cents > 0) {
          await supabase.from('hc_command_money_events').insert({
            event_type: 'cost_incurred',
            amount_cents: cost_cents,
            agent_id: agent.id,
            metadata: { run_id, source: agent_slug },
          });
        }

        return NextResponse.json({
          result: 'ok',
          run_id,
          completion: completionResult,
          message: `Run completed for ${agent.name}`,
        });
      }

      // ── FAIL: Agent reports a failure ────────────────────────────
      case 'fail': {
        if (!run_id) {
          return NextResponse.json(
            { error: 'run_id required for fail action' },
            { status: 400 }
          );
        }

        const { data: failResult, error: failErr } = await supabase.rpc(
          'command_complete_run',
          {
            p_run_id: run_id,
            p_status: 'failed',
            p_cost_cents: cost_cents,
            p_revenue_cents: 0,
            p_leads: 0,
            p_entities_processed: entities_processed,
            p_pages_published: 0,
            p_result: null,
            p_error_message: error_message ?? 'Unknown error',
          }
        );

        if (failErr) throw failErr;

        return NextResponse.json({
          result: 'ok',
          run_id,
          failure: failResult,
          message: `Run failed for ${agent.name}: ${error_message}`,
        });
      }

      // ── CHECKIN: Agent checks for assigned work ──────────────────
      // Paperclip: "task checkout" — single-assignee atomic checkout
      case 'checkin': {
        // Find next task assigned to this agent
        const { data: tasks, error: taskErr } = await supabase
          .from('hc_command_tasks')
          .select('*')
          .eq('assigned_to', agent.id)
          .in('status', ['todo', 'backlog'])
          .order('priority', { ascending: true })
          .order('created_at', { ascending: true })
          .limit(5);

        if (taskErr) throw taskErr;

        // Also check for unassigned tasks in this agent's domain
        const { data: domainTasks } = await supabase
          .from('hc_command_tasks')
          .select('*')
          .eq('domain', agent.domain)
          .is('assigned_to', null)
          .in('status', ['todo', 'backlog'])
          .order('priority', { ascending: true })
          .order('created_at', { ascending: true })
          .limit(5);

        // Check for pending approvals
        const { data: approvals } = await supabase
          .from('hc_command_approvals')
          .select('*')
          .eq('agent_id', agent.id)
          .eq('status', 'pending')
          .limit(5);

        // Update agent status to active (heartbeat alive)
        await supabase
          .from('hc_command_agents')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', agent.id);

        return NextResponse.json({
          result: 'ok',
          agent: { id: agent.id, slug: agent.slug, domain: agent.domain },
          assigned_tasks: tasks ?? [],
          available_tasks: domainTasks ?? [],
          pending_approvals: approvals ?? [],
          message: `${(tasks?.length ?? 0) + (domainTasks?.length ?? 0)} tasks available`,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid: start, complete, fail, checkin` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('[command/heartbeat] error:', error);
    return NextResponse.json(
      { error: 'Heartbeat failed', details: error.message },
      { status: 500 }
    );
  }
}
