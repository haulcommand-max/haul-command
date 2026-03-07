// lib/avatars/avatar-pipeline.ts
//
// Social Avatar Auto-Import Engine
// Download → Normalize → Quality Score → Store → Update Profile
// Never hotlinks. Always copies to own storage.

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export type AvatarSource = "placeholder" | "social_import" | "user_upload";
export type AvatarProvider = "google" | "facebook" | "linkedin";
export type AvatarQualityTier = "poor" | "acceptable" | "good" | "excellent";

export interface AvatarImportResult {
    success: boolean;
    user_id: string;
    provider: AvatarProvider;
    action: "imported" | "skipped" | "failed";
    avatar_url?: string;
    quality_score?: number;
    quality_tier?: AvatarQualityTier;
    error?: string;
}

export interface AvatarQualityResult {
    score: number;
    tier: AvatarQualityTier;
    signals: {
        face_detected: boolean;
        resolution_score: number;
        blur_score: number;
        brightness_score: number;
        safe_content: boolean;
    };
}

// ============================================================
// PROVIDER AVATAR URL EXTRACTION
// ============================================================

const PROVIDER_PRIORITY: AvatarProvider[] = ["google", "facebook", "linkedin"];

export function extractProviderAvatarUrl(
    provider: AvatarProvider,
    providerData: Record<string, any>
): string | null {
    switch (provider) {
        case "google":
            // Google OAuth returns picture in profile
            return providerData.picture ?? providerData.avatar_url ?? null;
        case "facebook":
            // Facebook Graph API: /{user-id}/picture?type=large
            if (providerData.id) {
                return `https://graph.facebook.com/${providerData.id}/picture?type=large&width=512&height=512`;
            }
            return providerData.picture?.data?.url ?? null;
        case "linkedin":
            // LinkedIn returns profilePicture in profile
            return providerData.picture ?? providerData.avatar_url ?? null;
        default:
            return null;
    }
}

// ============================================================
// MAIN IMPORT PIPELINE
// ============================================================

