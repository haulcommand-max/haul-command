/**
 * Model Router — 3-Provider Strategy
 * 
 * 🧠 Claude (Anthropic) = INTELLIGENCE — Deep reasoning, contracts, compliance, complex decisions
 * 👁️ Gemini (Google) = PERCEPTION — Multimodal, creative, visual parsing, ad generation
 * ⚙️ OpenAI = CONTROL — Execution, structured output, function calling, agent orchestration
 * 
 * Every critical agent has: Primary model + Fallback (different provider)
 * 
 * Routing: Think → Claude | See → Gemini | Act → OpenAI
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
    | 'reasoning'           // Complex multi-step reasoning → CLAUDE
    | 'code_generation'     // Code/query generation
    | 'embedding'           // Text embedding
    | 'negotiation'         // Rate/contract negotiation → CLAUDE
    | 'compliance'          // Legal / regulatory analysis → CLAUDE
    | 'contract'            // Contract generation → CLAUDE
    | 'dispatch'            // Load matching / dispatch → OPENAI
    | 'structured_output'   // JSON / structured data → OPENAI
    | 'agent_routing'       // Agent coordination → OPENAI
    | 'visual_parsing'      // Image/map analysis → GEMINI
    | 'ad_generation'       // Ad creative generation → GEMINI
    | 'fraud_detection';    // Fraud / scam detection → CLAUDE

export type ModelTier = 'mini' | 'standard' | 'premium';
export type ModelProvider = 'claude' | 'gemini' | 'openai';

export interface ModelSelection {
    model: string;
    provider: ModelProvider;
    tier: ModelTier;
    max_tokens: number;
    temperature: number;
    cache_ttl_seconds: number;
    batch_eligible: boolean;
    estimated_cost_per_1k_tokens: number;
    fallback: {
        model: string;
        provider: ModelProvider;
    };
}

interface RouterInput {
    task_type: TaskType;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    importance: 'low' | 'medium' | 'high';
    user_tier: 'free' | 'pro' | 'enterprise';
    input_length: number;
    confidence_requirement: 'low' | 'medium' | 'high';
    prefer_provider?: ModelProvider;
}

// ── Model definitions ────────────────────────────────────────
const CLAUDE_MODELS: Record<ModelTier, { name: string; cost_per_1k: number }> = {
    mini: { name: 'claude-haiku-4-5-20251001', cost_per_1k: 0.00025 },
    standard: { name: 'claude-sonnet-4-6', cost_per_1k: 0.003 },
    premium: { name: 'claude-opus-4-6', cost_per_1k: 0.015 },
};

const GEMINI_MODELS: Record<ModelTier, { name: string; cost_per_1k: number }> = {
    mini: { name: 'gemini-2.0-flash-lite', cost_per_1k: 0.0003 },
    standard: { name: 'gemini-2.5-flash', cost_per_1k: 0.0005 },
    premium: { name: 'gemini-2.5-pro', cost_per_1k: 0.015 },
};

const OPENAI_MODELS: Record<ModelTier, { name: string; cost_per_1k: number }> = {
    mini: { name: 'gpt-4o-mini', cost_per_1k: 0.00015 },
    standard: { name: 'gpt-4o', cost_per_1k: 0.005 },
    premium: { name: 'o3', cost_per_1k: 0.010 },
};

const ALL_MODELS: Record<ModelProvider, Record<ModelTier, { name: string; cost_per_1k: number }>> = {
    claude: CLAUDE_MODELS,
    gemini: GEMINI_MODELS,
    openai: OPENAI_MODELS,
};

// ── Provider routing: THINK → Claude | SEE → Gemini | ACT → OpenAI ──
const TASK_PROVIDER: Record<TaskType, { primary: ModelProvider; fallback: ModelProvider }> = {
    // CLAUDE = THINK (intelligence, reasoning, compliance)
    reasoning: { primary: 'claude', fallback: 'openai' },
    compliance: { primary: 'claude', fallback: 'openai' },
    contract: { primary: 'claude', fallback: 'openai' },
    negotiation: { primary: 'claude', fallback: 'openai' },
    fraud_detection: { primary: 'claude', fallback: 'openai' },
    explanation: { primary: 'claude', fallback: 'gemini' },
    recommendation: { primary: 'claude', fallback: 'openai' },

    // GEMINI = SEE (visual, creative, multimodal)
    creative: { primary: 'gemini', fallback: 'openai' },
    visual_parsing: { primary: 'gemini', fallback: 'openai' },
    ad_generation: { primary: 'gemini', fallback: 'openai' },

    // OPENAI = ACT (execution, structured output, agent coordination)
    extraction: { primary: 'openai', fallback: 'claude' },
    structured_output: { primary: 'openai', fallback: 'claude' },
    dispatch: { primary: 'openai', fallback: 'claude' },
    agent_routing: { primary: 'openai', fallback: 'claude' },
    classification: { primary: 'openai', fallback: 'claude' },

    // Flexible (cheapest wins)
    scoring: { primary: 'openai', fallback: 'claude' },
    moderation: { primary: 'openai', fallback: 'claude' },
    summarization: { primary: 'claude', fallback: 'gemini' },
    code_generation: { primary: 'claude', fallback: 'openai' },
    embedding: { primary: 'openai', fallback: 'gemini' },
};

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
    negotiation: { tier: 'standard', temp: 0.3, cache: 300 },
    compliance: { tier: 'standard', temp: 0.1, cache: 3600 },
    contract: { tier: 'premium', temp: 0.1, cache: 600 },
    dispatch: { tier: 'standard', temp: 0.1, cache: 300 },
    structured_output: { tier: 'mini', temp: 0.0, cache: 1800 },
    agent_routing: { tier: 'mini', temp: 0.0, cache: 300 },
    visual_parsing: { tier: 'standard', temp: 0.2, cache: 600 },
    ad_generation: { tier: 'standard', temp: 0.8, cache: 300 },
    fraud_detection: { tier: 'standard', temp: 0.1, cache: 600 },
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
    negotiation: 800,
    compliance: 1500,
    contract: 3000,
    dispatch: 500,
    structured_output: 1000,
    agent_routing: 200,
    visual_parsing: 1000,
    ad_generation: 1500,
    fraud_detection: 500,
};

export function routeModel(input: RouterInput): ModelSelection {
    const defaults = TASK_DEFAULTS[input.task_type];
    let tier = defaults.tier;
    const temp = defaults.temp;
    let cacheTtl = defaults.cache;

    // Provider selection: explicit > task default
    const taskRouting = TASK_PROVIDER[input.task_type];
    const provider: ModelProvider = input.prefer_provider ?? taskRouting.primary;
    const fallbackProvider = provider === taskRouting.primary ? taskRouting.fallback : taskRouting.primary;

    // Upgrade rules
    if (input.confidence_requirement === 'high' && tier === 'mini') tier = 'standard';
    if (input.importance === 'high' && tier !== 'premium') tier = tier === 'mini' ? 'standard' : 'premium';
    if (input.urgency === 'critical' && input.importance === 'high') tier = 'premium';

    // Downgrade rules (cost protection)
    if (input.user_tier === 'free' && tier === 'premium') tier = 'standard';
    if (input.urgency === 'low' && input.importance === 'low') {
        tier = 'mini';
        cacheTtl = Math.max(cacheTtl, 3600);
    }

    // Enterprise users get premium for all high-importance tasks
    if (input.user_tier === 'enterprise' && input.importance === 'high') tier = 'premium';

    // Batch eligibility
    const batchEligible = input.urgency === 'low' && input.importance !== 'high';

    // Long inputs: bump to standard minimum
    if (input.input_length > 2000 && tier === 'mini') tier = 'standard';

    const models = ALL_MODELS[provider];
    const model = models[tier];
    const fallbackModel = ALL_MODELS[fallbackProvider][tier];

    return {
        model: model.name,
        provider,
        tier,
        max_tokens: MAX_TOKENS[input.task_type] || 500,
        temperature: temp,
        cache_ttl_seconds: cacheTtl,
        batch_eligible: batchEligible,
        estimated_cost_per_1k_tokens: model.cost_per_1k,
        fallback: {
            model: fallbackModel.name,
            provider: fallbackProvider,
        },
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
 * Cross-checking: For high-risk actions (payments, contracts),
 * Claude decides → OpenAI validates structure → execute
 */
