/**
 * tests/unit/market-ingestion.test.ts
 *
 * Comprehensive tests for the Historical Market Observation Ingestion Engine.
 * Tests line parsing, entity resolution, corridor building, and full pipeline.
 */
import { describe, it, expect } from "vitest";
import {
    parseLine,
    splitBatchText,
    detectDateHeader,
    extractPhones,
    normalizePhone,
} from "@/lib/ingestion/line-parser";
import { EntityStore } from "@/lib/ingestion/entity-resolver";
import { CorridorStore } from "@/lib/ingestion/corridor-builder";
import { ingestBatch } from "@/lib/ingestion/market-observation-engine";

// ════════════════════════════════════════════════════════════════
// LINE PARSER
// ════════════════════════════════════════════════════════════════

describe("Line Parser", () => {
    describe("extractPhones", () => {
        it("extracts standard US phone numbers", () => {
            expect(extractPhones("Call 555-123-4567")).toEqual(["555-123-4567"]);
        });

        it("extracts parenthesized area code", () => {
            expect(extractPhones("(918) 555-1234")).toEqual(["(918) 555-1234"]);
        });

        it("extracts multiple phones", () => {
            const phones = extractPhones("Call 555-111-2222 or 555-333-4444");
            expect(phones.length).toBe(2);
        });

        it("returns empty for no phone", () => {
            expect(extractPhones("No phone here")).toEqual([]);
        });
    });

    describe("normalizePhone", () => {
        it("strips non-numeric chars", () => {
            expect(normalizePhone("(555) 123-4567")).toBe("5551234567");
        });

        it("strips leading 1 from 11-digit", () => {
            expect(normalizePhone("1-555-123-4567")).toBe("5551234567");
        });
    });

    describe("detectDateHeader", () => {
        it("detects ISO date", () => {
            expect(detectDateHeader("2026-03-13")).toBe("2026-03-13");
        });

        it("detects US date format", () => {
            const result = detectDateHeader("3/13/2026");
            expect(result).toBeTruthy();
        });

        it("detects long month format", () => {
            const result = detectDateHeader("March 13, 2026");
            expect(result).toBeTruthy();
        });

        it("returns null for non-date lines", () => {
            expect(detectDateHeader("Load Alert!! Need chase car")).toBeNull();
        });
    });

    describe("parseLine", () => {
        it("parses a typical load alert line", () => {
            const result = parseLine(
                "Load Alert!! ABC Transport 555-123-4567 Lead Dallas, TX to Houston, TX ASAP QP",
                "2026-03-13",
                true,
                "US"
            );

            expect(result.service_type).toBe("lead");
            expect(result.urgency).toBe("immediate");
            expect(result.payment_terms).toBe("quick_pay");
            expect(result.raw_phone).toBe("555-123-4567");
            expect(result.normalized_phone).toBe("5551234567");
            expect(result.origin_region).toBe("TX");
            expect(result.destination_region).toBe("TX");
            expect(result.country_code_if_known).toBe("US");
            expect(result.parse_confidence).toBeGreaterThan(0.5);
        });

        it("detects caution/reputation signals", () => {
            const result = parseLine(
                "BEWARE of Sketchy Transport - scammer - won't pay",
                "2026-03-13",
                true,
                "US"
            );
            expect(result.reputation_signal).toBe("caution");
            expect(result.reputation_text).toBeTruthy();
        });

        it("detects chase service type", () => {
            const result = parseLine(
                "Need chase car Dallas TX to OKC OK",
                "2026-03-13",
                true,
                "US"
            );
            expect(result.service_type).toBe("chase");
        });

        it("detects steer service type", () => {
            const result = parseLine(
                "Need 2 pole cars steer from Denver CO to Cheyenne WY",
                "2026-03-13",
                true,
                "US"
            );
            expect(result.service_type).toBe("steer");
        });

        it("detects COD payment", () => {
            const result = parseLine(
                "Lead car needed $$$COD$ 918-555-1234",
                "2026-03-13",
                true,
                "US"
            );
            expect(result.payment_terms).toBe("cod");
        });

        it("detects permit_related service", () => {
            const result = parseLine(
                "Permit Solutions - route survey needed TX to OK",
                "2026-03-13",
                true,
                "US"
            );
            // Could be either route_survey or permit_related depending on match order
            expect(["route_survey", "permit_related"]).toContain(result.service_type);
        });

        it("flags truncated lines", () => {
            const result = parseLine(
                "ABC Transport needs lead car from Austin TX to...",
                "2026-03-13",
                true,
                "US"
            );
            expect(result.truncation_flag).toBe(true);
        });

        it("handles lines with no identifiable data", () => {
            const result = parseLine(
                "This is just random text with nothing useful",
                "2026-03-13",
                false,
                null
            );
            expect(result.service_type).toBe("unknown");
            expect(result.parsed_name_or_company).toBeNull();
            expect(result.normalized_phone).toBeNull();
        });

        it("detects role hints", () => {
            const result = parseLine(
                "XYZ Logistics - dispatch needed for pilot car job 555-000-1111",
                "2026-03-13",
                true,
                "US"
            );
            expect(result.role_candidates).toContain("broker");
        });
    });
});

