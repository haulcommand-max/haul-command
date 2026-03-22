/**
 * lib/engines/model-router.ts
 *
 * Intelligent multi-model API routing for Haul Command.
 * Same output quality at lowest possible cost.
 *
 * No OpenAI — only Claude (Anthropic) and Gemini.
 *
 * Cost math:
 *   80% Haiku ($0.00025/1k) + 15% Sonnet ($0.003/1k) + 5% Opus ($0.015/1k)
 *   = ~$47/month at 73,350 calls vs $1,100 all-Opus
 */

export type TaskComplexity = 'instant' | 'standard' | 'deep' | 'creative';

export interface ModelConfig {
  model: string;
  provider: 'anthropic' | 'gemini';
  costPer1kTokens: number;
  maxTokens: number;
  description: string;
}

const MODEL_MAP: Record<TaskComplexity, ModelConfig> = {
  instant: {
    model: 'claude-haiku-4-5-20251001',
    provider: 'anthropic',
    costPer1kTokens: 0.00025,
    maxTokens: 2048,
    description: 'Simple Q&A, lookups, yes/no compliance checks',
  },
  standard: {
    model: 'claude-sonnet-4-6-20250514',
    provider: 'anthropic',
    costPer1kTokens: 0.003,
    maxTokens: 4096,
    description: 'Most tasks — analysis, summaries, search interpretation',
  },
  deep: {
    model: 'claude-opus-4-6-20250514',
    provider: 'anthropic',
    costPer1kTokens: 0.015,
    maxTokens: 8192,
    description: 'Legal, contracts, complex multi-step reasoning',
  },
  creative: {
    model: 'gemini-2.5-flash',
    provider: 'gemini',
    costPer1kTokens: 0.001,
    maxTokens: 4096,
    description: 'Ad creative, image analysis, visual content generation',
  },
};

// ═══════════════════════════════════════════════════════════════
// Agent → Complexity Routing
// ═══════════════════════════════════════════════════════════════

const AGENT_ROUTING: Record<string, TaskComplexity> = {
  support_bot: 'instant',
  regulation_rag: 'instant',
  load_enhancer: 'standard',
  review_analyzer: 'standard',
  anomaly_detector: 'standard',
  onboarding_copilot: 'standard',
  dispatch_brain: 'standard',
  route_survey: 'standard',
  content_factory: 'standard',
  ad_copy_gen: 'creative',
  contract_gen: 'deep',
  invoice_gen: 'deep',
  compliance_copilot: 'standard', // deep for new queries, instant for cache hits
};

/**
 * Get the optimal model config for a given agent or task complexity.
 */
export function getModelForAgent(agentId: string): ModelConfig {
  const complexity = AGENT_ROUTING[agentId] ?? 'standard';
  return MODEL_MAP[complexity];
}

export function getModelForComplexity(complexity: TaskComplexity): ModelConfig {
  return MODEL_MAP[complexity];
}

/**
 * Determine complexity from task characteristics for dynamic routing.
 */
export function inferComplexity(opts: {
  tokenEstimate?: number;
  isLegal?: boolean;
  isCreative?: boolean;
  isCached?: boolean;
  questionLength?: number;
}): TaskComplexity {
  if (opts.isCached) return 'instant';
  if (opts.isCreative) return 'creative';
  if (opts.isLegal) return 'deep';
  if ((opts.tokenEstimate ?? 0) > 3000) return 'deep';
  if ((opts.questionLength ?? 0) < 50) return 'instant';
  return 'standard';
}

/**
 * Estimate cost for a given call.
 */
export function estimateCost(complexity: TaskComplexity, inputTokens: number, outputTokens: number): number {
  const model = MODEL_MAP[complexity];
  const totalTokens = inputTokens + outputTokens;
  return (totalTokens / 1000) * model.costPer1kTokens;
}

/**
 * Block OpenAI usage at runtime.
 */
export function assertNoOpenAI() {
  if (process.env.OPENAI_API_KEY) {
    console.warn(
      '⚠️ OPENAI_API_KEY detected but OpenAI is not supported. ' +
      'Use ANTHROPIC_API_KEY for reasoning tasks and GEMINI_API_KEY for creative tasks.',
    );
  }
}

// Run assertion on module load
assertNoOpenAI();

export { MODEL_MAP, AGENT_ROUTING };
