// ══════════════════════════════════════════════════════════════
// SURFACE AREA BUILDER
// Generates and seeds ALL surface areas across 52 countries:
//   - Operator profiles
//   - Hotels / Motels (crew lodging)
//   - Ports (marine, intermodal, air)
//   - Facilities (weigh stations, rest areas, fuel stops)
//   - Service providers (repair, insurance, permits)
//
// After seeding, auto-scores and makes all surfaces claimable.
// ══════════════════════════════════════════════════════════════

import { SupabaseClient } from '@supabase/supabase-js';
import { COUNTRY_KEYWORD_SEEDS } from '../seo/global-keyword-matrix';

// ── Surface Type Definitions ─────────────────────────────────

export const SURFACE_TYPES = [
    'operator_profile',
    'port',
    'hotel',
    'motel',
    'facility',
    'service_provider',
    'weigh_station',
    'rest_area',
    'fuel_stop',
    'repair_shop',
    'permit_office',
    'insurance_provider',
    'training_center',
    'equipment_dealer',
] as const;

export type SurfaceType = typeof SURFACE_TYPES[number];

export interface SurfaceSeed {
    name: string;
    surface_type: SurfaceType;
    country_code: string;
    state_region?: string;
    city?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    source: string;
    source_id?: string;
    monetization_score?: number;
    liquidity_score?: number;
    data_confidence_score?: number;
}

// ── Surface Type Metadata ────────────────────────────────────

const SURFACE_TYPE_META: Record<SurfaceType, {
    label: string;
    defaultMonetization: number;
    defaultLiquidity: number;
    defaultConfidence: number;
}> = {
    operator_profile: { label: 'Operator Profile', defaultMonetization: 0.8, defaultLiquidity: 0.9, defaultConfidence: 0.7 },
    port: { label: 'Port', defaultMonetization: 0.7, defaultLiquidity: 0.6, defaultConfidence: 0.8 },
    hotel: { label: 'Hotel', defaultMonetization: 0.5, defaultLiquidity: 0.4, defaultConfidence: 0.6 },
    motel: { label: 'Motel', defaultMonetization: 0.4, defaultLiquidity: 0.4, defaultConfidence: 0.5 },
    facility: { label: 'Facility', defaultMonetization: 0.6, defaultLiquidity: 0.5, defaultConfidence: 0.7 },
    service_provider: { label: 'Service Provider', defaultMonetization: 0.6, defaultLiquidity: 0.5, defaultConfidence: 0.6 },
    weigh_station: { label: 'Weigh Station', defaultMonetization: 0.3, defaultLiquidity: 0.7, defaultConfidence: 0.9 },
    rest_area: { label: 'Rest Area', defaultMonetization: 0.2, defaultLiquidity: 0.5, defaultConfidence: 0.8 },
    fuel_stop: { label: 'Fuel Stop', defaultMonetization: 0.5, defaultLiquidity: 0.6, defaultConfidence: 0.7 },
    repair_shop: { label: 'Repair Shop', defaultMonetization: 0.6, defaultLiquidity: 0.5, defaultConfidence: 0.5 },
    permit_office: { label: 'Permit Office', defaultMonetization: 0.4, defaultLiquidity: 0.8, defaultConfidence: 0.9 },
    insurance_provider: { label: 'Insurance Provider', defaultMonetization: 0.7, defaultLiquidity: 0.4, defaultConfidence: 0.6 },
    training_center: { label: 'Training Center', defaultMonetization: 0.5, defaultLiquidity: 0.3, defaultConfidence: 0.5 },
    equipment_dealer: { label: 'Equipment Dealer', defaultMonetization: 0.6, defaultLiquidity: 0.4, defaultConfidence: 0.5 },
};

// ══════════════════════════════════════════════════════════════
// SURFACE BUILDER CLASS
// ══════════════════════════════════════════════════════════════

export class SurfaceBuilder {
    constructor(private db: SupabaseClient) { }

