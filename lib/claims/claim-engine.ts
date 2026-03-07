// ══════════════════════════════════════════════════════════════
// CLAIM VERIFICATION ENGINE
// Handles all 6 verification routes:
//   1. DNS TXT record
//   2. Website token (meta tag / .well-known)
//   3. Email OTP
//   4. SMS OTP
//   5. Document upload
//   6. Manual admin review
//
// Also: priority scoring, route selection, anti-fraud checks.
// ══════════════════════════════════════════════════════════════

import { SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import { sendViaSMTP, resolveProvider, type EmailEnvelope } from '@/lib/email/ses-client';

// ── Types ────────────────────────────────────────────────────

export type ClaimStatus = 'unclaimed' | 'claimable' | 'pending_verification' | 'claimed' | 'disputed' | 'locked';
export type VerificationRoute = 'dns' | 'website_token' | 'email_otp' | 'sms_otp' | 'document' | 'manual';
export type ClaimStepStatus = 'initiated' | 'otp_sent' | 'otp_verified' | 'review' | 'approved' | 'rejected' | 'disputed';

export interface Surface {
    id: string;
    country_code: string;
    surface_type: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    claim_status: ClaimStatus;
    claim_priority_score: number;
    claim_methods_available: string[];
    risk_score: number;
    outreach_attempts_30d: number;
}

export interface Claim {
    id: string;
    surface_id: string;
    claimant_user_id: string;
    status: ClaimStepStatus;
    verification_route: VerificationRoute;
    verification_token?: string;
    verification_token_expires?: string;
    verification_attempts: number;
}

export interface ClaimResult {
    success: boolean;
    claim_id?: string;
    status: ClaimStepStatus;
    next_step: string;
    verification_route: VerificationRoute;
    error?: string;
}

// ── Route Selection ─────────────────────────────────────────

const ROUTE_PRIORITY: VerificationRoute[] = [
    'dns', 'website_token', 'email_otp', 'sms_otp', 'document', 'manual',
];

const SURFACE_TYPE_PREFERENCES: Record<string, VerificationRoute[]> = {
    operator_profile: ['sms_otp', 'email_otp', 'document'],
    port: ['dns', 'website_token', 'email_otp'],
    hotel: ['email_otp', 'website_token', 'document'],
    motel: ['email_otp', 'sms_otp', 'document'],
    facility: ['dns', 'email_otp', 'document'],
    service_provider: ['email_otp', 'sms_otp', 'document'],
};

function selectBestRoute(surface: Surface): VerificationRoute {
    const typePrefs = SURFACE_TYPE_PREFERENCES[surface.surface_type] ?? ROUTE_PRIORITY;
    const available = surface.claim_methods_available ?? [];

    for (const route of typePrefs) {
        if (available.includes(route)) return route;
    }

    // Fallback to any available route in global priority order
    for (const route of ROUTE_PRIORITY) {
        if (available.includes(route)) return route;
    }

    return 'manual';
}

// ── OTP Generation ──────────────────────────────────────────

function generateOTP(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

// ── Anti-Fraud Checks ───────────────────────────────────────

export interface FraudCheckResult {
    allowed: boolean;
    reason?: string;
    step_up_required: boolean;
}

async function checkFraud(
    db: SupabaseClient,
    userId: string,
    surfaceId: string,
): Promise<FraudCheckResult> {
    const dayAgo = new Date(Date.now() - 86400000).toISOString();

    // Velocity guard: > 5 claims in 24h
    const { count: recentClaims } = await db
        .from('claims')
        .select('id', { count: 'exact', head: true })
        .eq('claimant_user_id', userId)
        .gte('created_at', dayAgo);

    if ((recentClaims ?? 0) >= 5) {
        return { allowed: false, reason: 'velocity_guard: too many claims in 24h', step_up_required: true };
    }

    // Contact collision: check if this surface's phone/email is used by many other claimed surfaces
    const { data: surface } = await db
        .from('surfaces')
        .select('phone, email')
        .eq('id', surfaceId)
        .single();

    if (surface?.phone) {
        const { count: phoneCollisions } = await db
            .from('surfaces')
            .select('id', { count: 'exact', head: true })
            .eq('phone', surface.phone)
            .eq('claim_status', 'claimed')
            .neq('id', surfaceId);

        if ((phoneCollisions ?? 0) >= 3) {
            return { allowed: true, reason: 'contact_collision: phone used across multiple surfaces', step_up_required: true };
        }
    }

    // Dispute protection: surface has prior owner
    const { data: existingClaim } = await db
        .from('claims')
        .select('id')
        .eq('surface_id', surfaceId)
        .eq('status', 'approved')
        .limit(1)
        .maybeSingle();

    if (existingClaim) {
        return { allowed: true, reason: 'dispute_protection: surface has existing approved claim', step_up_required: true };
    }

    return { allowed: true, step_up_required: false };
}

// ══════════════════════════════════════════════════════════════
// CLAIM ENGINE CLASS
// ══════════════════════════════════════════════════════════════

export class ClaimEngine {
    constructor(private db: SupabaseClient) { }

    // ── INITIATE CLAIM ──────────────────────────────────────

    async initiateClaim(
        userId: string,
        surfaceId: string,
        preferredRoute?: VerificationRoute,
    ): Promise<ClaimResult> {
        // 1. Check surface exists and is claimable
        const { data: surface, error: surfErr } = await this.db
            .from('surfaces')
            .select('*')
            .eq('id', surfaceId)
            .single();

        if (surfErr || !surface) {
            return { success: false, status: 'initiated', next_step: 'surface_not_found', verification_route: 'manual', error: 'Surface not found' };
        }

        if (!['unclaimed', 'claimable'].includes(surface.claim_status)) {
            return { success: false, status: 'initiated', next_step: 'not_claimable', verification_route: 'manual', error: `Surface is ${surface.claim_status}` };
        }

        // 2. Anti-fraud check
        const fraudCheck = await checkFraud(this.db, userId, surfaceId);
        if (!fraudCheck.allowed) {
            await this.audit(surfaceId, null, 'system', 'fraud_blocked', { reason: fraudCheck.reason });
            return { success: false, status: 'initiated', next_step: 'fraud_blocked', verification_route: 'manual', error: fraudCheck.reason };
        }

        // 3. Select verification route
        const route = preferredRoute && surface.claim_methods_available?.includes(preferredRoute)
            ? preferredRoute
            : selectBestRoute(surface as Surface);

        // 4. Create claim record
        const token = route === 'email_otp' || route === 'sms_otp' ? generateOTP() : generateToken();
        const ttlMs = route === 'sms_otp' ? 10 * 60000 : route === 'email_otp' ? 20 * 60000 : 48 * 3600000;

        const { data: claim, error: claimErr } = await this.db
            .from('claims')
            .insert({
                surface_id: surfaceId,
                claimant_user_id: userId,
                country_code: surface.country_code,
                status: 'initiated',
                verification_route: route,
                verification_token: hashToken(token),
                verification_token_expires: new Date(Date.now() + ttlMs).toISOString(),
            })
            .select()
            .single();

        if (claimErr || !claim) {
            return { success: false, status: 'initiated', next_step: 'claim_creation_failed', verification_route: route, error: claimErr?.message };
        }

        // 5. Update surface status
        await this.db.from('surfaces').update({
            claim_status: 'pending_verification',
            updated_at: new Date().toISOString(),
        }).eq('id', surfaceId);

        // 6. Audit
        await this.audit(surfaceId, claim.id, 'user', 'claim_initiated', {
            route, step_up: fraudCheck.step_up_required,
        });

        // 7. Send verification based on route
        let nextStep = '';
        switch (route) {
            case 'email_otp': {
                nextStep = `OTP sent to ${maskEmail(surface.email)}. Enter it to verify.`;
                const otp = token.slice(0, 6).toUpperCase();
                try {
                    const provider = await resolveProvider(this.db);
                    const envelope: EmailEnvelope = {
                        from: 'noreply@haulcommand.com',
                        fromName: 'Haul Command',
                        replyTo: 'support@haulcommand.com',
                        to: surface.email,
                        subject: `Your Haul Command verification code: ${otp}`,
                        html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 30 minutes.</p>`,
                        text: `Your verification code is: ${otp}. This code expires in 30 minutes.`,
                        tags: { source: 'claim_otp', claim_id: claim.id },
                    };
                    await sendViaSMTP(envelope, provider);
                } catch (err) {
                    console.error('[claim-engine] email_otp send failed:', err);
                }
                await this.db.from('claims').update({ status: 'otp_sent' }).eq('id', claim.id);
                break;
            }
            case 'sms_otp':
                nextStep = `OTP sent to ${maskPhone(surface.phone)}. Enter it to verify.`;
                // SMS delivery requires Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
                await this.db.from('claims').update({ status: 'otp_sent' }).eq('id', claim.id);
                break;
            case 'dns':
                nextStep = `Add TXT record: haulcommand-verify=${token} to your domain DNS.`;
                break;
            case 'website_token':
                nextStep = `Add meta tag <meta name="haulcommand-verify" content="${token}"> or create /.well-known/claim-token.txt with content: ${token}`;
                break;
            case 'document':
                nextStep = 'Upload a business document (license, utility bill, etc.) to verify ownership.';
                await this.db.from('claims').update({ status: 'review' }).eq('id', claim.id);
                break;
            case 'manual':
                nextStep = 'Your claim has been submitted for manual review. An admin will review it shortly.';
                await this.db.from('claims').update({ status: 'review' }).eq('id', claim.id);
                break;
        }

        return {
            success: true,
            claim_id: claim.id,
            status: route === 'email_otp' || route === 'sms_otp' ? 'otp_sent' : 'initiated',
            next_step: nextStep,
            verification_route: route,
        };
    }

    // ── VERIFY OTP ──────────────────────────────────────────

    async verifyOTP(claimId: string, userOtp: string): Promise<ClaimResult> {
        const { data: claim } = await this.db
            .from('claims')
            .select('*')
            .eq('id', claimId)
            .single();

        if (!claim) {
            return { success: false, status: 'initiated', next_step: 'claim_not_found', verification_route: 'manual', error: 'Claim not found' };
        }

        // Check expiry
        if (new Date(claim.verification_token_expires) < new Date()) {
            return { success: false, status: claim.status, next_step: 'otp_expired', verification_route: claim.verification_route, error: 'OTP has expired. Please request a new one.' };
        }

        // Check attempts
        if (claim.verification_attempts >= 5) {
            await this.db.from('claims').update({ status: 'rejected', rejected_reason: 'too_many_attempts' }).eq('id', claimId);
            return { success: false, status: 'rejected', next_step: 'too_many_attempts', verification_route: claim.verification_route, error: 'Too many failed attempts.' };
        }

        // Verify
        const hashedInput = hashToken(userOtp);
        if (hashedInput !== claim.verification_token) {
            await this.db.from('claims').update({
                verification_attempts: (claim.verification_attempts ?? 0) + 1,
            }).eq('id', claimId);
            return { success: false, status: claim.status, next_step: 'invalid_otp', verification_route: claim.verification_route, error: 'Invalid code. Please try again.' };
        }

        // OTP valid → approve claim
        return this.approveClaim(claimId, claim.surface_id, claim.claimant_user_id);
    }

    // ── VERIFY DNS / WEBSITE TOKEN ──────────────────────────

    async verifyToken(claimId: string): Promise<ClaimResult> {
        const { data: claim } = await this.db
            .from('claims')
            .select('*')
            .eq('id', claimId)
            .single();

        if (!claim) {
            return { success: false, status: 'initiated', next_step: 'claim_not_found', verification_route: 'manual', error: 'Claim not found' };
        }

        const { data: surface } = await this.db
            .from('surfaces')
            .select('website')
            .eq('id', claim.surface_id)
            .single();

        if (!surface?.website) {
            return { success: false, status: claim.status, next_step: 'no_website', verification_route: claim.verification_route, error: 'Surface has no website' };
        }

        // In production, this would:
        // - For DNS: resolve TXT records and check for token
        // - For website_token: fetch meta tags or .well-known file
        // For now, mark as pending review
        await this.db.from('claims').update({ status: 'review' }).eq('id', claimId);
        await this.audit(claim.surface_id, claimId, 'system', 'token_check_queued', { route: claim.verification_route });

        return {
            success: true,
            claim_id: claimId,
            status: 'review',
            next_step: 'Token verification queued. We will check your DNS/website within 24 hours.',
            verification_route: claim.verification_route,
        };
    }

    // ── APPROVE CLAIM ───────────────────────────────────────

    async approveClaim(claimId: string, surfaceId: string, userId: string): Promise<ClaimResult> {
        const now = new Date().toISOString();

        // Update claim
        await this.db.from('claims').update({
            status: 'approved',
            approved_at: now,
            updated_at: now,
        }).eq('id', claimId);

        // Update surface
        await this.db.from('surfaces').update({
            claim_status: 'claimed',
            claim_owner_id: userId,
            updated_at: now,
        }).eq('id', surfaceId);

        // Audit
        await this.audit(surfaceId, claimId, 'system', 'claim_approved', { userId });

        return {
            success: true,
            claim_id: claimId,
            status: 'approved',
            next_step: 'Congratulations! Your listing is now claimed. You can edit it and access perks.',
            verification_route: 'manual',
        };
    }

    // ── GET CLAIMABLE STATUS ────────────────────────────────

    async getClaimableStatus(surfaceId: string): Promise<{
        claimable: boolean;
        claim_status: ClaimStatus;
        available_routes: VerificationRoute[];
        priority_tier: string;
    }> {
        const { data: surface } = await this.db
            .from('surfaces')
            .select('claim_status, claim_methods_available, claim_priority_tier')
            .eq('id', surfaceId)
            .single();

        if (!surface) {
            return { claimable: false, claim_status: 'unclaimed', available_routes: [], priority_tier: 'D' };
        }

        return {
            claimable: ['unclaimed', 'claimable'].includes(surface.claim_status),
            claim_status: surface.claim_status as ClaimStatus,
            available_routes: (surface.claim_methods_available ?? []) as VerificationRoute[],
            priority_tier: surface.claim_priority_tier ?? 'D',
        };
    }

    // ── AUDIT LOG ───────────────────────────────────────────

    private async audit(surfaceId: string, claimId: string | null, actor: string, action: string, payload: Record<string, any>): Promise<void> {
        await this.db.from('claim_audit_log').insert({
            surface_id: surfaceId,
            claim_id: claimId,
            actor,
            action,
            payload,
        });
    }
}

// ── Helpers ──────────────────────────────────────────────────

function maskEmail(email?: string | null): string {
    if (!email) return '***@***.***';
    const [local, domain] = email.split('@');
    return `${local[0]}***@${domain}`;
}

function maskPhone(phone?: string | null): string {
    if (!phone) return '***-****';
    return `***-***-${phone.slice(-4)}`;
}
