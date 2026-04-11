import { createClient } from '@supabase/supabase-js';

const getAdminDb = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
};

export class GPSProofEngine {
    /**
     * Calculate Haversine distance between two sets of coordinates in meters
     */
    static haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371e3; // Earth radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
                
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    /**
     * OPUS-02 RULE: Check-in accuracy hard stop
     */
    static async recordBreadcrumb(jobId: string, operatorId: string, lat: number, lng: number, accuracyM: number) {
        if (accuracyM > 50) {
            console.error(`[GPS Engine] Rejecting breadcrumb: Accuracy ${accuracyM}m exceeds 50m threshold.`);
            // In real app, log to fraud_events if repeated
            return false;
        }

        const db = getAdminDb();
        await db.from('gps_breadcrumbs').insert({
            job_id: jobId,
            operator_id: operatorId,
            lat,
            lng,
            accuracy_m: accuracyM
        });

        // Trigger Geofence Match Validation
        return this.validateGeofenceMatch(jobId, lat, lng);
    }

    /**
     * OPUS-02 RULE: Geofence Validation
     */
    static async validateGeofenceMatch(jobId: string, lat: number, lng: number) {
        const db = getAdminDb();
        
        // 1. Fetch job target location
        const { data: job } = await db.from('jobs').select('pickup_lat, pickup_lng, delivery_lat, delivery_lng').eq('id', jobId).single();
        if (!job) return false;

        let verifiedPickup = false;
        let verifiedDelivery = false;

        // Check Delivery first (since that completes the cycle)
        if (job.delivery_lat && job.delivery_lng) {
            const dist = this.haversineDistance(lat, lng, job.delivery_lat, job.delivery_lng);
            if (dist <= 500) {
                verifiedDelivery = true;
            }
        }

        // Check Pickup
        if (!verifiedDelivery && job.pickup_lat && job.pickup_lng) {
            const dist = this.haversineDistance(lat, lng, job.pickup_lat, job.pickup_lng);
            if (dist <= 500) {
                verifiedPickup = true;
            }
        }

        if (verifiedPickup) {
            await db.from('job_milestones').upsert({ job_id: jobId, gps_verified: true });
            console.log(`[GPS Engine] Job ${jobId} Pickup Verified.`);
            return 'PICKUP_VERIFIED';
        }

        if (verifiedDelivery) {
            await db.from('job_milestones').upsert({ job_id: jobId, delivered_at: new Date().toISOString() });
            
            // Trigger downstream escrow stage
            await db.from('hc_escrows').update({ status: 'DELIVERED_HOLDBACK' }).eq('job_id', jobId);
            console.log(`[GPS Engine] Job ${jobId} Delivery Verified. Escrow entered DELIVERED_HOLDBACK.`);
            
            // GlobalEventBus.emit(OS_EVENTS.DELIVERY_HOLDBACK_CLEARED, { jobId });
            return 'DELIVERY_VERIFIED';
        }

        return 'GEOFENCE_MISMATCH';
    }
}
