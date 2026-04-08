export interface ProfileCompletenessInput {
    hasBasicIdentity?: boolean;
    serviceCount?: number;
    attributeCount?: number;
    hasGeoCoverage?: boolean;
    hasHours?: boolean;
    hasContactFields?: boolean;
    proofCount?: number;
    faqCount?: number;
    photoCount?: number;
    languageCount?: number;
    hasSectorSpecificity?: boolean;
    hasRelatedLinks?: boolean;
}

export interface ScoreOutput {
    score: number;
    fail_reasons: string[];
}

export function calculateProfileCompleteness(input: ProfileCompletenessInput): ScoreOutput {
    let score = 0;
    const failReasons: string[] = [];

    // Weights map to the exact architecture spec ratio (multiplying to a base of 100 max)
    // basic_identity: 0.10 (10 points)
    if (input.hasBasicIdentity) { score += 10; } 
    else { failReasons.push("Missing basic identity (name, canonical info)."); }

    // service_depth: 0.15 (15 points - max at 3 services)
    if ((input.serviceCount || 0) > 0) {
        score += Math.min(15, (input.serviceCount || 0) * 5);
    } else { failReasons.push("No explicit services declared."); }

    // attribute_depth: 0.15 (15 points - max at 5 attributes)
    if ((input.attributeCount || 0) > 0) {
        score += Math.min(15, (input.attributeCount || 0) * 3);
    } else { failReasons.push("Lacking attribute depth."); }

    // geo_coverage: 0.10 (10 points)
    if (input.hasGeoCoverage) { score += 10; }
    else { failReasons.push("Missing specific geography or corridor coverage."); }

    // hours_and_availability: 0.08 (8 points)
    if (input.hasHours) { score += 8; }
    else { failReasons.push("Availability hours missing."); }

    // contact_and_conversion_fields: 0.07 (7 points)
    if (input.hasContactFields) { score += 7; }
    else { failReasons.push("No conversion or contact fields."); }

    // proof_presence: 0.10 (10 points)
    if ((input.proofCount || 0) > 0) { score += 10; }
    else { failReasons.push("No documented proof or verified badges."); }

    // faq_q_and_a_depth: 0.05 (5 points)
    if ((input.faqCount || 0) >= 3) { score += 5; }
    else { failReasons.push("Low FAQ depth (under 3 common questions)."); }

    // photo_caption_depth: 0.05 (5 points)
    if ((input.photoCount || 0) > 0) { score += 5; }
    else { failReasons.push("No photo evidence attached."); }

    // language_support: 0.05 (5 points)
    if ((input.languageCount || 0) > 0) { score += 5; }
    else { failReasons.push("No language support mapping."); }

    // sector_specificity: 0.05 (5 points)
    if (input.hasSectorSpecificity) { score += 5; }
    else { failReasons.push("No explicit industry sectors defined."); }

    // related_links_presence: 0.05 (5 points)
    if (input.hasRelatedLinks) { score += 5; }
    else { failReasons.push("Disconnected from internal graph (needs related links)."); }

    return {
        score: Math.round(score * 100) / 100, // Round to 2 decimals
        fail_reasons: failReasons
    };
}