// ════════════════════════════════════════════════════════════════
// BATCH SPLITTER
// ════════════════════════════════════════════════════════════════

describe("Batch Splitter", () => {
    it("splits multi-line text with date headers", () => {
        const text = `March 13, 2026
Load Alert!! ABC Transport 555-111-2222 Lead Dallas TX to Houston TX
Load Alert!! DEF Logistics 555-333-4444 Chase OKC OK to Tulsa OK

March 14, 2026
Load Alert!! GHI Express 555-555-6666 Lead Austin TX to San Antonio TX`;

        const result = splitBatchText(text, null);
        expect(result.observations.length).toBe(3);
        expect(result.observations[0].date).toBeTruthy();
        expect(result.observations[2].dateConfident).toBe(true);
    });

    it("uses batch date as fallback", () => {
        const text = "Load Alert!! Needs pilot car 555-123-4567 Lead Dallas TX to Houston TX";
        const result = splitBatchText(text, "2025-06-15");
        expect(result.observations[0].date).toBe("2025-06-15");
    });

    it("skips empty lines", () => {
        const text = "\n\n\nLoad Alert!! Test 555-123-4567\n\n\n";
        const result = splitBatchText(text, null);
        expect(result.observations.length).toBe(1);
    });
});

// ════════════════════════════════════════════════════════════════
// ENTITY RESOLVER
// ════════════════════════════════════════════════════════════════

describe("Entity Resolver", () => {
    it("creates new entity for first observation", () => {
        const store = new EntityStore();
        const parsed = parseLine(
            "Load Alert!! ABC Transport 555-111-2222 Lead Dallas TX to Houston TX",
            "2026-03-13",
            true,
            "US"
        );
        const entityId = store.resolveEntity(parsed, "batch-1");
        expect(entityId).toBeTruthy();
        expect(store.entities.size).toBe(1);
    });

    it("dedupes by phone number", () => {
        const store = new EntityStore();
        const p1 = parseLine(
            "ABC Transport 555-111-2222 Lead Dallas TX",
            "2026-03-13",
            true,
            "US"
        );
        const p2 = parseLine(
            "ABC Different Name 555-111-2222 Chase Houston TX",
            "2026-03-14",
            true,
            "US"
        );

        store.resolveEntity(p1, "batch-1");
        store.resolveEntity(p2, "batch-1");

        // Should dedupe into 1 entity because same phone
        expect(store.entities.size).toBe(1);
        const entity = Array.from(store.entities.values())[0];
        expect(entity.observation_count).toBe(2);
    });

    it("creates alias for name variants", () => {
        const store = new EntityStore();
        const p1 = parseLine("ABC Transport 555-999-8888 Lead", "2026-03-13", true, "US");
        const p2 = parseLine("ABC Trans 555-999-8888 Chase", "2026-03-14", true, "US");

        store.resolveEntity(p1, "batch-1");
        store.resolveEntity(p2, "batch-1");

        // Should have 2 aliases
        expect(store.aliases.length).toBe(2);
    });

    it("increases internal risk for caution signals", () => {
        const store = new EntityStore();
        const parsed = parseLine(
            "Sketchy Logistics 555-111-3333 scammer won't pay",
            "2026-03-13",
            true,
            "US"
        );
        store.resolveEntity(parsed, "batch-1");

        const entity = Array.from(store.entities.values())[0];
        expect(entity.internal_risk_score).toBeGreaterThan(0);
    });

    it("computes recurrence scores after finalize", () => {
        const store = new EntityStore();
        for (let i = 0; i < 5; i++) {
            const p = parseLine(
                `Big Fleet Transport 555-222-3333 Lead Run ${i}`,
                "2026-03-13",
                true,
                "US"
            );
            store.resolveEntity(p, "batch-1");
        }
        store.finalizeScores();

        const entity = Array.from(store.entities.values())[0];
        expect(entity.recurrence_score).toBeGreaterThanOrEqual(0.7);
        expect(entity.observation_count).toBe(5);
    });
});

