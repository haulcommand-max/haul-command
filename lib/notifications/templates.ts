/**
 * Push Notification Templates — Haul Command
 *
 * All notification copy lives here, typed by event.
 * Import and call the right template at each trigger site.
 */

import type { NotificationType } from './fcm';

export interface NotificationTemplate {
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, string>;
}

// ── Dispatch Engine — wave notifications ──

export function dispatchWaveTemplate(params: {
    origin: string;
    destination: string;
    waveNumber: number;
    loadType: string;
    requestId: string;
}): NotificationTemplate {
    return {
        type: 'dispatch_wave',
        title: `Wave ${params.waveNumber} — Load Match`,
        body: `${params.loadType} load: ${params.origin} → ${params.destination}. Respond now before wave ${params.waveNumber + 1} goes out.`,
        data: { requestId: params.requestId, screen: '/dispatch' },
    };
}

// ── Availability — hold request from broker ──

export function holdRequestTemplate(params: {
    brokerName: string;
    origin: string;
    destination: string;
    dateNeeded: string;
    holdId: string;
}): NotificationTemplate {
    return {
        type: 'hold_request',
        title: `Hold request from ${params.brokerName}`,
        body: `${params.origin} → ${params.destination} on ${params.dateNeeded}. Expires in 30 min.`,
        data: { holdId: params.holdId, screen: '/availability/holds' },
    };
}

// ── Availability — operator accepted / declined hold ──

export function holdResponseTemplate(params: {
    operatorName: string;
    accepted: boolean;
    holdId: string;
}): NotificationTemplate {
    return {
        type: params.accepted ? 'hold_accepted' : 'hold_declined',
        title: params.accepted
            ? `${params.operatorName} accepted your hold`
            : `${params.operatorName} declined your hold`,
        body: params.accepted
            ? 'Your booking is confirmed. Tap to view details.'
            : 'This operator is unavailable. Tap to find alternatives.',
        data: { holdId: params.holdId, screen: '/bookings' },
    };
}

// ── QuickPay — operator receives payout confirmation ──

export function quickpayDepositTemplate(params: {
    amountUsd: number;
    jobReference: string;
    transactionId: string;
}): NotificationTemplate {
    return {
        type: 'quickpay_deposit',
        title: `QuickPay deposit: $${params.amountUsd.toFixed(2)}`,
        body: `Payment for job ${params.jobReference} is on its way to your bank. Typically arrives in minutes.`,
        data: {
            transactionId: params.transactionId,
            screen: '/wallet',
        },
    };
}

// ── Load Board — Grade A load alert (Pro users) ──

export function gradeALoadTemplate(params: {
    corridor: string;
    ratePerMile: number;
    loadId: string;
}): NotificationTemplate {
    return {
        type: 'load_grade_a',
        title: `Grade A load on ${params.corridor}`,
        body: `$${params.ratePerMile.toFixed(2)}/mi — above corridor average. Tap to view before it's gone.`,
        data: { loadId: params.loadId, screen: `/loads/${params.loadId}` },
    };
}

// ── TriRoute — anti-deadhead match found ──

export function triRouteMatchTemplate(params: {
    returnCorridor: string;
    savingsEstimateUsd: number;
    loadId: string;
}): NotificationTemplate {
    return {
        type: 'triroute_match',
        title: `TriRoute match: ${params.returnCorridor}`,
        body: `Estimated $${params.savingsEstimateUsd} saved in deadhead. Tap to see the triangle.`,
        data: { loadId: params.loadId, screen: `/loads/${params.loadId}` },
    };
}

// ── Vapi — claim resolved ──

export function vapiClaimResolvedTemplate(params: {
    resolution: 'approved' | 'denied' | 'escalated';
    claimId: string;
}): NotificationTemplate {
    const copy = {
        approved: {
            title: 'Claim approved',
            body: 'Your claim has been approved. Tap to view details.',
        },
        denied: {
            title: 'Claim update',
            body: 'Your claim was not approved. Tap to review or escalate.',
        },
        escalated: {
            title: 'Claim escalated',
            body: "Your claim has been escalated to our team. We'll follow up within 24 hours.",
        },
    }[params.resolution];

    return {
        type: 'vapi_claim_resolved',
        ...copy,
        data: { claimId: params.claimId, screen: '/claims' },
    };
}
