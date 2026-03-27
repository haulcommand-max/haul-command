/**
 * Haul Command — Autonomous Agent Type System
 * 
 * Shared interfaces for all 72 agents across 9 swarms.
 * Every agent implements AgentDefinition and returns AgentResult.
 */

// ─── Swarm Identifiers ──────────────────────────────────────────
export type SwarmId =
  | 'revenue'
  | 'dispatch'
  | 'supply'
  | 'control'
  | 'permit'
  | 'expansion'
  | 'broker_relations'
  | 'finance'
  | 'analytics';

export const SWARM_LABELS: Record<SwarmId, string> = {
  revenue:          '🟢 Revenue Swarm',
  dispatch:         '📞 Dispatch Swarm',
  supply:           '📦 Supply Swarm',
  control:          '🛡️ Control Swarm',
  permit:           '📋 Permit Swarm',
  expansion:        '🌐 Expansion Swarm',
  broker_relations: '🤝 Broker Relations Swarm',
  finance:          '💵 Finance/Billing Swarm',
  analytics:        '📊 Analytics Swarm',
};

// ─── AI Model Routing ────────────────────────────────────────────
export type AIModel =
  | 'openai'       // GPT-4o — pricing, decisions, negotiations
  | 'claude'       // Sonnet — documents, permits, long-context
  | 'gemini'       // 2.0 Flash — search, scraping, enrichment, classification
  | 'none';        // Pure logic, no AI needed

// ─── Agent Trigger Types ─────────────────────────────────────────
export type TriggerType =
  | 'event'        // Fired by an event (e.g., load.created)
  | 'cron'         // Scheduled execution
  | 'manual'       // Admin-triggered
  | 'webhook';     // External webhook

// ─── Country Tiers ───────────────────────────────────────────────
export type CountryTier = 'A' | 'B' | 'C' | 'D';

export const TIER_STRATEGY: Record<CountryTier, { label: string; focus: string; goal: string }> = {
  A: { label: '🟨 Gold',   focus: 'Arbitrage, pricing control, speed',          goal: 'Dominate lanes' },
  B: { label: '🟦 Blue',   focus: 'Supply building, recruitment agents',        goal: 'Fill gaps' },
  C: { label: '🟪 Silver', focus: 'Automation, directory dominance',            goal: 'Early control' },
  D: { label: '⬛ Slate',  focus: 'SEO + infrastructure mapping',               goal: 'Plant flag early' },
};

// ─── Event Types ─────────────────────────────────────────────────
export type HCEvent =
  // Load lifecycle
  | 'load.created'
  | 'load.matched'
  | 'load.accepted'
  | 'load.unfilled'
  | 'load.cancelled'
  | 'load.scope.uploaded'
  // Job lifecycle
  | 'job.completed'
  // Operator lifecycle
  | 'operator.signup'
  | 'operator.idle'
  | 'operator.calendar.updated'
  // Broker lifecycle
  | 'broker.signup'
  | 'broker.detected'
  | 'broker.lead.new'
  // Financial
  | 'payment.failed'
  | 'payment.received'
  | 'escrow.disputed'
  | 'invoice.overdue'
  | 'subscription.cancelled'
  // Permit
  | 'permit.required'
  | 'permit.prefilled'
  | 'permit.validated'
  | 'permit.submitted'
  | 'permit.manual_required'
  // System
  | 'surge.updated'
  | 'compliance.expired'
  | 'coverage_gap.critical'
  | 'recruitment.lead.new'
  | 'upsell.ready'
  | 'territory.launched'
  // Arbitrage
  | 'arbitrage.lead.scraped'
  | 'arbitrage.bid.approved'
  // Dispatch
  | 'dispatch.call.queued'
  | 'dispatch.push.sent'
  | 'dispatch.escalation';

// ─── Agent Definition ────────────────────────────────────────────
export interface AgentDefinition {
  /** Unique agent ID (1–72) */
  id: number;
  /** Human-readable agent name */
  name: string;
  /** Swarm this agent belongs to */
  swarm: SwarmId;
  /** AI model used (or 'none' for pure logic) */
  model: AIModel;
  /** What triggers this agent */
  triggerType: TriggerType;
  /** Specific events that trigger this agent (if event-triggered) */
  triggerEvents?: HCEvent[];
  /** Cron schedule (if cron-triggered), e.g., '0/10 * * * *' */
  cronSchedule?: string;
  /** Country tiers this agent operates in */
  tiers: CountryTier[];
  /** Estimated monthly operating cost in USD */
  monthlyCostUSD: number;
  /** One-line description */
  description: string;
  /** Whether this agent is currently enabled */
  enabled: boolean;
  /** Priority rank (1 = highest, for the Top 12) */
  priority: number;
  /** Spending cap per execution (USD), prevents runaway costs */
  maxCostPerRun: number;
  /** Maximum executions per hour */
  maxRunsPerHour: number;
}

// ─── Agent Execution Context ─────────────────────────────────────
export interface AgentContext {
  /** The event that triggered this agent (null for cron/manual) */
  event?: {
    type: HCEvent;
    payload: Record<string, unknown>;
    eventId: string;
    timestamp: string;
  };
  /** Country/region context */
  region?: string;
  countryCode?: string;
  tier?: CountryTier;
  /** Agent metadata */
  agentId: number;
  agentName: string;
  runId: string;
  startedAt: string;
}

// ─── Agent Result ────────────────────────────────────────────────
export interface AgentResult {
  success: boolean;
  agentId: number;
  runId: string;
  /** What the agent did */
  action: string;
  /** Downstream events to fire */
  emitEvents: Array<{ type: HCEvent; payload: Record<string, unknown> }>;
  /** Metrics for ROI tracking */
  metrics: {
    /** Revenue generated or recovered (USD) */
    revenueImpact?: number;
    /** Cost saved (USD) */
    costSaved?: number;
    /** Risk avoided (USD) */
    riskAvoided?: number;
    /** Items processed */
    itemsProcessed: number;
    /** Execution duration (ms) */
    durationMs: number;
    /** AI tokens consumed */
    tokensUsed?: number;
    /** Estimated cost of this run (USD) */
    runCostUSD: number;
  };
  /** Errors encountered (non-fatal) */
  warnings: string[];
  /** Fatal error (agent failed) */
  error?: string;
}

// ─── Agent Handler Function ──────────────────────────────────────
export type AgentHandler = (ctx: AgentContext) => Promise<AgentResult>;

// ─── Agent Registry Entry ────────────────────────────────────────
export interface AgentRegistryEntry {
  definition: AgentDefinition;
  handler: AgentHandler;
}
