// ══════════════════════════════════════════════════════════════
// GLOBAL COMMS DEEP-LINK ENGINE
// Routes every user to highest-conversion channel for their
// country, role, and device. Tier-aware.
// ══════════════════════════════════════════════════════════════

import { getCountry, getSocialChannels, getCountryTier, type SocialChannel } from "../config/country-registry";

// ── Deep Link Generators ──

export interface DeepLink {
    channel: SocialChannel;
    url: string;
    label: string;
    icon: string;
}

export function generateCommsDeepLink(
    channel: SocialChannel,
    params: {
        phone?: string;
        email?: string;
        groupId?: string;
        companySlug?: string;
        message?: string;
        subject?: string;
    }
): DeepLink {
    switch (channel) {
        case "whatsapp":
            return {
                channel: "whatsapp",
                url: `https://wa.me/${params.phone ?? ""}?text=${encodeURIComponent(params.message ?? "Hi, I found you on Haul Command.")}`,
                label: "Message on WhatsApp",
                icon: "whatsapp",
            };
        case "facebook":
            return {
                channel: "facebook",
                url: params.groupId ? `https://www.facebook.com/groups/${params.groupId}` : "https://www.facebook.com/haulcommand",
                label: "Join Facebook Group",
                icon: "facebook",
            };
        case "linkedin":
            return {
                channel: "linkedin",
                url: `https://www.linkedin.com/company/${params.companySlug ?? "haulcommand"}`,
                label: "Connect on LinkedIn",
                icon: "linkedin",
            };
        case "xing":
            return {
                channel: "xing",
                url: `https://www.xing.com/pages/${params.companySlug ?? "haulcommand"}`,
                label: "Connect on XING",
                icon: "xing",
            };
        case "instagram":
            return {
                channel: "instagram",
                url: `https://www.instagram.com/${params.companySlug ?? "haulcommand"}`,
                label: "Follow on Instagram",
                icon: "instagram",
            };
        case "sms":
            return {
                channel: "sms",
                url: `sms:${params.phone ?? ""}?body=${encodeURIComponent(params.message ?? "")}`,
                label: "Send Text",
                icon: "sms",
            };
        case "email":
        default:
            return {
                channel: "email",
                url: `mailto:${params.email ?? "hello@haulcommand.com"}?subject=${encodeURIComponent(params.subject ?? "Inquiry from Haul Command")}`,
                label: "Send Email",
                icon: "email",
            };
    }
}

// ── Country-Aware Channel Router ──

export interface CommsRoutingResult {
    primary: DeepLink;
    secondary: DeepLink;
    tier: string;
    countryCode: string;
}

export function routeComms(
    countryCode: string,
    operatorData: {
        phone?: string;
        email?: string;
        facebookGroupId?: string;
        linkedinSlug?: string;
    }
): CommsRoutingResult {
    const channels = getSocialChannels(countryCode);
    const tier = getCountryTier(countryCode);

    const primary = generateCommsDeepLink(channels.primary, {
        phone: operatorData.phone,
        email: operatorData.email,
        groupId: operatorData.facebookGroupId,
        companySlug: operatorData.linkedinSlug,
    });

    const secondary = generateCommsDeepLink(channels.secondary, {
        phone: operatorData.phone,
        email: operatorData.email,
        companySlug: operatorData.linkedinSlug,
    });

    return { primary, secondary, tier, countryCode };
}

// ── Comms Success Tracking ──

export interface CommsMetrics {
    channel: SocialChannel;
    countryCode: string;
    contactInitiatedRate: number;
    responseWithin24h: number;
    channelConversionRate: number;
}

export function evaluateChannelHealth(metrics: CommsMetrics): "healthy" | "underperforming" | "failing" {
    if (metrics.channelConversionRate >= 0.15 && metrics.responseWithin24h >= 0.60) return "healthy";
    if (metrics.channelConversionRate >= 0.08) return "underperforming";
    return "failing";
}
