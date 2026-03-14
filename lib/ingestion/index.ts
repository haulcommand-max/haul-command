/**
 * lib/ingestion/index.ts
 * Public API surface for the ingestion engine.
 */

export { ingestBatch, type IngestOptions, type IngestResult } from "./market-observation-engine";
export { parseLine, splitBatchText, detectDateHeader, extractPhones, normalizePhone } from "./line-parser";
export { EntityStore } from "./entity-resolver";
export { CorridorStore } from "./corridor-builder";
export * from "./types";
