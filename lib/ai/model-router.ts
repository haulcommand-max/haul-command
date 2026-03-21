/**
 * AI Model Router — HAUL COMMAND
 * 
 * @deprecated This file is a SHIM. The canonical model router is at:
 *   lib/engines/model-router.ts
 * 
 * That file has the STRONGEST implementation:
 * - 3-provider strategy (Claude THINK / Gemini SEE / OpenAI ACT)
 * - 20 task types with primary + fallback providers
 * - Cross-checking for high-risk actions
 * - Quick route helpers
 * - Real model names (never fabricated)
 * 
 * This shim re-exports everything for backwards compatibility.
 * New code should import from '@/lib/engines/model-router'.
 */

export {
    type TaskType,
    type ModelTier,
    type ModelProvider,
    type ModelSelection,
    routeModel,
    estimateCost,
    requiresCrossCheck,
    quickRoute,
} from '../engines/model-router';

// Legacy aliases for backwards compat
import { routeModel } from '../engines/model-router';

export type ModelConfig = {
    provider: ModelProvider;
    model: string;
    maxTokens: number;
    temperature: number;
    costPer1kTokens: number;
};

import type { ModelProvider } from '../engines/model-router';

/**
 * @deprecated Use routeModel() from lib/engines/model-router instead.
 * This is a simplified wrapper for legacy call sites.
 */
export function getModelForTask(task: string): { model: string; provider: ModelProvider } {
    const taskTypeMap: Record<string, import('../engines/model-router').TaskType> = {
        'load-classify': 'classification',
        'entity-extract': 'extraction',
        'sentiment': 'scoring',
        'tag-generate': 'classification',
        'chat': 'summarization',
        'rate-estimate': 'recommendation',
        'load-match': 'dispatch',
        'summarize': 'summarization',
        'translate': 'creative',
        'load-analyze': 'reasoning',
        'rate-advise': 'recommendation',
        'compliance-check': 'compliance',
        'market-report': 'reasoning',
        'corridor-intel': 'reasoning',
        'full-report': 'reasoning',
        'dispute-draft': 'contract',
        'contract-review': 'contract',
        'route-optimize': 'dispatch',
    };

    const mappedTask = taskTypeMap[task] || 'summarization';
    const result = routeModel({
        task_type: mappedTask,
        urgency: 'medium',
        importance: 'medium',
        user_tier: 'pro',
        input_length: 500,
        confidence_requirement: 'medium',
    });

    return { model: result.model, provider: result.provider };
}

/**
 * @deprecated Use routeModel() from lib/engines/model-router instead.
 */
export function getModelByTier(tier: 'nano' | 'fast' | 'standard' | 'premium'): { model: string; provider: ModelProvider } {
    const tierMap: Record<string, import('../engines/model-router').ModelTier> = {
        'nano': 'mini',
        'fast': 'mini',
        'standard': 'standard',
        'premium': 'premium',
    };
    const mappedTier = tierMap[tier] || 'standard';
    const result = routeModel({
        task_type: 'summarization',
        urgency: 'medium',
        importance: 'medium',
        user_tier: 'pro',
        input_length: 500,
        confidence_requirement: 'medium',
    });
    return { model: result.model, provider: result.provider };
}

/**
 * @deprecated Use routeModel() from lib/engines/model-router instead.
 */
export function getTierForBudget(remainingBudgetCents: number): 'nano' | 'fast' | 'standard' | 'premium' {
    if (remainingBudgetCents >= 50) return 'premium';
    if (remainingBudgetCents >= 10) return 'standard';
    if (remainingBudgetCents >= 1) return 'fast';
    return 'nano';
}
