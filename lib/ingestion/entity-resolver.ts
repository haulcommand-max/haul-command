/**
 * lib/ingestion/entity-resolver.ts
 *
 * Entity resolution for market observation ingestion.
 * Implements the identity_resolution section of the spec.
 * Priority: exact phone → name+route overlap → alias similarity.
 */

import type {
    ParsedLine,
    MarketEntity,
    EntityAlias,
    EntityPhone,
    IdentityLink,
    RoleCandidate,
} from "./types";

// ════════════════════════════════════════════════════════════════
// IN-MEMORY ENTITY STORE (for batch processing)
// ════════════════════════════════════════════════════════════════

export class EntityStore {
    entities: Map<string, MarketEntity> = new Map();
    phones: Map<string, EntityPhone> = new Map();
    aliases: EntityAlias[] = [];
    links: IdentityLink[] = [];

    private nextId = 0;
    private genId(): string {
        return `ent_${Date.now()}_${this.nextId++}`;
    }

    // ── RESOLVE ──

    resolveEntity(parsed: ParsedLine, batchId: string): string | null {
        // Priority 1: exact normalized phone match
        if (parsed.normalized_phone && !parsed.phone_is_placeholder) {
            const existing = this.phones.get(parsed.normalized_phone);
            if (existing && existing.linked_entity_ids.length > 0) {
                const entityId = existing.linked_entity_ids[0];
                this.updateExistingEntity(entityId, parsed, batchId);
                this.updatePhone(parsed.normalized_phone, parsed, entityId);
                return entityId;
            }
        }

        // Priority 2: exact name match
        if (parsed.parsed_name_or_company) {
            const canonical = this.canonicalize(parsed.parsed_name_or_company);
            for (const [id, entity] of this.entities) {
                if (this.canonicalize(entity.canonical_name) === canonical) {
                    this.updateExistingEntity(id, parsed, batchId);
                    if (parsed.normalized_phone && !parsed.phone_is_placeholder) {
                        this.upsertPhone(parsed, id);
                    }
                    return id;
                }
            }
        }

        // Priority 3: no match → create new entity
        if (parsed.parsed_name_or_company || (parsed.normalized_phone && !parsed.phone_is_placeholder)) {
            return this.createEntity(parsed, batchId);
        }

        return null;
    }

    // ── CREATE ──

    private createEntity(parsed: ParsedLine, batchId: string): string {
        const id = this.genId();
        const now = new Date().toISOString();
        const name = parsed.parsed_name_or_company || `Unknown (${parsed.normalized_phone || "no-id"})`;

        const roleConfidences: Record<RoleCandidate, number> = {} as any;
        for (const role of parsed.role_candidates) {
            roleConfidences[role] = parsed.parse_confidence;
        }

        const entity: MarketEntity = {
            id,
            canonical_name: this.canonicalize(name),
            display_name: name,
            entity_type: this.inferEntityType(name),
            primary_roles: [...parsed.role_candidates],
            role_confidences: roleConfidences,
            primary_phone: parsed.normalized_phone,
            country_code: parsed.country_code_if_known,
            first_seen_at: now,
            last_seen_at: now,
            observation_count: 1,
            recurrence_score: 0,
            entity_confidence_score: parsed.parse_confidence,
            claim_priority_score: 0,
            monetization_value_score: 0,
            internal_risk_score: parsed.reputation_signal === "caution" ? 0.3 : 0,
            public_display_eligible: false,
            data_completeness_score: this.computeCompleteness(parsed),
        };

        this.entities.set(id, entity);

        // Create alias
        if (parsed.parsed_name_or_company) {
            this.aliases.push({
                entity_id: id,
                alias_name: parsed.parsed_name_or_company,
                alias_type: "name_variant",
                source_batch_id: batchId,
                first_seen_at: now,
                occurrence_count: 1,
            });
        }

        // Create phone record
        if (parsed.normalized_phone) {
            this.upsertPhone(parsed, id);
        }

        return id;
    }

    // ── UPDATE ──

    private updateExistingEntity(entityId: string, parsed: ParsedLine, batchId: string): void {
        const entity = this.entities.get(entityId);
        if (!entity) return;

        entity.observation_count += 1;
        entity.last_seen_at = new Date().toISOString();

        // Add new roles
        for (const role of parsed.role_candidates) {
            if (!entity.primary_roles.includes(role)) {
                entity.primary_roles.push(role);
            }
            entity.role_confidences[role] = Math.min(
                1.0,
                (entity.role_confidences[role] || 0) + 0.1
            );
        }

        // Update risk
        if (parsed.reputation_signal === "caution") {
            entity.internal_risk_score = Math.min(1.0, entity.internal_risk_score + 0.15);
        }

        // Add alias if new
        if (parsed.parsed_name_or_company) {
            const existing = this.aliases.find(
                (a) => a.entity_id === entityId &&
                    a.alias_name.toLowerCase() === parsed.parsed_name_or_company!.toLowerCase()
            );
            if (existing) {
                existing.occurrence_count += 1;
            } else {
                this.aliases.push({
                    entity_id: entityId,
                    alias_name: parsed.parsed_name_or_company,
                    alias_type: "name_variant",
                    source_batch_id: batchId,
                    first_seen_at: new Date().toISOString(),
                    occurrence_count: 1,
                });
            }
        }

        // Recalculate scores
        entity.recurrence_score = this.computeRecurrence(entity.observation_count);
        entity.entity_confidence_score = Math.min(
            1.0,
            entity.entity_confidence_score + 0.05
        );
        entity.data_completeness_score = Math.max(
            entity.data_completeness_score,
            this.computeCompleteness(parsed)
        );
    }

