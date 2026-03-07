// app/api/v1/auth/social-callback/route.ts
//
// POST /api/v1/auth/social-callback
// Called after successful social login (Google/Facebook/LinkedIn).
// Triggers: avatar import → identity enrichment → trust bonus → claim matching.

import { NextResponse } from "next/server";
import { autoImportOnLogin } from "@/lib/avatars/avatar-pipeline";
import { enrichOnSocialLogin, type ProviderProfile } from "@/lib/identity/social-enrichment";
import { checkUpgradeNudge } from "@/lib/avatars/avatar-pipeline";

export const runtime = "nodejs";

interface SocialCallbackBody {
    user_id: string;
    provider: "google" | "facebook" | "linkedin";
    provider_user_id: string;
    email?: string;
    email_verified?: boolean;
    display_name?: string;
    avatar_url?: string;
    city?: string;
    raw_profile?: Record<string, any>;
}

export async function POST(req: Request) {
    let body: SocialCallbackBody;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body.user_id || !body.provider || !body.provider_user_id) {
        return NextResponse.json(
            { error: "user_id, provider, and provider_user_id required" },
            { status: 400 }
        );
    }

    try {
        // 1) Avatar auto-import
        const avatarResult = await autoImportOnLogin(
            body.user_id,
            body.provider,
            {
                id: body.provider_user_id,
                picture: body.avatar_url,
                avatar_url: body.avatar_url,
                ...(body.raw_profile ?? {}),
            }
        );

        // 2) Identity enrichment (trust bonus + claim matching + dedupe)
        const providerProfile: ProviderProfile = {
            provider: body.provider,
            provider_user_id: body.provider_user_id,
            email: body.email,
            email_verified: body.email_verified,
            display_name: body.display_name,
            avatar_url: body.avatar_url,
            raw_profile: body.raw_profile,
        };

        const enrichment = await enrichOnSocialLogin(body.user_id, providerProfile);

        // 3) Check if avatar nudge needed
        const nudge = avatarResult?.quality_score != null
            ? checkUpgradeNudge(avatarResult.quality_score)
            : { should_nudge: false, message: "" };

        return NextResponse.json({
            ok: true,
            user_id: body.user_id,
            provider: body.provider,

            avatar: {
                action: avatarResult?.action ?? "skipped",
                url: avatarResult?.avatar_url ?? null,
                quality_score: avatarResult?.quality_score ?? null,
                quality_tier: avatarResult?.quality_tier ?? null,
            },

            enrichment: {
                trust_bonus: enrichment.trust_bonus_applied,
                combined_multiplier: enrichment.combined_multiplier,
                providers_linked: enrichment.providers_linked,
                profile_completion: enrichment.profile_completion,
            },

            claim_flow: enrichment.claim_match_found
                ? {
                    match_found: true,
                    confidence: enrichment.claim_confidence,
                    prompt: {
                        title: "We found your listing",
                        action_primary: "Claim profile",
                        action_secondary: "Not me",
                    },
                }
                : { match_found: false },

            nudge: nudge.should_nudge ? { message: nudge.message } : null,
        });
    } catch (err: any) {
        console.error("[Social Callback Error]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
