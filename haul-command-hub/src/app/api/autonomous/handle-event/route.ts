/**
 * POST /api/autonomous/handle-event
 * 
 * The MAIN ENTRY POINT for the autonomous system.
 * Receives an event → looks up subscribed agents → runs them all in parallel.
 * 
 * This is the single API that turns Haul Command into an autonomous machine.
 * Every Supabase webhook, cron job, and UI action fires events through here.
 * 
 * Auth: CRON_SECRET bearer token
 * 
 * Usage:
 *   POST /api/autonomous/handle-event
 *   Authorization: Bearer <CRON_SECRET>
 *   { "event": "load.created", "payload": { ... }, "region": "TX" }
 */

import { NextResponse } from 'next/server';
import type { HCEvent } from '@/lib/agents/types';
import { handleEvent, getAgentStatuses } from '@/lib/agents/agent-runner';
import { getAgentsForEvent } from '@/lib/agents/event-bus';

// ─── Import agents to register them ──────────────────────────────
// Each import triggers registerAgent() in the module
// 🟢 REVENUE SWARM (14 agents)
import '@/lib/agents/revenue/arbitrage-scrapers';    // #1, #2, #3, #4
import '@/lib/agents/revenue/arbitrage-decision';     // #5
import '@/lib/agents/revenue/arbitrage-bidder';       // #6
import '@/lib/agents/revenue/dynamic-pricing';        // #7
import '@/lib/agents/revenue/surge-monitor';          // #8
import '@/lib/agents/revenue/urgent-rescue';          // #9
import '@/lib/agents/revenue/upsell';                 // #10, #11
import '@/lib/agents/revenue/revenue-ops';            // #12, #13, #14
// 📞 DISPATCH SWARM (10 agents)
import '@/lib/agents/dispatch/voice-orchestrator';    // #15
import '@/lib/agents/dispatch/voice-call';            // #16
import '@/lib/agents/dispatch/push-dispatch';         // #17
import '@/lib/agents/dispatch/load-matching';         // #18
import '@/lib/agents/dispatch/follow-up';             // #19
import '@/lib/agents/dispatch/dispatch-ops';          // #20, #21, #22, #23, #24
// 📦 SUPPLY SWARM (10 agents)
import '@/lib/agents/supply/recruitment';             // #25, #26, #27
import '@/lib/agents/supply/claim-activation';        // #28
import '@/lib/agents/supply/operator-supply';         // #29
import '@/lib/agents/supply/supply-ops';              // #30, #31, #32, #33, #34
// 🛡️ CONTROL SWARM (9 agents)
import '@/lib/agents/control/reputation';             // #35
import '@/lib/agents/control/control-ops';            // #36–43
// 📋 PERMIT SWARM (8 agents)
import '@/lib/agents/permit/permit-prefill';          // #44
import '@/lib/agents/permit/permit-ops';              // #45–51
// 🌐 EXPANSION SWARM (7 agents)
import '@/lib/agents/expansion/expansion-ops';        // #52, #53, #55–58
import '@/lib/agents/analytics/market-intelligence';  // #54
// 🤝 BROKER RELATIONS SWARM (6 agents)
import '@/lib/agents/broker_relations/broker-extraction'; // #59
import '@/lib/agents/broker_relations/broker-outreach';   // #60
import '@/lib/agents/broker_relations/broker-ops';        // #61–64
// 💵 FINANCE SWARM (6 agents)
import '@/lib/agents/finance/finance-ops';            // #65–70
// 📊 ANALYTICS SWARM (2 agents)
import '@/lib/agents/analytics/analytics-core';       // #71, #72
// ═══ ALL 72 AGENTS REGISTERED ═══

// ─── POST: Handle Event ──────────────────────────────────────────
export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    // Auth
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { event, payload, region, countryCode } = body as {
      event: HCEvent;
      payload: Record<string, unknown>;
      region?: string;
      countryCode?: string;
    };

    if (!event) {
      return NextResponse.json({ error: 'event type required' }, { status: 400 });
    }

    // Look up which agents are subscribed to this event
    const subscribedAgentIds = getAgentsForEvent(event);

    if (subscribedAgentIds.length === 0) {
      return NextResponse.json({
        success: true,
        event,
        agentsTriggered: 0,
        message: 'No agents subscribed to this event',
        latencyMs: Date.now() - startTime,
      });
    }

    // Run all subscribed agents in parallel
    const results = await handleEvent(event, payload || {}, region, countryCode);

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalRevenue = results.reduce((sum, r) => sum + (r.metrics.revenueImpact || 0), 0);
    const totalCostSaved = results.reduce((sum, r) => sum + (r.metrics.costSaved || 0), 0);
    const totalRunCost = results.reduce((sum, r) => sum + r.metrics.runCostUSD, 0);
    const eventsEmitted = results.reduce((sum, r) => sum + r.emitEvents.length, 0);

    return NextResponse.json({
      success: true,
      event,
      agentsTriggered: results.length,
      succeeded,
      failed,
      eventsEmitted,
      metrics: {
        revenueImpact: totalRevenue,
        costSaved: totalCostSaved,
        runCostUSD: totalRunCost,
      },
      results: results.map(r => ({
        agentId: r.agentId,
        success: r.success,
        action: r.action,
        error: r.error,
        durationMs: r.metrics.durationMs,
        costUSD: r.metrics.runCostUSD,
        eventsEmitted: r.emitEvents.map(e => e.type),
      })),
      latencyMs: Date.now() - startTime,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Autonomous] Event handler error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── GET: Agent Status Dashboard ─────────────────────────────────
export async function GET() {
  const statuses = getAgentStatuses();

  return NextResponse.json({
    name: 'Haul Command Autonomous System',
    version: '1.0',
    totalAgents: 72,
    registeredAgents: statuses.length,
    activeAgents: statuses.filter(a => a.enabled && !a.killed).length,
    killedAgents: statuses.filter(a => a.killed).length,
    agents: statuses,
    swarms: {
      revenue:          statuses.filter(a => a.swarm === 'revenue'),
      dispatch:         statuses.filter(a => a.swarm === 'dispatch'),
      supply:           statuses.filter(a => a.swarm === 'supply'),
      control:          statuses.filter(a => a.swarm === 'control'),
      permit:           statuses.filter(a => a.swarm === 'permit'),
      expansion:        statuses.filter(a => a.swarm === 'expansion'),
      broker_relations: statuses.filter(a => a.swarm === 'broker_relations'),
      finance:          statuses.filter(a => a.swarm === 'finance'),
      analytics:        statuses.filter(a => a.swarm === 'analytics'),
    },
    eventMap: 'GET /api/autonomous/handle-event for agent wiring diagram',
  });
}