export async function importSocialAvatar(
    userId: string,
    provider: AvatarProvider,
    providerData: Record<string, any>
): Promise<AvatarImportResult> {
    const supabase = getSupabaseAdmin();

    // 1) Check if user already has a non-placeholder avatar
    const { data: existing } = await supabase
        .from("user_avatars")
        .select("avatar_source,avatar_url")
        .eq("user_id", userId)
        .maybeSingle();

    const currentSource = (existing as any)?.avatar_source;
    if (currentSource === "user_upload") {
        // User uploaded their own — never overwrite
        await logImport(userId, provider, "skipped", null, null, "User has uploaded avatar");
        return { success: true, user_id: userId, provider, action: "skipped" };
    }

    if (currentSource === "social_import" && (existing as any)?.avatar_url) {
        // Already imported — skip unless forcing refresh
        await logImport(userId, provider, "skipped", null, null, "Avatar already imported");
        return { success: true, user_id: userId, provider, action: "skipped" };
    }

    // 2) Extract provider avatar URL
    const sourceUrl = extractProviderAvatarUrl(provider, providerData);
    if (!sourceUrl) {
        await logImport(userId, provider, "failed", null, null, "No avatar URL from provider");
        return { success: false, user_id: userId, provider, action: "failed", error: "No avatar URL" };
    }

    try {
        // 3) Download image to buffer
        const imageBuffer = await downloadImage(sourceUrl);
        if (!imageBuffer || imageBuffer.byteLength < 100) {
            throw new Error("Downloaded image too small or empty");
        }

        // 4) Quality scoring (lightweight heuristic)
        const quality = scoreAvatarQuality(imageBuffer);

        // 5) Generate variants and upload to Supabase Storage
        const variants = await generateAndUploadVariants(userId, imageBuffer, supabase);

        // 6) Get the 256px variant as primary
        const primaryVariant = variants.find((v) => v.size === 256) ?? variants[0];
        const cdnUrl = primaryVariant?.cdnUrl ?? "";

        // 7) Update user_avatars
        await supabase.from("user_avatars").upsert(
            {
                user_id: userId,
                avatar_url: cdnUrl,
                avatar_source: "social_import" as AvatarSource,
                avatar_provider: provider,
                avatar_quality_score: quality.score,
                avatar_quality_tier: quality.tier,
                face_detected: quality.signals.face_detected,
                resolution_width: 512,
                resolution_height: 512,
                storage_path: `avatars/${userId}`,
                avatar_imported_at: new Date().toISOString(),
                quality_scored_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
        );

        // 8) Store variant records
        for (const v of variants) {
            await supabase.from("avatar_variants").upsert(
                {
                    user_id: userId,
                    size: v.size,
                    format: "webp",
                    storage_path: v.storagePath,
                    cdn_url: v.cdnUrl,
                    file_size_bytes: v.fileSize,
                },
                { onConflict: "user_id,size,format" }
            );
        }

        // 9) Log success
        await logImport(userId, provider, "imported", quality.score, null);

        return {
            success: true,
            user_id: userId,
            provider,
            action: "imported",
            avatar_url: cdnUrl,
            quality_score: quality.score,
            quality_tier: quality.tier,
        };
    } catch (err: any) {
        await logImport(userId, provider, "failed", null, err.message);
        return {
            success: false,
            user_id: userId,
            provider,
            action: "failed",
            error: err.message,
        };
    }
}

// ============================================================
// AUTO-IMPORT ON LOGIN (trigger from auth callback)
// ============================================================

export async function autoImportOnLogin(
    userId: string,
    providerName: string,
    providerData: Record<string, any>
): Promise<AvatarImportResult | null> {
    const provider = providerName.toLowerCase() as AvatarProvider;
    if (!PROVIDER_PRIORITY.includes(provider)) return null;

    return importSocialAvatar(userId, provider, providerData);
}

// ============================================================
// AVATAR QUALITY SCORING (lightweight heuristic)
// ============================================================

export function scoreAvatarQuality(imageBuffer: ArrayBuffer): AvatarQualityResult {
    const byteLength = imageBuffer.byteLength;

    // Resolution score (based on file size as proxy)
    let resolutionScore: number;
    if (byteLength > 50000) resolutionScore = 90;
    else if (byteLength > 20000) resolutionScore = 70;
    else if (byteLength > 5000) resolutionScore = 50;
    else resolutionScore = 20;

    // Blur score (proxy: larger files tend to be sharper)
    const blurScore = Math.min(100, resolutionScore + 10);

    // Brightness score (default reasonable — full analysis needs Canvas/Sharp)
    const brightnessScore = 70;

    // Face detection (placeholder — integrate with face-api.js or cloud vision)
    const faceDetected = byteLength > 10000; // rough proxy

    // Safe content (placeholder — integrate with moderation API)
    const safeContent = true;

    // Weighted score
    const score = Math.round(
        (faceDetected ? 100 : 0) * 0.35 +
        resolutionScore * 0.20 +
        blurScore * 0.15 +
        brightnessScore * 0.10 +
        (safeContent ? 100 : 0) * 0.20
    );

    // Tier
    let tier: AvatarQualityTier;
    if (score >= 80) tier = "excellent";
    else if (score >= 60) tier = "good";
    else if (score >= 40) tier = "acceptable";
    else tier = "poor";

    return {
        score,
        tier,
        signals: {
            face_detected: faceDetected,
            resolution_score: resolutionScore,
            blur_score: blurScore,
            brightness_score: brightnessScore,
            safe_content: safeContent,
        },
    };
}

// ============================================================
// IMAGE DOWNLOAD
// ============================================================

async function downloadImage(url: string): Promise<ArrayBuffer> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { "User-Agent": "HaulCommand-AvatarBot/1.0" },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} downloading avatar`);
        }

        return await response.arrayBuffer();
    } finally {
        clearTimeout(timeout);
    }
}

// ============================================================
// VARIANT GENERATION + UPLOAD
// ============================================================

interface VariantResult {
    size: number;
    storagePath: string;
    cdnUrl: string;
    fileSize: number;
}

async function generateAndUploadVariants(
    userId: string,
    imageBuffer: ArrayBuffer,
    supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<VariantResult[]> {
    const targetSizes = [64, 128, 256, 512];
    const variants: VariantResult[] = [];
    const uint8 = new Uint8Array(imageBuffer);

    for (const size of targetSizes) {
        const storagePath = `avatars/${userId}/${size}.webp`;

        // Upload to Supabase Storage
        // Note: In production, use Sharp to resize. Here we upload the original
        // and rely on Supabase Image Transformation or a CDN resize layer.
        const { error } = await supabase.storage
            .from("avatars")
            .upload(storagePath, uint8, {
                contentType: "image/webp",
                upsert: true,
            });

        if (error) {
            console.error(`[Avatar Upload] Failed ${size}px for ${userId}:`, error.message);
            continue;
        }

        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(storagePath);

        variants.push({
            size,
            storagePath,
            cdnUrl: urlData.publicUrl,
            fileSize: uint8.byteLength,
        });
    }

    return variants;
}

// ============================================================
// UPGRADE NUDGE LOGIC
// ============================================================

export interface UpgradeNudge {
    should_nudge: boolean;
    message: string;
    reason: string;
}

export function checkUpgradeNudge(qualityScore: number): UpgradeNudge {
    if (qualityScore >= 55) {
        return { should_nudge: false, message: "", reason: "Quality acceptable" };
    }

    const messages = [
        "Profiles with clear photos get 32% more selections.",
        "Upload a sharper photo to boost your visibility in search results.",
    ];

    return {
        should_nudge: true,
        message: messages[Math.floor(Math.random() * messages.length)],
        reason: `Quality score ${qualityScore} below threshold (55)`,
    };
}

// ============================================================
// SEO ALT TEXT GENERATION
// ============================================================

export function generateAvatarAltText(displayName: string, role?: string): string {
    const roleSuffix = role ? ` ${role}` : " escort operator";
    return `${displayName}${roleSuffix} profile photo`;
}

// ============================================================
// AUDIT LOG
// ============================================================

async function logImport(
    userId: string,
    provider: AvatarProvider,
    action: string,
    qualityScore: number | null,
    errorMessage: string | null,
    note?: string
): Promise<void> {
    const supabase = getSupabaseAdmin();
    await supabase.from("avatar_import_log").insert({
        user_id: userId,
        provider,
        action,
        quality_score: qualityScore,
        error_message: errorMessage,
        metadata: note ? { note } : {},
    });
}
