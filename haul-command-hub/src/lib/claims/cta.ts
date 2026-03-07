export type ClaimCTAVariant = "surface_profile" | "hub_page";

export function getClaimCTACopy(variant: ClaimCTAVariant) {
    if (variant === "surface_profile") {
        return {
            headline: "Claim This Listing",
            body: "Verify your ownership and unlock priority placement, lead routing, and corridor visibility.",
            cta: "Start Free Claim",
        };
    }
    return {
        headline: "Own a Listing Here?",
        body: "Verified operators get priority placement, lead routing, and corridor visibility.",
        cta: "Claim Your Listing",
    };
}

export function getClaimVariant(pageType: string): ClaimCTAVariant {
    return pageType === "surface_profile" ? "surface_profile" : "hub_page";
}

export const CLAIM_TIERS = [
    { tier: "free", label: "Free", price: "$0", badge: "✓", color: "#00c896" },
    { tier: "verified", label: "Verified", price: "$19/mo", badge: "⚡", color: "#8090ff" },
    { tier: "pro", label: "Pro", price: "$49/mo", badge: "🔥", color: "#ffb400" },
    { tier: "enterprise", label: "Enterprise", price: "$199/mo", badge: "🏆", color: "#e040fb" },
] as const;
