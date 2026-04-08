export interface AiReadinessScoresInput {
    profile_completeness_score: number;
    attribute_coverage_score: number;
    proof_density_score: number;
    freshness_score: number;
    review_specificity_score: number;
    geo_fit_score: number;
    language_fit_score: number;
    internal_link_score: number;
    query_coverage_score: number;
    conversion_readiness_score: number;
}

export interface ReadinessOutput {
    overall_score: number;
    band: "dominant" | "strong" | "improvable" | "weak" | "thin";
    top_actions: string[];
}

export function calculateAiReadiness(input: AiReadinessScoresInput): ReadinessOutput {
    // Math logic based exactly on spec weighting ratios
    let finalScore = 0;
    
    finalScore += (input.profile_completeness_score * 0.15);
    finalScore += (input.attribute_coverage_score * 0.18);
    finalScore += (input.proof_density_score * 0.14);
    finalScore += (input.freshness_score * 0.12);
    finalScore += (input.review_specificity_score * 0.12);
    finalScore += (input.geo_fit_score * 0.10);
    finalScore += (input.language_fit_score * 0.05);
    finalScore += (input.internal_link_score * 0.07);
    finalScore += (input.query_coverage_score * 0.04);
    finalScore += (input.conversion_readiness_score * 0.03);

    // Rounding to two decimals
    finalScore = Math.round(finalScore * 100) / 100;

    // Determine band
    let band: "dominant" | "strong" | "improvable" | "weak" | "thin" = "thin";
    if (finalScore >= 90) band = "dominant";
    else if (finalScore >= 75) band = "strong";
    else if (finalScore >= 60) band = "improvable";
    else if (finalScore >= 40) band = "weak";
    
    // Determine the next highest leverage actions by finding the largest gaps
    const actions: { name: string, gap: number }[] = [];
    actions.push({ name: "Add specific profile attributes", gap: 100 - input.attribute_coverage_score });
    actions.push({ name: "Upload compliance proof", gap: 100 - input.proof_density_score });
    actions.push({ name: "Update profile freshness", gap: 100 - input.freshness_score });
    actions.push({ name: "Request specific detailed reviews", gap: 100 - input.review_specificity_score });

    // Sort by largest gap
    actions.sort((a, b) => b.gap - a.gap);
    const top_actions = actions.slice(0, 3).map(a => a.name);

    return {
        overall_score: finalScore,
        band,
        top_actions
    };
}
