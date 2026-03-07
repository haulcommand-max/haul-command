// lib/identity/social-enrichment.ts
//
// Social Login Identity Enrichment Engine
// Provider linking, trust score bonuses, claim flow matching,
// progressive profiling, fraud signals, and SEO enrichment.

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export type SocialProvider = "google" | "facebook" | "linkedin" | "email";

export interface ProviderProfile {
    provider: SocialProvider;
    provider_user_id: string;
    email?: string;
    email_verified?: boolean;
    display_name?: string;
    avatar_url?: string;
    raw_profile?: Record<string, any>;
}

export interface EnrichmentResult {
    user_id: string;
    provider: SocialProvider;
    trust_bonus_applied: number;
    combined_multiplier: number;
    providers_linked: number;
    claim_match_found: boolean;
    claim_confidence?: number;
    profile_completion: number;
}

// ============================================================
// TRUST SCORE WEIGHTS
// ============================================================

const TRUST_BONUSES: Record<SocialProvider, number> = {
    google: 1.25,
    linkedin: 1.20,
    facebook: 1.15,
    email: 1.00,
};

const MAX_SOCIAL_BOOST = 1.45;

// ============================================================
// LINK PROVIDER TO USER
// ============================================================

export async function linkProvider(
    userId: string,
    profile: ProviderProfile
): Promise<void> {
    const supabase = getSupabaseAdmin();

    await supabase.from("user_provider_links").upsert(
        {
            user_id: userId,
            provider: profile.provider,
            provider_user_id: profile.provider_user_id,
            provider_email: profile.email ?? null,
            email_verified: profile.email_verified ?? false,
            display_name: profile.display_name ?? null,
            avatar_url: profile.avatar_url ?? null,
            raw_profile: profile.raw_profile ?? {},
            trust_bonus: TRUST_BONUSES[profile.provider] ?? 1.00,
            last_login_at: new Date().toISOString(),
        },
        { onConflict: "provider,provider_user_id" }
    );
}

// ============================================================
// COMPUTE TRUST SCORE SOCIAL BONUS
// ============================================================

