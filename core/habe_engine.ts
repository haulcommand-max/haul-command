
/**
 * HABE Engine (Haul Command Autonomous Booking Engine)
 * The "Brain" that moves offers from NEW -> BOOKED.
 */

import { createClient } from '@supabase/supabase-js';

// Mock types for now - these would come from generated Typescript types
type OfferState = 'NEW_OFFER_CAPTURED' | 'VALIDATING' | 'ROUTING_TO_CANDIDATES' | 'OFFER_SENT' | 'WAITING_RESPONSE' | 'NEGOTIATING' | 'BOOKED' | 'FAILED';

interface OfferPayload {
    pickup_city: string;
    pickup_state: string;
    dropoff_city: string;
    dropoff_state: string;
    rate_offer: number;
    rate_type: 'FLAT' | 'PER_MILE';
    requirements: string[]; // HIGH_POLE, CHASE used for matching
    broker_id: string;
}

export class HabeEngine {
    private supabase;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    /**
     * Step 1: Ingest Offer from Vapi Voice Agent
     */
    async ingestOffer(payload: OfferPayload, voiceLogId?: string): Promise<string> {
        console.log(`[HABE] Ingesting Offer: ${payload.pickup_city} -> ${payload.dropoff_city}`);

        // 1. Validate (Basic Check)
        if (!payload.rate_offer || payload.rate_offer <= 0) {
            throw new Error("Invalid Rate");
        }

        // 2. Persist to DB
        const { data, error } = await this.supabase
            .from('habe_offers')
            .insert({
                broker_profile_id: payload.broker_id,
                initial_call_id: voiceLogId,
                pickup_city: payload.pickup_city,
                pickup_state: payload.pickup_state,
                dropoff_city: payload.dropoff_city,
                dropoff_state: payload.dropoff_state,
                offer_rate_value: payload.rate_offer,
                offer_rate_type: payload.rate_type,
                req_high_pole: payload.requirements.includes('HIGH_POLE'),
                req_chase: payload.requirements.includes('CHASE'),
                status: 'NEW_OFFER_CAPTURED'
            })
            .select('id')
            .single();

        if (error) throw error;

        // 3. Trigger Routing State
        await this.transitionState(data.id, 'ROUTING_TO_CANDIDATES');

        return data.id;
    }

    /**
     * Step 2: Route to Best Candidates (The "Matching Logic")
     */
    async routeToCandidates(offerId: string) {
        const { data: offer } = await this.supabase.from('habe_offers').select('*').eq('id', offerId).single();

        // Mock Geo-Query: Find drivers within 50 miles of pickup
        // In real impl: use PostGIS ST_DWithin(profiles.location, offer.pickup_geo)

        // For matching, we filter by equipment
        let query = this.supabase.from('habe_profiles').select('*').eq('role', 'DRIVER');

        if (offer.req_high_pole) {
            query = query.eq('has_high_pole', true);
        }

        const { data: candidates } = await query.limit(5);

        if (!candidates || candidates.length === 0) {
            console.log(`[HABE] No candidates found for Offer ${offerId}`);
            // Fallback: Notify Admin
            return;
        }

        // Send Offer to Top Candidate
        const winner = candidates[0];
        console.log(`[HABE] Routing Offer ${offerId} to Candidate ${winner.id}`);

        // Create Negotiation Record
        await this.supabase.from('habe_negotiations').insert({
            offer_id: offerId,
            candidate_id: winner.id,
            status: 'PENDING'
        });

        // Update Status
        await this.transitionState(offerId, 'OFFER_SENT', { assignee: winner.id });

        // Trigger Notification (SMS/Push)
        // triggerNotification(winner.id, "New Offer: " + offer.pickup_city);
    }

    /**
     * Step 3: Handle Driver Response
     */
    async handleDriverResponse(offerId: string, driverId: string, action: 'ACCEPT' | 'DECLINE' | 'COUNTER', counterPrice?: number) {
        if (action === 'ACCEPT') {
            await this.transitionState(offerId, 'BOOKED');
            // Trigger Auto-Callback to Broker
            // triggerConfirmationCall(offerId);
        } else if (action === 'COUNTER') {
            await this.transitionState(offerId, 'NEGOTIATING');
            // Log Counter
            await this.supabase.from('habe_negotiations').insert({
                offer_id: offerId,
                candidate_id: driverId,
                status: 'COUNTERED',
                counter_rate_value: counterPrice
            });
            // Trigger Callback to Broker with Counter
        } else {
            // DECLINE -> Route to next candidate
            await this.routeToCandidates(offerId); // Logic needs to skip declined IDs
        }
    }

    /**
     * State Transition Helper with Audit Logging
     */
    private async transitionState(offerId: string, newState: OfferState, payload?: any) {
        console.log(`[HABE] Transition Offer ${offerId} -> ${newState}`);

        await this.supabase.from('habe_offers').update({ status: newState }).eq('id', offerId);

        await this.supabase.from('habe_offer_events').insert({
            offer_id: offerId,
            event_type: 'STATE_CHANGE',
            payload: { from_state: 'UNKNOWN', to_state: newState, ...payload }
        });
    }
}
