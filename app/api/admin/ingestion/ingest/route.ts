/**
 * POST /api/admin/ingestion/ingest
 * 
 * Main ingestion endpoint for Historical Market Observation data.
 * Accepts raw text, processes it through the 8-step pipeline,
 * persists to Supabase, and returns a batch summary.
 *
 * Body: {
 *   raw_text: string (required)
 *   source_name?: string
 *   source_type?: SourceType
 *   country_hint?: string (ISO 3166-1 alpha-2)
 *   batch_date?: string (YYYY-MM-DD)
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ingestBatch } from "@/lib/ingestion/market-observation-engine";

export const maxDuration = 60;

const ADMIN_SECRET = process.env.HC_ADMIN_SECRET;

export async function POST(req: NextRequest) {
    // Auth
    const auth =
        req.headers.get("x-admin-secret") ||
        req.headers.get("authorization")?.replace("Bearer ", "");
    if (!ADMIN_SECRET || auth !== ADMIN_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const rawText = body.raw_text;

        if (!rawText || typeof rawText !== "string" || rawText.trim().length < 10) {
            return NextResponse.json(
                { error: "raw_text is required (min 10 chars)" },
                { status: 400 }
            );
        }

        // Run the ingestion pipeline
        const result = ingestBatch({
            rawText,
            sourceName: body.source_name,
            sourceType: body.source_type,
            countryHint: body.country_hint,
            batchDate: body.batch_date,
        });

        // Persist to Supabase
        const supabase = getSupabaseAdmin();

        // 1. Insert batch record
        await supabase.from("hc_ingestion_batches").insert({
            id: result.batch.id,
            raw_text: result.batch.raw_text,
            text_hash: result.batch.text_hash,
            source_name: result.batch.source_name,
            source_type: result.batch.source_type,
            source_classification: result.batch.source_classification,
            country_hint: result.batch.country_hint,
            batch_date: result.batch.batch_date,
            ingested_at: result.batch.ingested_at,
            total_lines: result.batch.total_lines,
            parsed_lines: result.batch.parsed_lines,
            partial_lines: result.batch.partial_lines,
            unparsed_lines: result.batch.unparsed_lines,
        });

        // 2. Insert observations (batch of up to 1000)
        if (result.observations.length > 0) {
            const chunks = chunkArray(result.observations, 500);
            for (const chunk of chunks) {
                await supabase.from("hc_market_observations").insert(chunk);
            }
        }

        // 3. Insert reputation observations
        if (result.reputationObservations.length > 0) {
            await supabase.from("hc_reputation_observations").insert(
                result.reputationObservations
            );
        }

        // 4. Upsert entities
        const entities = Array.from(result.entityStore.entities.values());
        if (entities.length > 0) {
            for (const entity of entities) {
                await supabase.from("hc_market_entities").upsert(
                    {
                        id: entity.id,
                        canonical_name: entity.canonical_name,
                        display_name: entity.display_name,
                        entity_type: entity.entity_type,
                        primary_roles: entity.primary_roles,
                        role_confidences: entity.role_confidences,
                        primary_phone: entity.primary_phone,
                        country_code: entity.country_code,
                        first_seen_at: entity.first_seen_at,
                        last_seen_at: entity.last_seen_at,
                        observation_count: entity.observation_count,
                        recurrence_score: entity.recurrence_score,
                        entity_confidence_score: entity.entity_confidence_score,
                        claim_priority_score: entity.claim_priority_score,
                        monetization_value_score: entity.monetization_value_score,
                        internal_risk_score: entity.internal_risk_score,
                        public_display_eligible: entity.public_display_eligible,
                        data_completeness_score: entity.data_completeness_score,
                    },
                    { onConflict: "id" }
                );
            }
        }

        // 5. Insert aliases
        if (result.entityStore.aliases.length > 0) {
            await supabase.from("hc_entity_aliases").insert(
                result.entityStore.aliases
            );
        }

        // 6. Upsert phones
        const phones = Array.from(result.entityStore.phones.values());
        if (phones.length > 0) {
            for (const phone of phones) {
                await supabase.from("hc_entity_phones").upsert(
                    {
                        normalized_phone: phone.normalized_phone,
                        raw_phone: phone.raw_phone,
                        is_placeholder: phone.is_placeholder,
                        linked_entity_ids: phone.linked_entity_ids,
                        first_seen_at: phone.first_seen_at,
                        last_seen_at: phone.last_seen_at,
                        occurrence_count: phone.occurrence_count,
                        country_code: phone.country_code,
                    },
                    { onConflict: "normalized_phone" }
                );
            }
        }

        // 7. Upsert corridors
        const corridors = Array.from(result.corridorStore.corridors.values());
        if (corridors.length > 0) {
            for (const corridor of corridors) {
                await supabase.from("hc_corridor_intelligence").upsert(
                    {
                        corridor_key: corridor.corridor_key,
                        origin_region: corridor.origin_region,
                        origin_city: corridor.origin_city,
                        destination_region: corridor.destination_region,
                        destination_city: corridor.destination_city,
                        country_code: corridor.country_code,
                        observation_count: corridor.observation_count,
                        unique_actor_count: corridor.unique_actor_count,
                        first_seen_at: corridor.first_seen_at,
                        last_seen_at: corridor.last_seen_at,
                        service_type_mix: corridor.service_type_mix,
                        urgency_mix: corridor.urgency_mix,
                        payment_mix: corridor.payment_mix,
                        corridor_strength_score: corridor.corridor_strength_score,
                        is_emerging: corridor.is_emerging,
                    },
                    { onConflict: "corridor_key" }
                );
            }
        }

        return NextResponse.json({
            ok: true,
            summary: result.summary,
        });
    } catch (err: any) {
        console.error("[ingestion]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}