export function requiresCrossCheck(taskType: TaskType): boolean {
    return ['contract', 'negotiation', 'fraud_detection', 'dispatch', 'compliance'].includes(taskType);
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

    negotiate: (userTier: 'free' | 'pro' | 'enterprise' = 'pro') =>
        routeModel({ task_type: 'negotiation', urgency: 'high', importance: 'high', user_tier: userTier, input_length: 800, confidence_requirement: 'high' }),

    contract: (userTier: 'free' | 'pro' | 'enterprise' = 'enterprise') =>
        routeModel({ task_type: 'contract', urgency: 'high', importance: 'high', user_tier: userTier, input_length: 1000, confidence_requirement: 'high' }),

    dispatch: (userTier: 'free' | 'pro' | 'enterprise' = 'pro') =>
        routeModel({ task_type: 'dispatch', urgency: 'critical', importance: 'high', user_tier: userTier, input_length: 500, confidence_requirement: 'high' }),

    compliance: (userTier: 'free' | 'pro' | 'enterprise' = 'pro') =>
        routeModel({ task_type: 'compliance', urgency: 'medium', importance: 'high', user_tier: userTier, input_length: 800, confidence_requirement: 'high' }),

    adCreative: (userTier: 'free' | 'pro' | 'enterprise' = 'pro') =>
        routeModel({ task_type: 'ad_generation', urgency: 'low', importance: 'medium', user_tier: userTier, input_length: 300, confidence_requirement: 'low' }),
};
