/**
 * Model Router
 * 
 * Chooses the cheapest acceptable model by task type.
 * Supports both OpenAI and Gemini models.
 * Protects AI margin by routing low-value tasks to cheaper models
 * and reserving expensive models for high-stakes decisions.
 * Gemini is the default for creative tasks (ad copy, landing pages).
 */

export type TaskType =
    | 'classification'      // Role/category classification
    | 'extraction'          // Data extraction from text
    | 'scoring'             // Score/rating computation
    | 'recommendation'      // Match/fit recommendations
    | 'explanation'         // Score explanations for users
    | 'creative'            // Ad copy, landing page generation → GEMINI
    | 'summarization'       // Call/doc summarization
    | 'moderation'          // Content moderation
    | 'reasoning'           // Complex multi-step reasoning
    | 'code_generation'     // Code/query generation
    | 'embedding';          // Text embedding

export type ModelTier = 'mini' | 'standard' | 'premium';
export type ModelProvider = 'openai' | 'gemini';

export interface ModelSelection {
    model: string;
    provider: ModelProvider;
    tier: ModelTier;
    max_tokens: number;
    temperature: number;
    cache_ttl_seconds: number;
    batch_eligible: boolean;
    estimated_cost_per_1k_tokens: number;
}

interface RouterInput {
    task_type: TaskType;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    importance: 'low' | 'medium' | 'high';
    user_tier: 'free' | 'pro' | 'enterprise';
    input_length: number; // approx token count
    confidence_requirement: 'low' | 'medium' | 'high';
    prefer_provider?: ModelProvider; // optional: force a provider
}

// OpenAI model definitions
const OPENAI_MODELS: Record<ModelTier, { name: string; cost_per_1k: number }> = {
    mini: { name: 'gpt-4.1-mini', cost_per_1k: 0.0004 },
    standard: { name: 'gpt-4.1-nano', cost_per_1k: 0.001 },
    premium: { name: 'gpt-4.1', cost_per_1k: 0.03 },
};

// Gemini model definitions
const GEMINI_MODELS: Record<ModelTier, { name: string; cost_per_1k: number }> = {
    mini: { name: 'gemini-2.0-flash-lite', cost_per_1k: 0.0003 },
    standard: { name: 'gemini-2.5-flash', cost_per_1k: 0.0005 },
    premium: { name: 'gemini-2.5-pro', cost_per_1k: 0.015 },
};

// Tasks that default to Gemini (creative engine)
const GEMINI_DEFAULT_TASKS: Set<TaskType> = new Set(['creative']);

// Task → default tier mapping
const TASK_DEFAULTS: Record<TaskType, { tier: ModelTier; temp: number; cache: number }> = {
    classification: { tier: 'mini', temp: 0.0, cache: 3600 },
    extraction: { tier: 'mini', temp: 0.0, cache: 1800 },
    scoring: { tier: 'mini', temp: 0.0, cache: 900 },
    moderation: { tier: 'mini', temp: 0.0, cache: 600 },
    summarization: { tier: 'mini', temp: 0.3, cache: 1800 },
    recommendation: { tier: 'standard', temp: 0.2, cache: 600 },
    explanation: { tier: 'standard', temp: 0.5, cache: 1800 },
    creative: { tier: 'standard', temp: 0.8, cache: 300 },
    reasoning: { tier: 'premium', temp: 0.2, cache: 300 },
    code_generation: { tier: 'premium', temp: 0.1, cache: 600 },
    embedding: { tier: 'mini', temp: 0.0, cache: 86400 },
};

// Max tokens by task type
const MAX_TOKENS: Record<TaskType, number> = {
    classification: 50,
    extraction: 500,
    scoring: 200,
    moderation: 100,
    summarization: 500,
    recommendation: 800,
    explanation: 600,
    creative: 1500,
    reasoning: 2000,
    code_generation: 2000,
    embedding: 0,
};

export function routeModel(input: RouterInput): ModelSelection {
    const defaults = TASK_DEFAULTS[input.task_type];
    let tier = defaults.tier;
    let temp = defaults.temp;
    let cacheTtl = defaults.cache;

    // Determine provider: explicit preference > task default > openai
    const provider: ModelProvider = input.prefer_provider
        ?? (GEMINI_DEFAULT_TASKS.has(input.task_type) ? 'gemini' : 'openai');

    // Upgrade rules
    if (input.confidence_requirement === 'high' && tier === 'mini') {
        tier = 'standard';
    }
    if (input.importance === 'high' && tier !== 'premium') {
        tier = tier === 'mini' ? 'standard' : 'premium';
    }
    if (input.urgency === 'critical' && input.importance === 'high') {
        tier = 'premium';
    }

    // Downgrade rules (cost protection)
    if (input.user_tier === 'free' && tier === 'premium') {
        tier = 'standard'; // Free users don't get premium models
    }
    if (input.urgency === 'low' && input.importance === 'low') {
        tier = 'mini'; // Low-priority always goes mini
        cacheTtl = Math.max(cacheTtl, 3600); // Cache more aggressively
    }

    // Enterprise users get premium for all high-importance tasks
    if (input.user_tier === 'enterprise' && input.importance === 'high') {
        tier = 'premium';
    }

    // Batch eligibility: non-urgent, non-critical
    const batchEligible = input.urgency === 'low' && input.importance !== 'high';

    // Long inputs: bump to standard minimum for quality
    if (input.input_length > 2000 && tier === 'mini') {
        tier = 'standard';
    }

    const models = provider === 'gemini' ? GEMINI_MODELS : OPENAI_MODELS;
    const model = models[tier];

    return {
        model: model.name,
        provider,
        tier,
        max_tokens: MAX_TOKENS[input.task_type] || 500,
        temperature: temp,
        cache_ttl_seconds: cacheTtl,
        batch_eligible: batchEligible,
        estimated_cost_per_1k_tokens: model.cost_per_1k,
    };
}

/**
 * Estimate cost for a specific task
 */
export function estimateCost(input: RouterInput, outputTokens: number = 500): number {
    const selection = routeModel(input);
    const totalTokens = input.input_length + outputTokens;
    return (totalTokens / 1000) * selection.estimated_cost_per_1k_tokens;
}

/**
 * Quick route helpers
 */
export const quickRoute = {
    classify: (text: string, userTier: 'free' | 'pro' | 'enterprise' = 'free') =>
        routeModel({ task_type: 'classification', urgency: 'medium', importance: 'low', user_tier: userTier, input_length: text.length / 4, confidence_requirement: 'medium' }),

    explain: (userTier: 'free' | 'pro' | 'enterprise' = 'pro') =>
        routeModel({ task_type: 'explanation', urgency: 'medium', importance: 'medium', user_tier: userTier, input_length: 500, confidence_requirement: 'medium' }),

    creative: (userTier: 'free' | 'pro' | 'enterprise' = 'pro') =>
        routeModel({ task_type: 'creative', urgency: 'low', importance: 'medium', user_tier: userTier, input_length: 300, confidence_requirement: 'low' }),

    reason: (userTier: 'free' | 'pro' | 'enterprise' = 'enterprise') =>
        routeModel({ task_type: 'reasoning', urgency: 'high', importance: 'high', user_tier: userTier, input_length: 1000, confidence_requirement: 'high' }),
};
