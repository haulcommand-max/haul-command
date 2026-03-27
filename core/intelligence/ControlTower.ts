import { uib, UIBSignal } from './IntelligenceBus';

export type DirectiveType = 'DISPATCH' | 'HOLD' | 'RE-ROUTE' | 'AUDIT_REQ';

export interface IntelligenceDirective {
    id: string;
    type: DirectiveType;
    targetEntityId: string;
    reason: string;
    priority: number; // P0 (Emergency) to P5 (Standard)
}

export class ControlTower {
    private static instance: ControlTower;

    private constructor() {
        this.initializeListeners();
    }

    public static getInstance(): ControlTower {
        if (!ControlTower.instance) {
            ControlTower.instance = new ControlTower();
        }
        return ControlTower.instance;
    }

    private initializeListeners() {
        uib.onSignal(this.handleSignal.bind(this));
    }

    private handleSignal(signal: UIBSignal) {
        // The "Brain" Logic
        switch (signal.type) {
            case 'ING-S': // Ingestion Signal (e.g. ODS vehicle count update)
                this.evaluateIngestion(signal);
                break;
            case 'RAT-S': // Rate Signal (Price Calculated)
                this.evaluateRate(signal);
                break;
            case 'VET-S': // Vetting Signal (Escort Insurance Expired)
                this.handleVettingAlert(signal);
                break;
            case 'NAV-S': // Permit Signal (Permit Delayed/Issued)
                this.handlePermitUpdate(signal);
                break;
            case 'EVI-S': // Evidence Signal (Crash/Contact)
                this.triggerEmergencyProtocol(signal);
                break;
        }
    }

    private handleVettingAlert(signal: UIBSignal) {
        if (signal.payload.status === 'REJECTED') {
            const directive: IntelligenceDirective = {
                id: `dir-${Date.now()}`,
                type: 'HOLD',
                targetEntityId: signal.source,
                reason: `CRITICAL COMPLIANCE FAILURE: ${signal.payload.reason}`,
                priority: 0 // P0 Human Intervention Required
            };
            console.log('[CONTROL TOWER] ISSUING DIRECTIVE:', directive);
            // In a real system, this would push to the UI or DB
        }
    }

    private evaluateRate(signal: UIBSignal) {
        // If Rate is P0 (Hold), confirm the Hold Directive
        if (signal.payload.holds?.length > 0) {
            const directive: IntelligenceDirective = {
                id: `dir-${Date.now()}`,
                type: 'HOLD',
                targetEntityId: signal.source,
                reason: `RATE HOLDS ACTIVE: ${signal.payload.explanation}`,
                priority: 0
            };
            console.log('[CONTROL TOWER] CONFIRMING RATE LOCK:', directive);
        }
    }

    private evaluateIngestion(signal: UIBSignal) {
        // Low priority log, used for analytics
        console.log(`[CONTROL TOWER] Ingested truth signal from ${signal.source}`);
    }

    private handlePermitUpdate(signal: UIBSignal) {
        if (signal.payload.status === 'ISSUED') {
            // Unlock the move
            console.log(`[CONTROL TOWER] Permit CLEARED. Ready for Dispatch.`);
        }
    }

    private triggerEmergencyProtocol(signal: UIBSignal) {
        // High Authority Override - P0 Emergency Stop
        const directive: IntelligenceDirective = {
            id: `dir-EMERGENCY-${Date.now()}`,
            type: 'HOLD',
            targetEntityId: signal.source,
            reason: `SAFETY CRITICAL EVENT: Evidence Vault Hash ${signal.hash}. IMMEDIATE STOP.`,
            priority: 0 // Absolute highest priority
        };
        console.error('[CONTROL TOWER] *** EMERGENCY STOP DIRECTIVE ISSUED ***', directive);
        this.dispatchEmergencyVoiceAgent(signal.source, `Safety Critical Event detected. Vault ID ${signal.hash}. Immediate stop order issued.`);
    }

    private async dispatchEmergencyVoiceAgent(source: string, message: string) {
        const vapiKey = process.env.VAPI_PRIVATE_KEY;
        const safetyPhone = process.env.EMERGENCY_SAFETY_PHONE;
        
        if (!vapiKey || !safetyPhone) {
            console.log('[CONTROL TOWER] Missing Vapi configuration for auto-dial (VAPI_PRIVATE_KEY or EMERGENCY_SAFETY_PHONE).');
            return;
        }

        try {
            await fetch('https://api.vapi.ai/call/phone', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${vapiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
                    customer: { number: safetyPhone },
                    assistant: {
                        firstMessage: `Attention Safety Manager. This is the Haul Command Control Tower. You have an active Emergency Hold. ${message}. Please review the active directive immediately.`,
                        model: { provider: 'openai', model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are the Haul Command emergency dispatcher auto-dialing a safety manager to confirm an emergency stop directive.' }] },
                        voice: { provider: '11labs', voiceId: 'bIHbv24MWmeRgasZH58o' }
                    }
                })
            });
            console.log(`[CONTROL TOWER] Vapi Emergency Auto-Dial Dispatched to ${safetyPhone}`);
        } catch (e) {
            console.error('[CONTROL TOWER] Vapi Dispatch Failed:', e);
        }
    }
}

export const controlTower = ControlTower.getInstance();
