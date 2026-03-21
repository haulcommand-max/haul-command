/**
 * AI Model Router — HAUL COMMAND
 * 
 * Routes AI requests to the optimal model based on task complexity,
 * cost constraints, and availability. Supports Anthropic (primary),
 * Google Gemini (ads/creative), and OpenAI (fallback).
 * 
 * UPGRADE: Always upgrade, never downgrade.
 */

export type ModelTier = 'nano' | 'fast' | 'standard' | 'premium';
export type ModelProvider = 'anthropic' | 'gemini' | 'openai';

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  maxTokens: number;
  temperature: number;
  costPer1kTokens: number; // USD
}

// ═══ Model Registry ═══
// Using actual, real model names — never fabricated ones
const MODEL_REGISTRY: Record<ModelTier, ModelConfig> = {
  nano: {
    provider: 'gemini',
    model: 'gemini-2.0-flash-lite',
    maxTokens: 1024,
    temperature: 0.3,
    costPer1kTokens: 0.000,
  },
  fast: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    temperature: 0.4,
    costPer1kTokens: 0.003,
  },
  standard: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 8192,
    temperature: 0.5,
    costPer1kTokens: 0.003,
  },
  premium: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 16384,
    temperature: 0.7,
    costPer1kTokens: 0.015,
  },
};

// ═══ Task → Tier Mapping ═══
const TASK_TIER_MAP: Record<string, ModelTier> = {
  // Nano tier — classification, extraction, simple Q&A
  'load-classify': 'nano',
  'entity-extract': 'nano',
  'sentiment': 'nano',
  'tag-generate': 'nano',

  // Fast tier — chat, summaries, short generation
  'chat': 'fast',
  'rate-estimate': 'fast',
  'load-match': 'fast',
  'summarize': 'fast',
  'translate': 'fast',

  // Standard tier — reports, analysis, multi-step
  'load-analyze': 'standard',
  'rate-advise': 'standard',
  'compliance-check': 'standard',
  'market-report': 'standard',
  'corridor-intel': 'standard',

  // Premium tier — long generation, complex reasoning
  'full-report': 'premium',
  'dispute-draft': 'premium',
  'contract-review': 'premium',
  'route-optimize': 'premium',
};

/**
 * Get the optimal model config for a given task
 */
export function getModelForTask(task: string, overrideTier?: ModelTier): ModelConfig {
  const tier = overrideTier || TASK_TIER_MAP[task] || 'fast';
  return MODEL_REGISTRY[tier];
}

/**
 * Get model by explicit tier
 */
export function getModelByTier(tier: ModelTier): ModelConfig {
  return MODEL_REGISTRY[tier];
}

/**
 * Estimate cost for a request
 */
export function estimateCost(
  tier: ModelTier,
  inputTokens: number,
  outputTokens: number
): number {
  const config = MODEL_REGISTRY[tier];
  return ((inputTokens + outputTokens) / 1000) * config.costPer1kTokens;
}

/**
 * Check if user has budget remaining for the given tier
 * Used by usage-meter.ts for quota enforcement
 */
export function getTierForBudget(remainingBudgetCents: number): ModelTier {
  if (remainingBudgetCents >= 50) return 'premium';
  if (remainingBudgetCents >= 10) return 'standard';
  if (remainingBudgetCents >= 1) return 'fast';
  return 'nano';
}