// ════════════════════════════════════════════════════════════════
// CORRIDOR BUILDER
// ════════════════════════════════════════════════════════════════

describe("Corridor Builder", () => {
    it("creates a corridor from origin/destination", () => {
        const store = new CorridorStore();
        const parsed = parseLine(
            "Lead needed Dallas, TX to Houston, TX",
            "2026-03-13",
            true,
            "US"
        );
        const key = store.addObservation(parsed, "actor-1");
        expect(key).toBeTruthy();
        expect(store.corridors.size).toBe(1);
    });

    it("increments existing corridor", () => {
        const store = new CorridorStore();
        const p1 = parseLine("Lead Dallas, TX to Houston, TX", "2026-03-13", true, "US");
        const p2 = parseLine("Chase Dallas, TX to Houston, TX", "2026-03-14", true, "US");

        store.addObservation(p1, "a1");
        store.addObservation(p2, "a2");

        expect(store.corridors.size).toBe(1);
        const corridor = Array.from(store.corridors.values())[0];
        expect(corridor.observation_count).toBe(2);
    });

    it("builds service_type_mix", () => {
        const store = new CorridorStore();
        store.addObservation(
            parseLine("Lead Dallas, TX to Houston, TX", "2026-03-13", true, "US"),
            "a1"
        );
        store.addObservation(
            parseLine("Chase Dallas, TX to Houston, TX", "2026-03-14", true, "US"),
            "a1"
        );

        const corridor = Array.from(store.corridors.values())[0];
        expect(corridor.service_type_mix["lead"]).toBe(1);
        expect(corridor.service_type_mix["chase"]).toBe(1);
    });

    it("returns null for observations without locations", () => {
        const store = new CorridorStore();
        const parsed = parseLine(
            "Need pilot car ASAP 555-111-2222",
            "2026-03-13",
            true,
            "US"
        );
        const key = store.addObservation(parsed, "a1");
        expect(key).toBeNull();
    });

    it("getTopCorridors returns sorted list", () => {
        const store = new CorridorStore();
        // Add 5 TX→OK corridors
        for (let i = 0; i < 5; i++) {
            store.addObservation(
                parseLine("Lead Dallas, TX to Oklahoma City, OK", "2026-03-13", true, "US"),
                "a1"
            );
        }
        // Add 1 TX→LA corridor (different key)
        store.addObservation(
            parseLine("Lead Houston, TX to New Orleans, LA", "2026-03-13", true, "US"),
            "a1"
        );

        const top = store.getTopCorridors(10);
        expect(top.length).toBe(2);
        expect(top[0].observation_count).toBe(5);
        expect(top[1].observation_count).toBe(1);
    });
});

// ════════════════════════════════════════════════════════════════
// FULL PIPELINE (E2E)
// ════════════════════════════════════════════════════════════════

