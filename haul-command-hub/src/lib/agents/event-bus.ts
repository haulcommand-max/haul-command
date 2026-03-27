/**
 * Haul Command — Event Bus
 * 
 * The BACKBONE. Every agent is event-triggered.
 * No polling. Events fire agents. No dead-end states.
 * 
 * Architecture:
 *   1. emitEvent() → writes to Supabase hc_events + broadcasts via SSE
 *   2. Agents subscribe to events via the registry
 *   3. Event → Router → Agent(s) → Result → emitEvent(s) → next Agent(s)
 * 
 * This creates the autonomous chain:
 *   load.created → [Arbitrage, Pricing, Matching, Permit] →
 *   load.matched → [Push Dispatch, Voice Dispatch] →
 *   load.unfilled → [Follow-Up, Rescue] → ...
 */

import type { HCEvent, AgentResult } from './types';

// ─── Event Payload ───────────────────────────────────────────────
export interface EventPayload {
  type: HCEvent;
  payload: Record<string, unknown>;
  /** Region code (for region-scoped events) */
  region?: string;
  /** Country code (for country-scoped events) */
  countryCode?: string;
  /** Source agent ID (who fired this event, 0 = system) */
  sourceAgentId?: number;
  /** Correlation ID for tracing event chains */
  correlationId?: string;
}

// ─── Emit Event ──────────────────────────────────────────────────
/**
 * Fires an event into the system.
 * 1. Persists to Supabase hc_events table
 * 2. Broadcasts to SSE subscribers via /api/dispatch/realtime
 * 3. Returns the event ID for tracking
 */
export async function emitEvent(event: EventPayload): Promise<string> {
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // 1. Persist to event journal (non-blocking)
  const persistPromise = fetch(`${siteUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: event.type,
      payload: {
        ...event.payload,
        _meta: {
          eventId,
          sourceAgentId: event.sourceAgentId || 0,
          correlationId: event.correlationId,
          region: event.region,
          countryCode: event.countryCode,
        },
      },
      ts: Date.now(),
    }),
  }).catch(() => {});

  // 2. Broadcast to SSE subscribers for real-time UI updates
  const broadcastPromise = fetch(`${siteUrl}/api/dispatch/realtime`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`,
    },
    body: JSON.stringify({
      type: mapToSSEEventType(event.type),
      payload: {
        ...event.payload,
        eventId,
        originalEventType: event.type,
      },
      region: event.region,
    }),
  }).catch(() => {});

  // Wait for both (non-blocking for the agent, but ensures delivery)
  await Promise.allSettled([persistPromise, broadcastPromise]);

  return eventId;
}

// ─── Emit Multiple Events (from AgentResult) ─────────────────────
/**
 * Takes an AgentResult and fires all its downstream events.
 * This is what creates the autonomous chain.
 */
export async function emitAgentEvents(
  result: AgentResult,
  correlationId?: string,
): Promise<string[]> {
  const eventIds: string[] = [];

  for (const evt of result.emitEvents) {
    const id = await emitEvent({
      type: evt.type,
      payload: evt.payload,
      sourceAgentId: result.agentId,
      correlationId,
    });
    eventIds.push(id);
  }

  return eventIds;
}

// ─── Map HC Events to SSE Event Types ────────────────────────────
// The SSE system only accepts specific event types — map our
// richer event taxonomy to the SSE-compatible subset
function mapToSSEEventType(event: HCEvent): string {
  const map: Partial<Record<HCEvent, string>> = {
    'load.created':      'load:new',
    'load.matched':      'load:matched',
    'load.accepted':     'load:accepted',
    'load.cancelled':    'load:cancelled',
    'job.completed':     'load:completed',
    'load.unfilled':     'dispatch:alert',
    'surge.updated':     'surge:updated',
    'operator.signup':   'operator:online',
    'operator.idle':     'dispatch:alert',
  };
  return map[event] || 'dispatch:alert';
}

// ─── Event Chain Validator ───────────────────────────────────────
/**
 * Validates that an event won't create an infinite loop.
 * Tracks correlation chains and caps at 20 hops.
 */
const MAX_CHAIN_DEPTH = 20;
const activeChains = new Map<string, number>();

