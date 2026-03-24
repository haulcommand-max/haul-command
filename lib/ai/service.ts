/**
 * lib/ai/service.ts — DEPRECATED SHIM
 *
 * This file previously contained all AI calls hard-coded to Claude.
 * It has been replaced by the 3-Brain system in lib/ai/brain.ts:
 *
 *   think() → Claude  (compliance, contracts, fraud, reasoning)
 *   see()   → Gemini  (creative, ads, enrichment, vision, grounding)
 *   act()   → OpenAI  (dispatch, extraction, structured JSON, agents)
 *
 * All existing callers of this file now import from lib/ai/brain.ts.
 * This shim re-exports the unified API so any remaining imports don’t break.
 *
 * DO NOT ADD NEW CALLS HERE. Use lib/ai/brain.ts directly.
 */

export {
  think,
  see,
  act,
  think as queryAI,            // backward compat alias
  see as generateContent,      // backward compat alias
  act as extractStructured,    // backward compat alias
  generateAdCopy,
  generateSEOContent,
  enrichOperatorProfile,
  generateLinkedInPost,
  generateYouTubeScript,
  parseCertificateImage,
  generateRegulationSummary,
  enrichLoadDescription,
  matchDispatch,
  parseLoadAlert,
  classifyOperator,
  analyzeReview,
  analyzeCompliance,
  generateContract,
  detectFraud,
  adviseRate,
  detectAnomaly,
  generateRouteSurvey,
  batchEnrichListings,
  batchGenerateMetaDescriptions,
} from './brain';

export { tracked } from './tracker';
export { cacheGet, cacheSet, CACHE_TTL } from './cache';
export { PROMPTS } from './prompts';
export { MODELS, COST_PER_1K } from './brain';
