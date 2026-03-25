/**
 * lib/engines/model-router.ts
 *
 * MULTI-MODEL ROUTING ENGINE (HAUL COMMAND)
 * Purpose: Dynamically route each request to the optimal AI model (Gemini, GPT, Claude)
 * based on cost, latency, task type, and expected output quality.
 * "AI infrastructure arbitrage"
 */

export type ModelProvider = 'gemini' | 'gpt' | 'claude';
export type TaskCategory = 
  | 'geo_enrichment' 
  | 'localization_translation' 
  | 'batch_data_processing' 
  | 'multimodal_processing' 
  | 'structured_reasoning' 
  | 'code_generation' 
  | 'system_design' 
  | 'long_form_analysis' 
  | 'document_review' 
  | 'safety_sensitive';

export interface RouteConstraints {
  cost_priority: 'high' | 'medium' | 'low';
  latency_priority: 'high' | 'medium' | 'low';
  quality_priority: 'high' | 'medium' | 'low';
}

export interface RouteInput {
  task_type: TaskCategory;
  prompt: string;
  token_estimate: number;
  constraints: RouteConstraints;
}

export interface ModelProfile {
  id: string;
  provider: ModelProvider;
  cost_profile: 'low' | 'medium_high' | 'high';
  latency: 'low' | 'medium_high' | 'medium' | 'high';
  strengths: string[];
  weaknesses: string[];
  base_scores: {
    cost: number;        // Higher is better (cheaper)
    quality: number;     // Higher is better
    latency: number;     // Higher is better (faster)
    reliability: number; // Higher is better
  }
}

const REGISTRY: Record<ModelProvider, ModelProfile> = {
  gemini: {
    id: 'gemini-1.5-pro',
    provider: 'gemini',
    cost_profile: 'low',
    latency: 'low',
    strengths: ['low_cost_high_volume', 'multimodal_processing', 'localization_translation', 'long_context', 'data_enrichment', 'map_and_geo_processing'],
    weaknesses: ['ultra_precise_reasoning_edge_cases', 'complex_chain_logic'],
    base_scores: { cost: 100, quality: 75, latency: 95, reliability: 85 }
  },
  gpt: {
    id: 'gpt-4o',
    provider: 'gpt',
    cost_profile: 'high',
    latency: 'medium',
    strengths: ['structured_reasoning', 'system_design', 'code_generation', 'high_precision_logic'],
    weaknesses: ['higher_cost', 'less_efficient_at_large_batch_enrichment'],
    base_scores: { cost: 40, quality: 95, latency: 70, reliability: 90 }
  },
  claude: {
    id: 'claude-3-opus-20240229',
    provider: 'claude',
    cost_profile: 'medium_high',
    latency: 'medium_high',
    strengths: ['long_form_reasoning', 'safety_consistency', 'document_analysis', 'nuanced_thinking'],
    weaknesses: ['slower', 'higher_cost_for_scale_tasks'],
    base_scores: { cost: 50, quality: 90, latency: 60, reliability: 95 }
  }
};

const TASK_PREFERRED_MODELS: Record<TaskCategory, ModelProvider> = {
  geo_enrichment: 'gemini',
  localization_translation: 'gemini',
  batch_data_processing: 'gemini',
  multimodal_processing: 'gemini',
  structured_reasoning: 'gpt',
  code_generation: 'gpt',
  system_design: 'gpt',
  long_form_analysis: 'claude',
  document_review: 'claude',
  safety_sensitive: 'claude'
};

const WEIGHTS = {
  cost: 0.4,
  quality: 0.3,
  latency: 0.2,
  reliability: 0.1
};

function mapPriorityToWeight(priority: 'high' | 'medium' | 'low'): number {
  if (priority === 'high') return 1.5;
  if (priority === 'low') return 0.5;
  return 1.0;
}

/**
 * Calculates a dynamic score for a model based on constraints and baseline capabilities.
 */
export function selectModel(input: RouteInput): ModelProfile {
  let bestModel: ModelProfile | null = null;
  let highestScore = -Infinity;

  const costMultiplier = mapPriorityToWeight(input.constraints.cost_priority);
  const latencyMultiplier = mapPriorityToWeight(input.constraints.latency_priority);
  const qualityMultiplier = mapPriorityToWeight(input.constraints.quality_priority);

  // Hard overrides based on rules
  if (input.token_estimate > 32000) {
    // Large context heavily biases towards Gemini or Claude, but let's let the math decide, 
    // we just aggressively modify the cost parameters to favor cheaper high-volume models.
  }

  const preferredProvider = TASK_PREFERRED_MODELS[input.task_type];

  // Evaluate each model like a hedge fund routing trades
  for (const [providerKey, profile] of Object.entries(REGISTRY)) {
    const provider = providerKey as ModelProvider;
    
    // Base formula calculations
    let scoreCost = profile.base_scores.cost * WEIGHTS.cost * costMultiplier;
    let scoreQuality = profile.base_scores.quality * WEIGHTS.quality * qualityMultiplier;
    let scoreLatency = profile.base_scores.latency * WEIGHTS.latency * latencyMultiplier;
    let scoreReliability = profile.base_scores.reliability * WEIGHTS.reliability;

    // Task Preference Bonus
    if (provider === preferredProvider) {
      scoreQuality += 20; // 20 point logical bonus for being the preferred engine for this task
    }

    // Token batching penalties (if huge tokens and model is expensive, penalize heavily)
    if (input.token_estimate > 10000 && profile.cost_profile === 'high') {
      scoreCost -= 30; // GPT penalty for massive long-context where it gets super expensive
    }

    const totalScore = scoreCost + scoreQuality + scoreLatency + scoreReliability;
    
    if (totalScore > highestScore) {
      highestScore = totalScore;
      bestModel = profile;
    }
  }

  return bestModel!;
}

/**
 * Split execution logic placeholder (15X feature)
 */
export function createHybridExecutionPlan(taskType: TaskCategory) {
  if (taskType === 'structured_reasoning') {
    return {
      step1: { provider: 'gemini', action: 'enrich_data_and_context' },
      step2: { provider: 'gpt', action: 'structure_output_and_logic' },
      step3: { provider: 'claude', action: 'validate_reasoning_and_safety' }
    };
  }
  return { step1: { provider: TASK_PREFERRED_MODELS[taskType], action: 'execute_all' } };
}

export function estimateCost(provider: ModelProvider, tokens: number): number {
  // Rough baseline per 1k total tokens for estimation
  const rates = {
    gemini: 0.0005,
    gpt: 0.01,
    claude: 0.008
  };
  return (tokens / 1000) * rates[provider];
}