    // ── PHONE ──

    private upsertPhone(parsed: ParsedLine, entityId: string): void {
        if (!parsed.normalized_phone) return;

        const existing = this.phones.get(parsed.normalized_phone);
        if (existing) {
            this.updatePhone(parsed.normalized_phone, parsed, entityId);
        } else {
            this.phones.set(parsed.normalized_phone, {
                raw_phone: parsed.raw_phone || "",
                normalized_phone: parsed.normalized_phone,
                is_placeholder: parsed.phone_is_placeholder,
                linked_entity_ids: [entityId],
                first_seen_at: new Date().toISOString(),
                last_seen_at: new Date().toISOString(),
                occurrence_count: 1,
                country_code: parsed.country_code_if_known,
            });
        }
    }

    private updatePhone(normalizedPhone: string, parsed: ParsedLine, entityId: string): void {
        const phone = this.phones.get(normalizedPhone);
        if (!phone) return;

        phone.occurrence_count += 1;
        phone.last_seen_at = new Date().toISOString();
        if (!phone.linked_entity_ids.includes(entityId)) {
            phone.linked_entity_ids.push(entityId);
        }
    }

    // ── HELPERS ──

    private canonicalize(name: string): string {
        return name
            .toLowerCase()
            .replace(/['']/g, "")
            .replace(/\s+/g, " ")
            .replace(/\b(llc|inc|corp|ltd|co|company|services?|group|logistics|transport|express)\b/gi, "")
            .trim();
    }

    private inferEntityType(name: string): "organization" | "contact" | "unknown" {
        const orgHints = /\b(llc|inc|corp|ltd|co|company|services?|group|logistics|transport|express|dispatch|permits?|pilot\s*car)\b/i;
        if (orgHints.test(name)) return "organization";
        // Single-word name = probably person
        if (name.split(/\s+/).length <= 2 && !/\b(dispatch|logistics)\b/i.test(name)) return "contact";
        return "unknown";
    }

    private computeCompleteness(parsed: ParsedLine): number {
        let score = 0;
        if (parsed.parsed_name_or_company) score += 0.2;
        if (parsed.normalized_phone && !parsed.phone_is_placeholder) score += 0.25;
        if (parsed.origin_region) score += 0.15;
        if (parsed.destination_region) score += 0.15;
        if (parsed.service_type !== "unknown") score += 0.1;
        if (parsed.payment_terms !== "unknown") score += 0.05;
        if (parsed.urgency !== "unknown") score += 0.05;
        if (parsed.country_code_if_known) score += 0.05;
        return Math.round(score * 100) / 100;
    }

    private computeRecurrence(count: number): number {
        if (count >= 15) return 1.0;
        if (count >= 5) return 0.7;
        if (count >= 2) return 0.4;
        return 0.1;
    }

    // ── SCORING ──

    computeClaimPriority(entityId: string): number {
        const entity = this.entities.get(entityId);
        if (!entity) return 0;

        let score = 0;
        score += entity.recurrence_score * 0.3;
        score += entity.entity_confidence_score * 0.2;
        score += entity.data_completeness_score * 0.2;
        if (entity.primary_phone && !this.phones.get(entity.primary_phone)?.is_placeholder) score += 0.15;
        if (entity.primary_roles.length > 1) score += 0.1;
        if (entity.internal_risk_score > 0.5) score -= 0.2;

        return Math.round(Math.max(0, Math.min(1, score)) * 100) / 100;
    }

    computeMonetizationScore(entityId: string): number {
        const entity = this.entities.get(entityId);
        if (!entity) return 0;

        let score = 0;
        score += entity.recurrence_score * 0.25;
        score += entity.data_completeness_score * 0.25;
        score += (entity.observation_count >= 5 ? 0.25 : entity.observation_count * 0.05);
        score += entity.entity_confidence_score * 0.25;

        return Math.round(Math.max(0, Math.min(1, score)) * 100) / 100;
    }

    // ── FINALIZE ──

    finalizeScores(): void {
        for (const [id, entity] of this.entities) {
            entity.claim_priority_score = this.computeClaimPriority(id);
            entity.monetization_value_score = this.computeMonetizationScore(id);
            entity.public_display_eligible =
                entity.entity_confidence_score >= 0.6 &&
                entity.internal_risk_score < 0.5 &&
                entity.observation_count >= 2;
        }
    }
}
