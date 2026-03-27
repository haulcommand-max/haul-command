/**
 * Haul Command — Agent Runner
 * 
 * The EXECUTION ENGINE. Every agent runs through this.
 * Handles: auth, rate limits, spending caps, kill switches,
 *          error recovery, metrics logging, and event chaining.
 * 
 * Flow:
 *   Event fires → Runner checks kill switch → Checks rate limit →
 *   Checks spending cap → Executes agent handler → Logs metrics →
 *   Emits downstream events → Returns result
 */

import type {
  AgentDefinition,
  AgentContext,
  AgentResult,
  AgentHandler,
  AgentRegistryEntry,
  HCEvent,
} from './types';
import { emitEvent, emitAgentEvents, validateChainDepth, getAgentsForEvent } from './event-bus';

// ─── Agent Registry ──────────────────────────────────────────────
// All 72 agents register here. The runner looks up agents by ID.
const AGENT_REGISTRY = new Map<number, AgentRegistryEntry>();

/**
 * Register an agent with the system.
 * Called once per agent at startup.
 */
export function registerAgent(definition: AgentDefinition, handler: AgentHandler): void {
  AGENT_REGISTRY.set(definition.id, { definition, handler });
}

/**
 * Get a registered agent by ID.
 */
export function getAgent(id: number): AgentRegistryEntry | undefined {
  return AGENT_REGISTRY.get(id);
}

/**
 * Get all registered agents.
 */
export function getAllAgents(): AgentRegistryEntry[] {
  return Array.from(AGENT_REGISTRY.values());
}

// ─── Rate Limiting ───────────────────────────────────────────────
// Tracks executions per agent per hour to enforce maxRunsPerHour
const executionCounts = new Map<number, { count: number; windowStart: number }>();

function checkRateLimit(agentId: number, maxPerHour: number): boolean {
  const now = Date.now();
  const entry = executionCounts.get(agentId);

  if (!entry || now - entry.windowStart > 3600_000) {
    executionCounts.set(agentId, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= maxPerHour) {
    return false;
  }

  entry.count++;
  return true;
}

// ─── Spending Tracker ────────────────────────────────────────────
// Tracks cumulative spending per agent per day
const spendingTracker = new Map<number, { total: number; dayStart: number }>();

function checkSpendingCap(agentId: number, maxPerRun: number, estimatedCost: number): boolean {
  // Per-run cap
  if (estimatedCost > maxPerRun) return false;

  // Daily cap (10x the per-run cap)
  const dailyCap = maxPerRun * 10;
  const now = Date.now();
  const entry = spendingTracker.get(agentId);

  if (!entry || now - entry.dayStart > 86_400_000) {
    spendingTracker.set(agentId, { total: estimatedCost, dayStart: now });
    return true;
  }

  if (entry.total + estimatedCost > dailyCap) {
    return false;
  }

  entry.total += estimatedCost;
  return true;
}

// ─── Kill Switch ─────────────────────────────────────────────────
// Agents can be disabled at runtime without redeployment
const killedAgents = new Set<number>();

export function killAgent(agentId: number): void {
  killedAgents.add(agentId);
  console.warn(`[AgentRunner] KILL SWITCH activated for Agent #${agentId}`);
}

export function reviveAgent(agentId: number): void {
  killedAgents.delete(agentId);
  console.log(`[AgentRunner] Agent #${agentId} revived`);
}

export function isAgentKilled(agentId: number): boolean {
  return killedAgents.has(agentId);
}

// ─── Run a Single Agent ──────────────────────────────────────────
/**
 * Execute a single agent with full safety controls.
 */
export async function runAgent(
  agentId: number,
  context: Partial<AgentContext>,
): Promise<AgentResult> {
  const entry = AGENT_REGISTRY.get(agentId);
  if (!entry) {
    return makeErrorResult(agentId, 'Agent not registered');
  }

  const { definition, handler } = entry;

  // 1. Kill switch
  if (!definition.enabled || isAgentKilled(agentId)) {
    return makeErrorResult(agentId, `Agent #${agentId} (${definition.name}) is disabled`);
  }

  // 2. Rate limit
  if (!checkRateLimit(agentId, definition.maxRunsPerHour)) {
    return makeErrorResult(agentId, `Agent #${agentId} rate limited (max ${definition.maxRunsPerHour}/hr)`);
  }

  // 3. Build full context
  const runId = `run_${agentId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const fullContext: AgentContext = {
    agentId,
    agentName: definition.name,
    runId,
    startedAt: new Date().toISOString(),
    ...context,
  };

  // 4. Execute with timeout (30 seconds max)
  const startTime = Date.now();
  let result: AgentResult;

  try {
    result = await Promise.race([
      handler(fullContext),
      new Promise<AgentResult>((_, reject) =>
        setTimeout(() => reject(new Error('Agent execution timeout (30s)')), 30_000)
      ),
    ]);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    result = makeErrorResult(agentId, errorMessage, runId, Date.now() - startTime);
  }

  // 5. Validate spending
  if (!checkSpendingCap(agentId, definition.maxCostPerRun, result.metrics.runCostUSD)) {
    console.warn(`[AgentRunner] Agent #${agentId} spending cap exceeded — killing agent`);
    killAgent(agentId);
    return makeErrorResult(agentId, 'Spending cap exceeded — agent killed', runId);
  }

  // 6. Log metrics
  logAgentMetrics(definition, result).catch(() => {});

  // 7. Emit downstream events (creates the autonomous chain)
  if (result.success && result.emitEvents.length > 0) {
    const correlationId = context.event?.eventId || runId;
    if (validateChainDepth(correlationId)) {
      await emitAgentEvents(result, correlationId);
    }
  }

  return result;
}