    /**
     * Seed surfaces from an array of SurfaceSeed objects.
     * Deduplicates by source + source_id.
     */
    async seedSurfaces(seeds: SurfaceSeed[]): Promise<{
        inserted: number;
        skipped: number;
        errors: number;
    }> {
        let inserted = 0;
        let skipped = 0;
        let errors = 0;

        // Batch in chunks of 100
        const chunks = [];
        for (let i = 0; i < seeds.length; i += 100) {
            chunks.push(seeds.slice(i, i + 100));
        }

        for (const chunk of chunks) {
            const rows = chunk.map(seed => {
                const meta = SURFACE_TYPE_META[seed.surface_type] ?? SURFACE_TYPE_META.operator_profile;
                const slug = this.generateSlug(seed);

                return {
                    name: seed.name,
                    slug,
                    surface_type: seed.surface_type,
                    country_code: seed.country_code,
                    state_region: seed.state_region ?? null,
                    city: seed.city ?? null,
                    address: seed.address ?? null,
                    phone: seed.phone ?? null,
                    email: seed.email ?? null,
                    website: seed.website ?? null,
                    source: seed.source,
                    source_id: seed.source_id ?? null,
                    claim_status: 'unclaimed' as const,
                    monetization_score: seed.monetization_score ?? meta.defaultMonetization,
                    liquidity_score: seed.liquidity_score ?? meta.defaultLiquidity,
                    data_confidence_score: seed.data_confidence_score ?? meta.defaultConfidence,
                };
            });

            const { data, error } = await this.db
                .from('surfaces')
                .upsert(rows, {
                    onConflict: 'slug',
                    ignoreDuplicates: true,
                })
                .select('id');

            if (error) {
                errors += chunk.length;
            } else {
                inserted += data?.length ?? 0;
                skipped += chunk.length - (data?.length ?? 0);
            }
        }

        return { inserted, skipped, errors };
    }

    /**
     * After seeding, compute priority scores for all unclaimed surfaces.
     */
    async scoreAllSurfaces(): Promise<void> {
        await this.db.rpc('compute_claim_priority_score');
    }

    /**
     * Get surface counts by country and type.
     */
    async getSurfaceCounts(): Promise<Array<{
        country_code: string;
        surface_type: string;
        total: number;
        claimed: number;
        claimable: number;
    }>> {
        const { data } = await this.db
            .from('claim_kpi_summary')
            .select('*');
        return (data ?? []).map(row => ({
            country_code: row.country_code,
            surface_type: row.surface_type,
            total: row.total_surfaces,
            claimed: row.claimed,
            claimable: row.claimable,
        }));
    }

    /**
     * Get total surface counts across all countries.
     */
    async getTotalCounts(): Promise<{
        total: number;
        claimed: number;
        claimable: number;
        byType: Record<string, number>;
        byCountry: Record<string, number>;
    }> {
        const { count: total } = await this.db
            .from('surfaces')
            .select('id', { count: 'exact', head: true });

        const { count: claimed } = await this.db
            .from('surfaces')
            .select('id', { count: 'exact', head: true })
            .eq('claim_status', 'claimed');

        const { count: claimable } = await this.db
            .from('surfaces')
            .select('id', { count: 'exact', head: true })
            .eq('claim_status', 'claimable');

        return {
            total: total ?? 0,
            claimed: claimed ?? 0,
            claimable: claimable ?? 0,
            byType: {},
            byCountry: {},
        };
    }