export async function computeTrustBonus(userId: string): Promise<{
    combined_multiplier: number;
    providers_linked: number;
    details: Record<string, boolean>;
}> {
    const supabase = getSupabaseAdmin();

    const { data: links } = await supabase
        .from("user_provider_links")
        .select("provider,email_verified")
        .eq("user_id", userId);

    const providers = (links ?? []) as any[];
    const details: Record<string, boolean> = {
        google_verified: false,
        facebook_verified: false,
        linkedin_verified: false,
    };

    let multiplier = 1.0;
    const uniqueProviders = new Set<string>();

    for (const p of providers) {
        if (uniqueProviders.has(p.provider)) continue;
        uniqueProviders.add(p.provider);

        const bonus = TRUST_BONUSES[p.provider as SocialProvider] ?? 1.0;
        // Stack additively: (1.25 - 1.0) + (1.20 - 1.0) = 0.45 → 1.45
        multiplier += (bonus - 1.0);
        details[`${p.provider}_verified`] = true;
    }

    const combined = Math.min(MAX_SOCIAL_BOOST, multiplier);

    // Persist
    await supabase.from("trust_score_social_bonuses").upsert(
        {
            user_id: userId,
            google_verified: details.google_verified,
            facebook_verified: details.facebook_verified,
            linkedin_verified: details.linkedin_verified,
            combined_social_multiplier: Number(combined.toFixed(2)),
            providers_linked: uniqueProviders.size,
            computed_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
    );

    return {
        combined_multiplier: Number(combined.toFixed(2)),
        providers_linked: uniqueProviders.size,
        details,
    };
}

// ============================================================
// CLAIM FLOW MATCHING
// ============================================================

export async function findClaimMatches(
    userId: string,
    email?: string,
    displayName?: string,
    city?: string
): Promise<Array<{ listing_id: string; confidence: number }>> {
    const supabase = getSupabaseAdmin();
    const matches: Array<{ listing_id: string; confidence: number }> = [];

    if (!email && !displayName) return matches;

    // Search unclaimed listings by email
    if (email) {
        const { data: emailMatches } = await supabase
            .from("operator_listings")
            .select("id,email,display_name,city")
            .eq("email", email)
            .eq("claimed", false)
            .limit(5);

        for (const listing of (emailMatches ?? []) as any[]) {
            matches.push({ listing_id: listing.id, confidence: 0.95 });
        }
    }

    // Fuzzy name + city match (if no email hit)
    if (matches.length === 0 && displayName) {
        const { data: nameMatches } = await supabase
            .from("operator_listings")
            .select("id,email,display_name,city")
            .ilike("display_name", `%${displayName}%`)
            .eq("claimed", false)
            .limit(10);

        for (const listing of (nameMatches ?? []) as any[]) {
            let confidence = 0.50;
            if (listing.display_name?.toLowerCase() === displayName.toLowerCase()) confidence = 0.80;
            if (city && listing.city?.toLowerCase() === city.toLowerCase()) confidence += 0.12;
            matches.push({ listing_id: listing.id, confidence: Math.min(1, confidence) });
        }
    }

    // Persist matches above threshold
    const AUTO_PROMPT_THRESHOLD = 0.65;
    for (const m of matches.filter((m) => m.confidence >= AUTO_PROMPT_THRESHOLD)) {
        await supabase.from("claim_flow_matches").insert({
            user_id: userId,
            listing_id: m.listing_id,
            match_confidence: m.confidence,
            match_inputs: { email, display_name: displayName, city },
            status: m.confidence >= 0.92 ? "auto_linked" : "prompted",
        });
    }

    return matches.filter((m) => m.confidence >= AUTO_PROMPT_THRESHOLD);
}

// ============================================================
// PROGRESSIVE PROFILING
// ============================================================

const OPERATOR_STEPS = ["role_select", "service_area", "availability", "equipment", "certifications"];
const BROKER_STEPS = ["role_select", "company_name", "lanes"];

export async function getProfileProgress(userId: string): Promise<{
    completion: number;
    current_step: string | null;
    steps_completed: string[];
    steps_remaining: string[];
}> {
    const supabase = getSupabaseAdmin();

    const { data } = await supabase
        .from("user_profile_progress")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

    const progress = data as any;
    if (!progress) {
        return { completion: 0, current_step: "role_select", steps_completed: [], steps_remaining: OPERATOR_STEPS };
    }

    const steps = progress.user_role === "broker" ? BROKER_STEPS : OPERATOR_STEPS;
    const completed = (progress.steps_completed ?? []) as string[];
    const remaining = steps.filter((s) => !completed.includes(s));

    return {
        completion: Number((progress.completion_score ?? 0).toFixed(4)),
        current_step: progress.current_step,
        steps_completed: completed,
        steps_remaining: remaining,
    };
}

export async function completeProfileStep(
    userId: string,
    stepName: string,
    role: string = "operator"
): Promise<{ completion: number; next_step: string | null }> {
    const supabase = getSupabaseAdmin();
    const steps = role === "broker" ? BROKER_STEPS : OPERATOR_STEPS;

    // Get current
    const { data: existing } = await supabase
        .from("user_profile_progress")
        .select("steps_completed")
        .eq("user_id", userId)
        .maybeSingle();

    const currentCompleted = ((existing as any)?.steps_completed ?? []) as string[];
    if (!currentCompleted.includes(stepName)) {
        currentCompleted.push(stepName);
    }

    const completion = currentCompleted.length / steps.length;
    const remaining = steps.filter((s) => !currentCompleted.includes(s));
    const nextStep = remaining[0] ?? null;

    await supabase.from("user_profile_progress").upsert(
        {
            user_id: userId,
            user_role: role,
            completion_score: Number(completion.toFixed(4)),
            steps_completed: currentCompleted,
            current_step: nextStep,
            updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
    );

    return { completion: Number(completion.toFixed(4)), next_step: nextStep };
}

// ============================================================
// IDENTITY DEDUPE CHECK
// ============================================================

export async function checkForDuplicateIdentity(
    userId: string,
    email: string
): Promise<{ duplicate_found: boolean; candidate_user_id?: string }> {
    const supabase = getSupabaseAdmin();

    // Check if another user has the same email linked
    const { data: existing } = await supabase
        .from("user_provider_links")
        .select("user_id")
        .eq("provider_email", email)
        .neq("user_id", userId)
        .limit(1);

    if ((existing ?? []).length > 0) {
        const candidateId = (existing as any[])[0].user_id;

        // Log dedupe candidate
        await supabase.from("identity_dedupe_candidates").insert({
            user_id_a: userId,
            user_id_b: candidateId,
            match_type: "email_exact",
            confidence: 0.95,
            status: "pending",
        });

        return { duplicate_found: true, candidate_user_id: candidateId };
    }

    return { duplicate_found: false };
}

// ============================================================
// FULL ENRICHMENT PIPELINE (called on social login)
// ============================================================

export async function enrichOnSocialLogin(
    userId: string,
    profile: ProviderProfile
): Promise<EnrichmentResult> {
    // 1) Link provider
    await linkProvider(userId, profile);

    // 2) Compute trust bonus
    const trust = await computeTrustBonus(userId);

    // 3) Check for claim matches
    let claimFound = false;
    let claimConfidence: number | undefined;
    const claimMatches = await findClaimMatches(
        userId,
        profile.email,
        profile.display_name
    );
    if (claimMatches.length > 0) {
        claimFound = true;
        claimConfidence = claimMatches[0].confidence;
    }

    // 4) Check for duplicates
    if (profile.email) {
        await checkForDuplicateIdentity(userId, profile.email);
    }

    // 5) Get profile completion
    const progress = await getProfileProgress(userId);

    return {
        user_id: userId,
        provider: profile.provider,
        trust_bonus_applied: TRUST_BONUSES[profile.provider] ?? 1.0,
        combined_multiplier: trust.combined_multiplier,
        providers_linked: trust.providers_linked,
        claim_match_found: claimFound,
        claim_confidence: claimConfidence,
        profile_completion: progress.completion,
    };
}
