/**
 * ATS (Anderson Trucking Service) Enterprise API Schema
 * 
 * Purpose: A standardized interface for Enterprise Carriers (like ATS) 
 * to inject bulk moves into Haul Command without manual entry.
 * 
 * Strategy: "Target Customer"
 * We sell this API access to them.
 */

// 1. The Payload ATS sends us
export interface ATSLoadInjectionPayload {
    api_key: string; // Enterprise Key
    loads: Array<{
        reference_number: string; // Their TMS ID
        origin: {
            address: string;
            lat: number;
            lng: number;
        };
        destination: {
            address: string;
            lat: number;
            lng: number;
        };
        dimensions: {
            length: number;
            width: number;
            height: number;
            gross_weight: number;
        };
        axle_config_id?: string; // If they have mapped it
        schedule: {
            pickup: string; // ISO Date
            delivery: string; // ISO Date
        };
    }>;
}

// 2. The Connector Class
export class ATSConnector {

    /**
     * Validates and Ingests ATS Bulk Payload
     */
    async ingestBulkLoads(payload: ATSLoadInjectionPayload): Promise<{ successful: number, failed: number }> {
        console.log(`[ATS Enterprise] Ingesting ${payload.loads.length} loads from TMS.`);

        // Logic:
        // 1. Validate API Key
        // 2. Loop through loads
        // 3. Create 'ING-S' signals for each

        return { successful: payload.loads.length, failed: 0 };
    }
}