    /**
     * Generate all surface types for a given country.
     * This is the main "build all surfaces" method.
     */
    generateCountrySurfaces(countryCode: string): SurfaceSeed[] {
        const seed = COUNTRY_KEYWORD_SEEDS.find(s => s.iso2 === countryCode);
        if (!seed) return [];

        const surfaces: SurfaceSeed[] = [];
        const country = seed.country;
        const regions = seed.regions ?? [];

        for (const region of regions) {
            // Operator profiles (placeholder — real data from scraping/imports)
            surfaces.push({
                name: `${seed.primaryTerm} Operators - ${region}`,
                surface_type: 'operator_profile',
                country_code: countryCode,
                state_region: region,
                source: 'auto_seed',
                source_id: `op_${countryCode}_${region}`.toLowerCase().replace(/\s/g, '_'),
            });

            // Ports
            surfaces.push({
                name: `${region} Port Authority`,
                surface_type: 'port',
                country_code: countryCode,
                state_region: region,
                source: 'auto_seed',
                source_id: `port_${countryCode}_${region}`.toLowerCase().replace(/\s/g, '_'),
            });

            // Hotels
            surfaces.push({
                name: `Trucker Hotels - ${region}`,
                surface_type: 'hotel',
                country_code: countryCode,
                state_region: region,
                source: 'auto_seed',
                source_id: `hotel_${countryCode}_${region}`.toLowerCase().replace(/\s/g, '_'),
            });

            // Motels
            surfaces.push({
                name: `Crew Motels - ${region}`,
                surface_type: 'motel',
                country_code: countryCode,
                state_region: region,
                source: 'auto_seed',
                source_id: `motel_${countryCode}_${region}`.toLowerCase().replace(/\s/g, '_'),
            });

            // Weigh stations
            surfaces.push({
                name: `${region} Weigh Station`,
                surface_type: 'weigh_station',
                country_code: countryCode,
                state_region: region,
                source: 'auto_seed',
                source_id: `weigh_${countryCode}_${region}`.toLowerCase().replace(/\s/g, '_'),
                data_confidence_score: 0.9,
            });

            // Fuel stops
            surfaces.push({
                name: `Fuel Stops - ${region}`,
                surface_type: 'fuel_stop',
                country_code: countryCode,
                state_region: region,
                source: 'auto_seed',
                source_id: `fuel_${countryCode}_${region}`.toLowerCase().replace(/\s/g, '_'),
            });

            // Repair shops
            surfaces.push({
                name: `Truck Repair - ${region}`,
                surface_type: 'repair_shop',
                country_code: countryCode,
                state_region: region,
                source: 'auto_seed',
                source_id: `repair_${countryCode}_${region}`.toLowerCase().replace(/\s/g, '_'),
            });

            // Permit offices
            surfaces.push({
                name: `Permit Office - ${region}`,
                surface_type: 'permit_office',
                country_code: countryCode,
                state_region: region,
                source: 'auto_seed',
                source_id: `permit_${countryCode}_${region}`.toLowerCase().replace(/\s/g, '_'),
                data_confidence_score: 0.9,
            });
        }

        // Country-level surfaces
        surfaces.push({
            name: `${country} ${seed.primaryTerm} Directory`,
            surface_type: 'operator_profile',
            country_code: countryCode,
            source: 'auto_seed',
            source_id: `dir_${countryCode}`.toLowerCase(),
            monetization_score: 0.9,
            liquidity_score: 0.9,
        });

        surfaces.push({
            name: `${country} Equipment Dealers`,
            surface_type: 'equipment_dealer',
            country_code: countryCode,
            source: 'auto_seed',
            source_id: `equip_${countryCode}`.toLowerCase(),
        });

        surfaces.push({
            name: `${country} Training Centers`,
            surface_type: 'training_center',
            country_code: countryCode,
            source: 'auto_seed',
            source_id: `train_${countryCode}`.toLowerCase(),
        });

        surfaces.push({
            name: `${country} Insurance Providers`,
            surface_type: 'insurance_provider',
            country_code: countryCode,
            source: 'auto_seed',
            source_id: `insure_${countryCode}`.toLowerCase(),
        });

        return surfaces;
    }

    /**
     * Generate and seed surfaces for ALL 52 countries.
     */
    async buildAllSurfaceAreas(): Promise<{
        total_generated: number;
        total_inserted: number;
        total_skipped: number;
        total_errors: number;
        by_country: Record<string, number>;
    }> {
        let totalGenerated = 0;
        let totalInserted = 0;
        let totalSkipped = 0;
        let totalErrors = 0;
        const byCountry: Record<string, number> = {};

        for (const seed of COUNTRY_KEYWORD_SEEDS) {
            const surfaces = this.generateCountrySurfaces(seed.iso2);
            totalGenerated += surfaces.length;

            if (surfaces.length > 0) {
                const result = await this.seedSurfaces(surfaces);
                totalInserted += result.inserted;
                totalSkipped += result.skipped;
                totalErrors += result.errors;
                byCountry[seed.iso2] = result.inserted;
            }
        }

        // Score all surfaces after seeding
        await this.scoreAllSurfaces();

        return {
            total_generated: totalGenerated,
            total_inserted: totalInserted,
            total_skipped: totalSkipped,
            total_errors: totalErrors,
            by_country: byCountry,
        };
    }

    // ── Helpers ──────────────────────────────────────────────

    private generateSlug(seed: SurfaceSeed): string {
        const parts = [
            seed.surface_type,
            seed.country_code.toLowerCase(),
            seed.state_region,
            seed.city,
            seed.name,
        ].filter(Boolean);

        return parts
            .join('-')
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 200);
    }
}
