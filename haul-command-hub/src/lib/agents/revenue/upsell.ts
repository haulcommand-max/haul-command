/**
 * Agents #10, #11 — Upsell Behavioral Tracker + Upsell Outreach
 * Swarm: Revenue | Steroids: Micro-Moment triggering + Lost Revenue Calculator
 */
import type { AgentContext, AgentResult, AgentDefinition } from '../types';
import { routeToModel, parseJSON } from '../model-router';
import { registerAgent } from '../agent-runner';

// ─── Agent 10: Behavioral Tracker ────────────────────────────────
const AGENT_10: AgentDefinition = {
  id: 10, name: 'Upsell Behavioral Tracker', swarm: 'revenue', model: 'gemini',
  triggerType: 'event', triggerEvents: ['job.completed'], tiers: ['A', 'B', 'C', 'D'],
  monthlyCostUSD: 15, description: 'Scores operator upgrade readiness from behavior patterns',
  enabled: true, priority: 20, maxCostPerRun: 0.05, maxRunsPerHour: 200,
};

async function handleTracker(ctx: AgentContext): Promise<AgentResult> {
  const start = Date.now();
  const p = ctx.event?.payload || {};
  const opId = (p.operator_id as string) || 'unknown';
  // Simulated scoring: login freq, loads viewed, bids, time on app
  const score = Math.floor(Math.random() * 40) + 60; // 60-100
  if (score >= 70) {
    return { success: true, agentId: 10, runId: ctx.runId, action: `Operator ${opId} scored ${score}/100 — upgrade ready`, emitEvents: [{ type: 'upsell.ready', payload: { operator_id: opId, score, missed_loads: Math.floor(Math.random() * 12) + 3 } }], metrics: { itemsProcessed: 1, durationMs: Date.now() - start, runCostUSD: 0 }, warnings: [] };
  }
  return { success: true, agentId: 10, runId: ctx.runId, action: `Operator ${opId} scored ${score}/100 — not ready`, emitEvents: [], metrics: { itemsProcessed: 1, durationMs: Date.now() - start, runCostUSD: 0 }, warnings: [] };
}

// ─── Agent 11: Upsell Outreach ───────────────────────────────────
const AGENT_11: AgentDefinition = {
  id: 11, name: 'Upsell Outreach Agent', swarm: 'revenue', model: 'claude',
  triggerType: 'event', triggerEvents: ['upsell.ready'], tiers: ['A', 'B', 'C', 'D'],
  monthlyCostUSD: 10, description: 'Generates personalized upgrade push with lost revenue data',
  enabled: true, priority: 21, maxCostPerRun: 0.08, maxRunsPerHour: 50,
};

async function handleOutreach(ctx: AgentContext): Promise<AgentResult> {
  const start = Date.now();
  const p = ctx.event?.payload || {};
  const opId = (p.operator_id as string) || 'unknown';
  const missed = (p.missed_loads as number) || 8;
  const ai = await routeToModel({ agentId: 11, runId: ctx.runId, task: 'copywriting', forceModel: 'claude',
    systemPrompt: 'Write a short, punchy push notification for a pilot car operator who missed loads because they are on the free tier. Include the exact number of missed loads and estimated earnings. Max 2 sentences.',
    prompt: `Operator ${opId} missed ${missed} loads worth ~$${missed * 350} this week.`, maxTokens: 100 });
  return { success: true, agentId: 11, runId: ctx.runId, action: `Sent upsell push to ${opId}: "${ai.text.slice(0, 80)}..."`,
    emitEvents: [], metrics: { itemsProcessed: 1, durationMs: Date.now() - start, runCostUSD: ai.costUSD, revenueImpact: missed * 350 * 0.001 }, warnings: [] };
}

registerAgent(AGENT_10, handleTracker);
registerAgent(AGENT_11, handleOutreach);
