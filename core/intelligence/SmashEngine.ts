import { uib } from './IntelligenceBus';

interface RawProviderPayload {
    source_id: string;
    vehicle_count?: number;
    fleet_size?: number; // ODS uses this
    bucket_trucks?: number; // Rental networks use this
    verified_status?: string;
    // ... limitless dirty fields
}

export class SmashingEngine {

    public static smash(payload: RawProviderPayload) {
        // 1. Identification
        const canonicalId = this.identifySource(payload.source_id);

        // 2. Normalization (The "Smash")
        const normalized = {
            id: canonicalId,
            capacity: payload.vehicle_count || payload.fleet_size || payload.bucket_trucks || 0,
            status: this.normalizeStatus(payload.verified_status),
            timestamp: Date.now()
        };

        // 3. Quality Scoring (SQS)
        const sqs = this.calculateSQS(payload.source_id);

        // 4. Publish to UIB
        uib.emitSignal({
            id: `ing-${Date.now()}`,
            type: 'ING-S',
            source: canonicalId,
            payload: normalized,
            hash: 'sha256-placeholder', // In real impl, hash the payload
            timestamp: Date.now(),
            sqs: sqs
        });

        console.log(`[SMASH ENGINE] Smashed payload from ${payload.source_id} -> ${canonicalId}`);
    }

    private static identifySource(rawId: string): string {
        // Simple mapping for now, would use provider_registry.json lookup
        if (rawId.includes('ods')) return 'prov-ods-na';
        if (rawId.includes('wcs')) return 'prov-wcs-permits';
        return `prov-unknown-${rawId}`;
    }

    private static normalizeStatus(status?: string): 'ACTIVE' | 'INACTIVE' {
        if (!status) return 'ACTIVE'; // Default to optimistic
        const s = status.toLowerCase();
        if (s.includes('verified') || s.includes('active') || s.includes('gold')) return 'ACTIVE';
        return 'INACTIVE';
    }

    private static calculateSQS(sourceId: string): number {
        // Trusted Sources get higher scores
        if (sourceId.includes('ods')) return 0.85;
        if (sourceId.includes('wcs')) return 0.90;
        return 0.50;
    }
}
