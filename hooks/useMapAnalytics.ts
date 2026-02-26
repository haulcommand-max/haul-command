'use client';

/**
 * Map Analytics Hook
 * Tracks jurisdiction map interactions for engagement measurement.
 */

type MapEvent =
    | 'map_opened'
    | 'jurisdiction_selected'
    | 'drawer_opened'
    | 'operator_called'
    | 'operator_texted'
    | 'rulepack_opened'
    | 'support_contact_opened'
    | 'state_packet_exported';

interface EventPayload {
    jurisdiction_code?: string;
    operator_id?: string;
    rulepack_id?: string;
    contact_type?: string;
    [key: string]: unknown;
}

export function useMapAnalytics() {
    function track(event: MapEvent, payload?: EventPayload) {
        // Fire to window analytics if available (Vercel Analytics, GA, etc.)
        try {
            if (typeof window !== 'undefined') {
                // Vercel Web Analytics
                if ((window as any).va) {
                    (window as any).va('event', { name: event, ...payload });
                }
                // Google Analytics (gtag)
                if ((window as any).gtag) {
                    (window as any).gtag('event', event, payload);
                }
                // Debug logging in dev
                if (process.env.NODE_ENV === 'development') {
                    console.log(`[MapAnalytics] ${event}`, payload);
                }
            }
        } catch {
            // Non-fatal: analytics should never break the app
        }
    }

    return {
        trackMapOpened: () => track('map_opened'),
        trackJurisdictionSelected: (code: string) => track('jurisdiction_selected', { jurisdiction_code: code }),
        trackDrawerOpened: (code: string) => track('drawer_opened', { jurisdiction_code: code }),
        trackOperatorCalled: (code: string, operatorId: string) => track('operator_called', { jurisdiction_code: code, operator_id: operatorId }),
        trackOperatorTexted: (code: string, operatorId: string) => track('operator_texted', { jurisdiction_code: code, operator_id: operatorId }),
        trackRulepackOpened: (code: string, rulepackId: string) => track('rulepack_opened', { jurisdiction_code: code, rulepack_id: rulepackId }),
        trackSupportContactOpened: (code: string, contactType: string) => track('support_contact_opened', { jurisdiction_code: code, contact_type: contactType }),
        trackStatePacketExported: (code: string) => track('state_packet_exported', { jurisdiction_code: code }),
    };
}
