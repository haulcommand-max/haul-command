import { UIBSignal } from '../intelligence/IntelligenceBus';

/**
 * GoHighLevel Connector
 * 
 * Purpose: Syncs formatted Haul Command data to GHL for CRM/Marketing.
 * " The Mouth of the System "
 */
export class GHLConnector {
    private apiKey: string;
    private baseUrl: string = 'https://rest.gohighlevel.com/v1';

    constructor() {
        this.apiKey = process.env.GHL_API_KEY || '';
        if (!this.apiKey) {
            console.warn('[GHL Connector] No API Key found. Connector is dormant.');
        }
    }

    /**
     * Pushes a new Carrier or Pilot Car Lead to GHL
     */
    async syncContact(contact: any): Promise<boolean> {
        if (!this.apiKey) return false;

        try {
            const payload = {
                email: contact.email,
                phone: contact.phone,
                firstName: contact.firstName,
                lastName: contact.lastName,
                tags: ['HaulCommand', 'Provider']
            };

            const response = await fetch(`${this.baseUrl}/contacts/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            return response.ok;
        } catch (error) {
            console.error('[GHL Connector] Sync Failed', error);
            return false;
        }
    }

    /**
     * Converts a System Signal (e.g. New Load) into a GHL Opportunity
     */
    async handleSignal(signal: UIBSignal) {
        if (signal.type === 'ING-S' && signal.payload.type === 'LOAD_TENDER') {
            // Create Opportunity in Pipeline
            console.log('[GHL Connector] Creating Opportunity from Load Tender...');
        }
    }

    /**
     * Live Sync: Handles Webhook from GHL when Opportunity Status changes
     * Map: GHL "Won" -> Haul Command "Order Confirmed"
     */
    async syncOpportunityStatus(ghlPayload: any): Promise<UIBSignal | null> {
        console.log(`[GHL] Webhook: Opportunity ${ghlPayload.id} -> ${ghlPayload.status}`);

        if (ghlPayload.status === 'won') {
            const sigId = `SIG-${Date.now()}`;
            return {
                id: sigId,
                type: 'FIN-S' as const,
                source: 'GHL',
                timestamp: Date.now(),
                hash: `${sigId}-FIN-S`,
                sqs: 0.9,
                priority: 'HIGH' as const,
                payload: {
                    action: 'CREATE_ORDER',
                    lead_id: ghlPayload.contact_id,
                    value: ghlPayload.monetary_value
                }
            };
        }
        return null;
    }
}
