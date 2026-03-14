/**
 * lib/ingestion/corridor-builder.ts
 *
 * Builds corridor intelligence from parsed observations.
 * Global-first: corridor_key uses region codes, not US state codes.
 */

import type {
    ParsedLine,
    CorridorRecord,
    ServiceType,
    Urgency,
    PaymentTerms,
} from "./types";

export class CorridorStore {
    corridors: Map<string, CorridorRecord> = new Map();

    buildCorridorKey(originRegion: string, destRegion: string, country?: string | null): string {
        const prefix = country ? `${country.toUpperCase()}:` : "";
        return `${prefix}${originRegion.toUpperCase()}|${destRegion.toUpperCase()}`;
    }

    addObservation(parsed: ParsedLine, actorId: string | null): string | null {
        if (!parsed.origin_region || !parsed.destination_region) return null;

        const key = this.buildCorridorKey(
            parsed.origin_region,
            parsed.destination_region,
            parsed.country_code_if_known
        );

        const existing = this.corridors.get(key);
        if (existing) {
            existing.observation_count += 1;
            existing.last_seen_at = new Date().toISOString();

            // Service type mix
            existing.service_type_mix[parsed.service_type] =
                (existing.service_type_mix[parsed.service_type] || 0) + 1;

            // Urgency mix
            existing.urgency_mix[parsed.urgency] =
                (existing.urgency_mix[parsed.urgency] || 0) + 1;

            // Payment mix
            existing.payment_mix[parsed.payment_terms] =
                (existing.payment_mix[parsed.payment_terms] || 0) + 1;

            // Actor tracking
            if (actorId) {
                existing.unique_actor_count = Math.max(
                    existing.unique_actor_count,
                    existing.unique_actor_count + (existing.observation_count % 3 === 0 ? 1 : 0)
                );
            }

            // Update strength score
            existing.corridor_strength_score = this.computeStrength(existing);
            existing.is_emerging = existing.observation_count >= 2 && existing.observation_count <= 5;
        } else {
            const now = new Date().toISOString();
            this.corridors.set(key, {
                corridor_key: key,
                origin_region: parsed.origin_region,
                origin_city: parsed.origin_city,
                destination_region: parsed.destination_region,
                destination_city: parsed.destination_city,
                country_code: parsed.country_code_if_known,
                observation_count: 1,
                unique_actor_count: actorId ? 1 : 0,
                first_seen_at: now,
                last_seen_at: now,
                service_type_mix: { [parsed.service_type]: 1 } as Record<ServiceType, number>,
                urgency_mix: { [parsed.urgency]: 1 } as Record<Urgency, number>,
                payment_mix: { [parsed.payment_terms]: 1 } as Record<PaymentTerms, number>,
                corridor_strength_score: 0.1,
                is_emerging: true,
            });
        }

        return key;
    }

    private computeStrength(corridor: CorridorRecord): number {
        const count = corridor.observation_count;
        if (count >= 20) return 1.0;
        if (count >= 10) return 0.8;
        if (count >= 5) return 0.6;
        if (count >= 3) return 0.4;
        if (count >= 2) return 0.25;
        return 0.1;
    }

    getTopCorridors(limit: number = 10): CorridorRecord[] {
        return Array.from(this.corridors.values())
            .sort((a, b) => b.observation_count - a.observation_count)
            .slice(0, limit);
    }

    getEmergingCorridors(): CorridorRecord[] {
        return Array.from(this.corridors.values())
            .filter((c) => c.is_emerging);
    }
}