// ─── Run All Agents for an Event ─────────────────────────────────
/**
 * Given an event, find all subscribed agents and run them in parallel.
 * This is the main entry point for event-driven execution.
 */
export async function handleEvent(
  eventType: HCEvent,
  payload: Record<string, unknown>,
  region?: string,
  countryCode?: string,
): Promise<AgentResult[]> {
  const agentIds = getAgentsForEvent(eventType);
  if (agentIds.length === 0) return [];

  const context: Partial<AgentContext> = {
    event: {
      type: eventType,
      payload,
      eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    },
    region,
    countryCode,
  };

  // Run all subscribed agents in parallel
  const results = await Promise.allSettled(
    agentIds.map(id => runAgent(id, context))
  );

  return results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : makeErrorResult(agentIds[i], r.reason?.message || 'Unknown error')
  );
}

// ─── Metrics Logger ──────────────────────────────────────────────
async function logAgentMetrics(
  definition: AgentDefinition,
  result: AgentResult,
): Promise<void> {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    await fetch(`${siteUrl}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'agent.execution',
        payload: {
          agentId: definition.id,
          agentName: definition.name,
          swarm: definition.swarm,
          runId: result.runId,
          success: result.success,
          action: result.action,
          metrics: result.metrics,
          warnings: result.warnings,
          error: result.error,
          eventsEmitted: result.emitEvents.map(e => e.type),
        },
        ts: Date.now(),
      }),
    });
  } catch {
    // Non-blocking
  }
}

// ─── Error Result Factory ────────────────────────────────────────
function makeErrorResult(
  agentId: number,
  error: string,
  runId?: string,
  durationMs?: number,
): AgentResult {
  return {
    success: false,
    agentId,
    runId: runId || `err_${agentId}_${Date.now()}`,
    action: 'error',
    emitEvents: [],
    metrics: {
      itemsProcessed: 0,
      durationMs: durationMs || 0,
      runCostUSD: 0,
    },
    warnings: [],
    error,
  };
}

// ─── Agent Status Dashboard Data ─────────────────────────────────
export interface AgentStatus {
  id: number;
  name: string;
  swarm: string;
  enabled: boolean;
  killed: boolean;
  priority: number;
  model: string;
  monthlyCostUSD: number;
  executionsThisHour: number;
  maxRunsPerHour: number;
  spendingToday: number;
}

export function getAgentStatuses(): AgentStatus[] {
  return getAllAgents().map(({ definition }) => {
    const execEntry = executionCounts.get(definition.id);
    const spendEntry = spendingTracker.get(definition.id);

    return {
      id: definition.id,
      name: definition.name,
      swarm: definition.swarm,
      enabled: definition.enabled,
      killed: isAgentKilled(definition.id),
      priority: definition.priority,
      model: definition.model,
      monthlyCostUSD: definition.monthlyCostUSD,
      executionsThisHour: execEntry?.count || 0,
      maxRunsPerHour: definition.maxRunsPerHour,
      spendingToday: spendEntry?.total || 0,
    };
  });
}
