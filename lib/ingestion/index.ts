/**
 * lib/ingestion/index.ts
 * Public API surface for the ingestion engine.
 * 
 * Unified barrel export — all modules accessible from '@/lib/ingestion'.
 */

// Core Market Observation Engine
export { ingestBatch, type IngestOptions, type IngestResult } from "./market-observation-engine";
export { parseLine, splitBatchText, detectDateHeader, extractPhones, normalizePhone } from "./line-parser";
export { EntityStore } from "./entity-resolver";
export { CorridorStore } from "./corridor-builder";
export * from "./types";

// Anti-Gravity Pipeline Modules
export { processCrawlJob } from "./global-crawler";
export { aiExtractFromText, type AgentExtractionResult } from "./ai-extractor";
export { matchAndInsertEntity } from "./dedupe-engine";
export { processClaimTriggers, enrichEntityProfile } from "./trigger-engine";
export { generateSearchKeywordsForRegion, queueGlobalExpansionTasks, phaseThreeGraphExpansion } from "./global-expansion";
