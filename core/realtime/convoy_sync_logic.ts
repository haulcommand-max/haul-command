/**
 * ConvoySyncLogic
 * Orchestrates real-time hazard sharing between lead escorts and truck drivers.
 * Uses Firebase Realtime Database for sub-second latency.
 */

export interface HazardEvent {
    id: string;
    type: 'WIRE' | 'DEBRIS' | 'SCALE' | 'POLICE';
    lat: number;
    lng: number;
    reporterId: string;
    timestamp: number;
}

export class ConvoySyncLogic {
    private convoyId: string;

    constructor(convoyId: string) {
        this.convoyId = convoyId;
    }

    /**
     * Drops a breadcrumb (hazard) for the rest of the convoy.
     */
    async reportHazard(hazard: Omit<HazardEvent, 'id' | 'timestamp'>) {
        console.log(`[Convoy ${this.convoyId}] Reporting hazard: ${hazard.type} at ${hazard.lat}, ${hazard.lng}`);
        // implementation would push to Firebase: `convoys/${this.convoyId}/hazards`
        return { success: true, eventId: 'rev_123' };
    }

    /**
     * Syncs existing hazards to the mobile map.
     */
    subscribeToHazards(callback: (hazards: HazardEvent[]) => void) {
        // implementation would listen to Firebase: `convoys/${this.convoyId}/hazards`
        console.log(`[Convoy ${this.convoyId}] Subscribed to real-time hazards.`);
    }
}