export function validateChainDepth(correlationId: string): boolean {
  const depth = activeChains.get(correlationId) || 0;
  if (depth >= MAX_CHAIN_DEPTH) {
    console.error(`[EventBus] Chain depth exceeded for ${correlationId}. Breaking loop.`);
    return false;
  }
  activeChains.set(correlationId, depth + 1);

  // Cleanup old correlation IDs after 5 minutes
  setTimeout(() => activeChains.delete(correlationId), 5 * 60 * 1000);

  return true;
}

// ─── Event Subscription Registry ─────────────────────────────────
/**
 * Maps events to the agent IDs that should be triggered.
 * This is the WIRING DIAGRAM for the entire autonomous system.
 */
export const EVENT_AGENT_MAP: Record<HCEvent, number[]> = {
  // Load lifecycle
  'load.created':           [5, 7, 8, 17, 18, 44, 46],    // Arbitrage Decision, Dynamic Pricing, Surge Monitor, Push Dispatch, Matching, Permit PreFill, Doc Parser
  'load.matched':           [15, 17, 19, 48],               // Voice Orchestrator, Push Dispatch, Follow-Up, Compliance Validator
  'load.accepted':          [23, 39],                        // ETA Tracker, Escrow Enforcement
  'load.unfilled':          [9, 19, 20, 24],                 // Urgent Rescue, Follow-Up, Backup Operator, Escalation Manager
  'load.cancelled':         [12, 35, 40],                    // Cancellation Repricing, Reputation Engine, Reliability Scoring
  'load.scope.uploaded':    [46],                            // Document Parser

  // Job lifecycle
  'job.completed':          [10, 31, 35, 40, 53, 66],       // Upsell Tracker, Referral, Reputation, Reliability, Infrastructure Map, Invoice Gen

  // Operator lifecycle
  'operator.signup':        [28, 32, 33, 34, 37],            // Claim Activation, Profile Enrichment, Equipment Verify, Calendar, Identity Verify
  'operator.idle':          [30, 34],                         // Reactivation, Calendar Agent
  'operator.calendar.updated': [34],                         // Calendar Agent

  // Broker lifecycle
  'broker.signup':          [37, 61, 63],                    // Identity Verify, Broker Onboarding, Broker Credit
  'broker.detected':        [59, 60],                         // Broker Scraper, Broker Outreach
  'broker.lead.new':        [60],                             // Broker Outreach

  // Financial
  'payment.failed':         [65, 68],                         // AR Enforcer, Subscription Lifecycle
  'payment.received':       [67],                             // Payment Reconciliation
  'escrow.disputed':        [41],                             // Dispute Resolution
  'invoice.overdue':        [65],                             // AR Enforcer
  'subscription.cancelled': [14, 68],                         // Win-Back, Subscription Lifecycle

  // Permit
  'permit.required':        [44, 45, 51],                    // Permit PreFill, Rules Engine, Permit Cost Optimizer
  'permit.prefilled':       [45],                             // Rules Engine
  'permit.validated':       [47],                             // Permit Auto-Submitter
  'permit.submitted':       [50],                             // Permit Status Tracker
  'permit.manual_required': [49],                             // Manual Assist Router

  // System
  'surge.updated':          [7, 17],                          // Dynamic Pricing, Push Dispatch
  'compliance.expired':     [48],                             // Compliance Validator
  'coverage_gap.critical':  [27, 56],                         // Recruitment Outreach, Territory Launcher
  'recruitment.lead.new':   [27],                             // Recruitment Outreach
  'upsell.ready':           [11],                             // Upsell Outreach
  'territory.launched':     [52],                             // SEO Page Generator

  // Arbitrage
  'arbitrage.lead.scraped': [5],                              // Arbitrage Decision Engine
  'arbitrage.bid.approved': [6],                              // Arbitrage Auto-Bidder

  // Dispatch
  'dispatch.call.queued':   [16],                             // Voice Call Agent
  'dispatch.push.sent':     [19],                             // Follow-Up Agent
  'dispatch.escalation':    [24],                             // Escalation Manager
};

/**
 * Get agent IDs that should be triggered by a given event.
 */
export function getAgentsForEvent(eventType: HCEvent): number[] {
  return EVENT_AGENT_MAP[eventType] || [];
}
