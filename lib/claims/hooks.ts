// ════════════════════════════════════════════════════════════════
// lib/claims/hooks.ts
// Claim Monetization Hooks — migrated from lib/claim-engine.ts (root)
// These define WHAT REVENUE ACTION fires at each claim state transition.
// ════════════════════════════════════════════════════════════════

export interface MonetizationHook {
    trigger: string;
    offer: string;
    channel: string;
    urgency: 'soft' | 'medium' | 'hard';
    cta_text: string;
    cta_href: string;
}

export const MONETIZATION_HOOKS: MonetizationHook[] = [
    {
        trigger: 'otp_verified',
        offer: '14-day Commander trial',
        channel: 'in-app',
        urgency: 'soft',
        cta_text: 'Start Free Trial',
        cta_href: '/upgrade?plan=pro&trigger=otp_verified',
    },
    {
        trigger: 'ownership_granted',
        offer: 'You\'re live! Get found faster with Pro.',
        channel: 'in-app',
        urgency: 'soft',
        cta_text: 'Upgrade to Pro',
        cta_href: '/upgrade?plan=pro&trigger=ownership_granted',
    },
    {
        trigger: 'profile_50',
        offer: 'Upgrade for more load exposure',
        channel: 'in-app',
        urgency: 'medium',
        cta_text: 'See Pro Benefits',
        cta_href: '/upgrade?plan=pro&trigger=profile_50',
    },
    {
        trigger: 'profile_70',
        offer: 'Start premium trial — dispatch eligible',
        channel: 'in-app',
        urgency: 'medium',
        cta_text: 'Start Dispatch Trial',
        cta_href: '/upgrade?plan=elite&trigger=profile_70',
    },
    {
        trigger: 'first_search_impression',
        offer: 'See who viewed you with Commander',
        channel: 'in-app',
        urgency: 'soft',
        cta_text: 'Unlock Viewer Analytics',
        cta_href: '/upgrade?plan=pro&trigger=first_impression',
    },
    {
        trigger: 'first_compare',
        offer: 'Stand out with priority dispatch',
        channel: 'in-app',
        urgency: 'soft',
        cta_text: 'Get Priority',
        cta_href: '/upgrade?plan=pro&trigger=first_compare',
    },
    {
        trigger: 'document_verified',
        offer: 'Premium trust advantages',
        channel: 'in-app',
        urgency: 'soft',
        cta_text: 'Unlock Trust Advantages',
        cta_href: '/upgrade?plan=elite&trigger=doc_verified',
    },
    {
        trigger: 'insurance_expiring',
        offer: 'Partner insurance quote',
        channel: 'email',
        urgency: 'hard',
        cta_text: 'Get Insured Fast',
        cta_href: '/insurance?trigger=expiry_nudge',
    },
    // ── NEW: Sponsor upsells ──
    {
        trigger: 'dispatch_eligible',
        offer: 'Own your corridor — be the exclusive sponsor',
        channel: 'in-app',
        urgency: 'soft',
        cta_text: 'View Territory Availability',
        cta_href: '/advertise/territory?trigger=dispatch_eligible',
    },
    {
        trigger: 'premium_paid',
        offer: 'Tell operators about Haul Command. Earn referral credits.',
        channel: 'in-app',
        urgency: 'soft',
        cta_text: 'Share Referral Link',
        cta_href: '/referral?trigger=premium_paid',
    },
];

// ── Hook Resolver ──
// Returns the hook(s) to fire for a given trigger event.
export function getHooksForTrigger(trigger: string): MonetizationHook[] {
    return MONETIZATION_HOOKS.filter(h => h.trigger === trigger);
}
