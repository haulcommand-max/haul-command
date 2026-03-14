/**
 * lib/ingestion/market-observation-engine.ts
 *
 * Main orchestrator for the Historical Market Observation Ingestion Engine.
 * Implements the full 8-step workflow from the spec.
 */

import { createHash } from "crypto";
import { splitBatchText, parseLine } from "./line-parser";
import { EntityStore } from "./entity-resolver";
import { CorridorStore } from "./corridor-builder";
import type {
    IngestionBatch,
    MarketObservation,
    ReputationObservation,
    BatchSummary,
    SourceType,
    SourceClassification,
    ServiceType,
    Urgency,
    PaymentTerms,
} from "./types";

// ════════════════════════════════════════════════════════════════
// MAIN ENGINE
// ════════════════════════════════════════════════════════════════

export interface IngestOptions {
    rawText: string;
    sourceName?: string;
    sourceType?: SourceType;
    countryHint?: string;
    batchDate?: string;
}

export interface IngestResult {
    batch: IngestionBatch;
    observations: MarketObservation[];
    reputationObservations: ReputationObservation[];
    entityStore: EntityStore;
    corridorStore: CorridorStore;
    summary: BatchSummary;
}

export function ingestBatch(options: IngestOptions): IngestResult {
    const {
        rawText,
        sourceName = null,
        sourceType = "pasted_text",
        countryHint = null,
        batchDate = null,
    } = options;

    const now = new Date().toISOString();
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // ── STEP 1: Batch Capture ──
    const textHash = createHash("sha256").update(rawText).digest("hex");
    const sourceClassification: SourceClassification =
        sourceType === "operator_group_post"
            ? "community_market_observation"
            : "historical_market_observation";

    // ── STEP 2: Split and Preparse ──
    const { observations: splitObs, unparsedLines } = splitBatchText(rawText, batchDate);

    // ── STEP 3 & 4: Parse and Normalize Each Line ──
    const entityStore = new EntityStore();
    const corridorStore = new CorridorStore();
    const observations: MarketObservation[] = [];
    const reputationObservations: ReputationObservation[] = [];

    const serviceMix: Record<ServiceType, number> = {
        lead: 0, chase: 0, steer: 0, route_survey: 0, permit_related: 0, unknown: 0,
    };
    const urgencyMix: Record<Urgency, number> = {
        immediate: 0, next_day: 0, timed: 0, standard: 0, unknown: 0,
    };
    const paymentMix: Record<PaymentTerms, number> = {
        quick_pay: 0, cod: 0, efs: 0, cashapp: 0, pay_at_end: 0, text_only: 0, unknown: 0,
    };

    let partialCount = 0;

    for (const { line, date, dateConfident } of splitObs) {
        const parsed = parseLine(line, date, dateConfident, countryHint);

        if (parsed.parse_confidence < 0.3) partialCount++;

        // ── STEP 5: Entity Resolution ──
        const entityId = entityStore.resolveEntity(parsed, batchId);

        // ── STEP 6a: Route Observation ──
        const corridorKey = corridorStore.addObservation(parsed, entityId);

        const obs: MarketObservation = {
            batch_id: batchId,
            source_name: sourceName,
            source_type: sourceType,
            raw_line: parsed.raw_line,
            observed_date: parsed.observed_date,
            ingested_at: now,
            parsed_name_or_company: parsed.parsed_name_or_company,
            raw_phone: parsed.raw_phone,
            normalized_phone: parsed.normalized_phone,
            origin_raw: parsed.origin_raw,
            origin_city: parsed.origin_city,
            origin_region: parsed.origin_region,
            destination_raw: parsed.destination_raw,
            destination_city: parsed.destination_city,
            destination_region: parsed.destination_region,
            service_type: parsed.service_type,
            urgency: parsed.urgency,
            payment_terms: parsed.payment_terms,
            role_candidates: parsed.role_candidates,
            reputation_signal: parsed.reputation_signal,
            truncation_flag: parsed.truncation_flag,
            parse_confidence: parsed.parse_confidence,
            country_code_if_known: parsed.country_code_if_known,
            linked_entity_id: entityId,
            corridor_key: corridorKey,
            route_cluster_key: corridorKey ? corridorKey.split("|").sort().join("|") : null,
        };
        observations.push(obs);

        // Track mixes
        serviceMix[parsed.service_type] = (serviceMix[parsed.service_type] || 0) + 1;
        urgencyMix[parsed.urgency] = (urgencyMix[parsed.urgency] || 0) + 1;
        paymentMix[parsed.payment_terms] = (paymentMix[parsed.payment_terms] || 0) + 1;

        // ── STEP 6b: Reputation Observation ──
        if (parsed.reputation_signal === "caution" && parsed.reputation_text) {
            reputationObservations.push({
                batch_id: batchId,
                raw_reputation_text: parsed.reputation_text,
                target_name: parsed.parsed_name_or_company,
                target_phone: parsed.normalized_phone,
                target_entity_id: entityId,
                repetition_count: 1,
                corroboration_count: 0,
                evidence_strength: "low",
                source_quality: "medium",
                confidence: parsed.parse_confidence,
                visibility: "internal_only",
                observed_date: parsed.observed_date,
                ingested_at: now,
            });
        }
    }

    // ── STEP 7: Derived Intelligence ──
    entityStore.finalizeScores();

    // Count stats
    const phoneCounter = new Map<string, number>();
    const nameCounter = new Map<string, number>();

    for (const obs of observations) {
        if (obs.normalized_phone) {
            phoneCounter.set(obs.normalized_phone, (phoneCounter.get(obs.normalized_phone) || 0) + 1);
        }
        if (obs.parsed_name_or_company) {
            const name = obs.parsed_name_or_company.toLowerCase();
            nameCounter.set(name, (nameCounter.get(name) || 0) + 1);
        }
    }

    const topPhones = Array.from(phoneCounter.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([phone, count]) => ({ phone, count }));

    const topNames = Array.from(nameCounter.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

    const topCorridors = corridorStore.getTopCorridors(10).map((c) => ({
        corridor: c.corridor_key,
        count: c.observation_count,
    }));

    // New entity stats
    let newOrgs = 0;
    let newContacts = 0;
    for (const entity of entityStore.entities.values()) {
        if (entity.entity_type === "organization") newOrgs++;
        else if (entity.entity_type === "contact") newContacts++;
    }

    // ── STEP 8: Batch Output ──
    const batch: IngestionBatch = {
        id: batchId,
        raw_text: rawText,
        text_hash: textHash,
        source_name: sourceName,
        source_type: sourceType,
        source_classification: sourceClassification,
        country_hint: countryHint,
        batch_date: batchDate,
        ingested_at: now,
        total_lines: splitObs.length + unparsedLines.length,
        parsed_lines: observations.length,
        partial_lines: partialCount,
        unparsed_lines: unparsedLines.length,
    };

    const summary: BatchSummary = {
        batch_id: batchId,
        total_lines_processed: observations.length,
        total_lines_partially_parsed: partialCount,
        total_unparsed_lines: unparsedLines.length,
        new_organizations_detected: newOrgs,
        new_contacts_detected: newContacts,
        new_alias_clusters_detected: entityStore.aliases.length,
        top_repeat_phones: topPhones,
        top_repeat_names: topNames,
        top_repeat_corridors: topCorridors,
        service_type_mix: serviceMix,
        urgency_mix: urgencyMix,
        payment_term_mix: paymentMix,
        new_internal_risk_signals: reputationObservations.length,
        claim_candidates: Array.from(entityStore.entities.values())
            .filter((e) => e.claim_priority_score >= 0.4).length,
        monetization_updates: Array.from(entityStore.entities.values())
            .filter((e) => e.monetization_value_score >= 0.3).length,
    };

    return {
        batch,
        observations,
        reputationObservations,
        entityStore,
        corridorStore,
        summary,
    };
}