describe("Market Observation Engine — Full Pipeline", () => {
    const sampleBatch = `March 13, 2026
Load Alert!! ABC Transport 918-555-1234 Lead Dallas, TX to Houston, TX ASAP QP
Load Alert!! DEF Logistics 405-555-6789 Chase Oklahoma City, OK to Tulsa, OK COD
Load Alert!! ABC Transport 918-555-1234 Lead Austin, TX to San Antonio, TX

March 14, 2026
Load Alert!! GHI Pilot Cars 555-111-2222 Lead Amarillo, TX to Lubbock, TX
BEWARE of BadActor Dispatch 666-555-4444 scammer won't pay - beware
Load Alert!! DEF Logistics 405-555-6789 Steer Dallas, TX to Fort Worth, TX EFS`;

    it("returns a complete batch summary", () => {
        const result = ingestBatch({
            rawText: sampleBatch,
            sourceName: "PilotCarLoads.com",
            sourceType: "load_alert_feed",
            countryHint: "US",
            batchDate: "2026-03-13",
        });

        expect(result.summary.total_lines_processed).toBe(6);
        expect(result.summary.new_organizations_detected).toBeGreaterThan(0);
        expect(result.batch.text_hash).toBeTruthy();
        expect(result.batch.source_name).toBe("PilotCarLoads.com");
    });

    it("preserves all observations (no dedup)", () => {
        const result = ingestBatch({ rawText: sampleBatch, countryHint: "US" });
        expect(result.observations.length).toBe(6);
    });

    it("dedupes entities by phone", () => {
        const result = ingestBatch({ rawText: sampleBatch, countryHint: "US" });
        // ABC Transport appears twice with same phone → 1 entity
        // DEF Logistics appears twice with same phone → 1 entity
        // GHI Pilot Cars → 1 entity
        // BadActor Dispatch → 1 entity
        expect(result.entityStore.entities.size).toBeLessThanOrEqual(4);
    });

    it("creates reputation observations for caution lines", () => {
        const result = ingestBatch({ rawText: sampleBatch, countryHint: "US" });
        expect(result.reputationObservations.length).toBe(1);
        expect(result.reputationObservations[0].visibility).toBe("internal_only");
    });

    it("builds corridor intelligence", () => {
        const result = ingestBatch({ rawText: sampleBatch, countryHint: "US" });
        expect(result.corridorStore.corridors.size).toBeGreaterThan(0);
    });

    it("tracks service type mix", () => {
        const result = ingestBatch({ rawText: sampleBatch, countryHint: "US" });
        expect(result.summary.service_type_mix.lead).toBeGreaterThan(0);
    });

    it("tracks payment term mix", () => {
        const result = ingestBatch({ rawText: sampleBatch, countryHint: "US" });
        expect(result.summary.payment_term_mix.quick_pay).toBeGreaterThan(0);
        expect(result.summary.payment_term_mix.cod).toBeGreaterThan(0);
    });

    it("returns top repeat phones", () => {
        const result = ingestBatch({ rawText: sampleBatch, countryHint: "US" });
        expect(result.summary.top_repeat_phones.length).toBeGreaterThan(0);
        // ABC Transport appears twice → should be in top
        const abcPhone = result.summary.top_repeat_phones.find(
            (p) => p.phone === "9185551234"
        );
        expect(abcPhone).toBeTruthy();
        expect(abcPhone!.count).toBe(2);
    });

    it("handles empty and whitespace-only batches gracefully", () => {
        const result = ingestBatch({ rawText: "\n\n  \n\n" });
        expect(result.observations.length).toBe(0);
        expect(result.summary.total_lines_processed).toBe(0);
    });

    it("idempotency hash is stable for same input", () => {
        const r1 = ingestBatch({ rawText: sampleBatch });
        const r2 = ingestBatch({ rawText: sampleBatch });
        expect(r1.batch.text_hash).toBe(r2.batch.text_hash);
    });
});
