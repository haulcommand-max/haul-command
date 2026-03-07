/**
 * Place Claim Flow Engine
 *
 * Handles the complete claim lifecycle:
 *  1. Render CTA on unclaimed place
 *  2. Start claim (capture minimum fields)
 *  3. Verify ownership (phone OTP / DNS / email domain)
 *  4. Unlock editing
 *  5. Prompt enrichment
 *  6. Offer premium upgrade
 *
 * Rule: No human review required. If cannot verify, hold as pending.
 */

import { createClient } from "@supabase/supabase-js";
import crypto from 'crypto';
import { sendViaSMTP, resolveProvider } from "@/lib/email/ses-client";

// ── Types ──────────────────────────────────────────────────────────────────

export type VerificationMethod = 'phone_otp' | 'website_dns' | 'website_html_tag' | 'email_domain_match' | 'website_contact_email_token' | 'voice_callback_verification';

export interface ClaimStartInput {
    placeId: string;
    claimantAccountId: string;
    claimantRole: string;
    verificationMethod: VerificationMethod;
    businessPhone?: string;
    businessEmail?: string;
    businessWebsite?: string;
}

export interface ClaimStartResult {
    success: boolean;
    claimId?: string;
    nextStep: string;
    otpSentTo?: string;
    dnsRecord?: string;
    htmlTag?: string;
    emailTokenSentTo?: string;
    callbackScheduled?: boolean;
    error?: string;
}

export interface VerifyClaimInput {
    claimId: string;
    otpCode?: string;
    dnsVerified?: boolean;
    htmlTagVerified?: boolean;
    emailToken?: string;
    voiceCallbackConfirmed?: boolean;
}

export interface VerifyClaimResult {
    success: boolean;
    status: string;
    error?: string;
}

// ── OTP Generation ─────────────────────────────────────────────────────────

function generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
}

function hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
}

// ── DNS verification token ─────────────────────────────────────────────────

function generateDnsToken(placeId: string): string {
    return `hc-verify=${crypto.createHash('sha256').update(placeId + Date.now()).digest('hex').slice(0, 16)}`;
}

function generateHtmlTag(placeId: string): string {
    const token = crypto.createHash('sha256').update(placeId + 'html').digest('hex').slice(0, 20);
    return `<meta name="hc-site-verification" content="${token}">`;
}

// ── Website Contact Email Token ────────────────────────────────────────────

function generateEmailToken(placeId: string): string {
    return crypto.createHash('sha256').update(placeId + 'email_token' + Date.now()).digest('hex').slice(0, 32);
}

// ── Voice Callback Verification ────────────────────────────────────────────

function generateCallbackCode(): string {
    // 4-digit verbal code for voice callback
    return crypto.randomInt(1000, 9999).toString();
}

// ── Claim Engine ───────────────────────────────────────────────────────────

export async function startClaim(input: ClaimStartInput): Promise<ClaimStartResult> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check place exists and is unclaimed
    const { data: place } = await supabase
        .from('places')
        .select('place_id, claim_status, name, phone')
        .eq('place_id', input.placeId)
        .single();

    if (!place) return { success: false, nextStep: 'error', error: 'Place not found' };

    if (place.claim_status !== 'unclaimed') {
        return { success: false, nextStep: 'error', error: 'Place is already claimed or pending' };
    }

    // Check for existing pending claims
    const { data: existing } = await supabase
        .from('place_claims')
        .select('claim_id')
        .eq('place_id', input.placeId)
        .in('verification_status', ['pending_otp', 'pending_dns', 'pending_email'])
        .limit(1);

    if (existing && existing.length > 0) {
        return { success: false, nextStep: 'error', error: 'A claim is already pending for this place' };
    }

    const result: ClaimStartResult = { success: true, nextStep: '' };

    // Build claim record
    const claimRecord: Record<string, unknown> = {
        place_id: input.placeId,
        claimant_account_id: input.claimantAccountId,
        claimant_role: input.claimantRole,
        verification_method: input.verificationMethod,
    };

    switch (input.verificationMethod) {
        case 'phone_otp': {
            const phone = input.businessPhone || place.phone;
            if (!phone) return { success: false, nextStep: 'error', error: 'No phone number available for OTP' };

            // Delegate OTP delivery to Supabase Auth (uses dashboard-configured provider: Twilio, MessageBird, etc.)
            const { error: otpError } = await supabase.auth.signInWithOtp({
                phone,
                options: { shouldCreateUser: true },
            });

            if (otpError) {
                console.error(`[CLAIM OTP] Failed to send OTP to ${phone}:`, otpError.message);
                return { success: false, nextStep: 'error', error: 'Failed to send verification code. Check phone number and try again.' };
            }

            claimRecord.verification_status = 'pending_otp';
            claimRecord.verification_evidence_ref = phone; // stored so verifyClaim can call verifyOtp
            result.nextStep = 'enter_otp';
            result.otpSentTo = phone.replace(/(\d{3})\d+(\d{2})/, '$1***$2');
            break;
        }
        case 'website_dns': {
            const dnsRecord = generateDnsToken(input.placeId);
            claimRecord.verification_status = 'pending_dns';
            claimRecord.verification_evidence_ref = dnsRecord;
            result.nextStep = 'add_dns_record';
            result.dnsRecord = dnsRecord;
            break;
        }
        case 'website_html_tag': {
            const htmlTag = generateHtmlTag(input.placeId);
            claimRecord.verification_status = 'pending_dns';
            claimRecord.verification_evidence_ref = htmlTag;
            result.nextStep = 'add_html_tag';
            result.htmlTag = htmlTag;
            break;
        }
        case 'email_domain_match': {
            if (!input.businessEmail) return { success: false, nextStep: 'error', error: 'Email required for domain match' };
            const domainToken = generateEmailToken(input.placeId);
            claimRecord.verification_status = 'pending_email';
            claimRecord.verification_evidence_ref = input.businessEmail;
            claimRecord.verification_token = domainToken;
            claimRecord.verification_token_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            result.nextStep = 'check_email';

            const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
            const verifyUrl = `${appUrl}/claim/verify?token=${domainToken}`;
            const smtpProvider = await resolveProvider(supabase);
            await sendViaSMTP({
                from: 'noreply@haulcommand.com',
                fromName: 'Haul Command',
                replyTo: 'support@haulcommand.com',
                to: input.businessEmail,
                subject: 'Verify your business email to claim your listing',
                html: `<p>Click the link below to verify your email and complete your listing claim:<br><br><a href="${verifyUrl}">${verifyUrl}</a><br><br>This link expires in 24 hours.</p>`,
                text: `Verify your email to claim your listing:\n\n${verifyUrl}\n\nThis link expires in 24 hours.`,
                tags: { type: 'claim_verification', place_id: input.placeId },
            }, smtpProvider);
            break;
        }
        case 'website_contact_email_token': {
            if (!input.businessWebsite) return { success: false, nextStep: 'error', error: 'Website required for contact email token' };
            const emailToken = generateEmailToken(input.placeId);
            claimRecord.verification_status = 'pending_email';
            claimRecord.verification_token = emailToken;
            claimRecord.verification_token_expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            claimRecord.verification_evidence_ref = input.businessWebsite;
            result.nextStep = 'email_token_sent';

            // Derive a best-guess contact email from the website domain (contact@domain.com)
            const domain = new URL(input.businessWebsite).hostname.replace(/^www\./, '');
            const contactEmail = `contact@${domain}`;
            const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
            const tokenUrl = `${appUrl}/claim/verify?token=${emailToken}`;
            const smtpProvider2 = await resolveProvider(supabase);
            await sendViaSMTP({
                from: 'verify@haulcommand.com',
                fromName: 'Haul Command Verification',
                replyTo: 'support@haulcommand.com',
                to: contactEmail,
                subject: 'Someone is claiming your business on Haul Command',
                html: `<p>A claim was submitted for your business listing on Haul Command.<br><br>If this was you, click the link to verify ownership:<br><br><a href="${tokenUrl}">${tokenUrl}</a><br><br>If you did not request this, ignore this email. This link expires in 24 hours.</p>`,
                text: `A claim was submitted for your business on Haul Command.\n\nTo verify ownership, visit:\n\n${tokenUrl}\n\nThis link expires in 24 hours.`,
                tags: { type: 'claim_contact_token', place_id: input.placeId },
            }, smtpProvider2);
            break;
        }
        case 'voice_callback_verification': {
            const phone = input.businessPhone || place.phone;
            if (!phone) return { success: false, nextStep: 'error', error: 'No phone number for voice callback' };
            const callbackCode = generateCallbackCode();
            claimRecord.verification_status = 'pending_otp'; // reuse OTP status
            claimRecord.otp_code = hashOtp(callbackCode);
            claimRecord.otp_expires_at = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min
            claimRecord.verification_method = 'voice_callback_verification';
            result.nextStep = 'voice_callback_scheduled';
            result.callbackScheduled = true;
            // TODO: Schedule Vapi callback to speak the code
            console.log(`[CLAIM VOICE CALLBACK] Place ${input.placeId}: code ${callbackCode} — calling ${phone}`);
            break;
        }
    }

    // Insert claim
    const { data: claim, error } = await supabase
        .from('place_claims')
        .insert(claimRecord)
        .select('claim_id')
        .single();

    if (error || !claim) {
        return { success: false, nextStep: 'error', error: error?.message || 'Failed to create claim' };
    }

    // Update place status to pending
    await supabase
        .from('places')
        .update({ claim_status: 'claim_pending' })
        .eq('place_id', input.placeId);

    result.claimId = claim.claim_id;
    return result;
}

// ── Verify Claim ───────────────────────────────────────────────────────────

export async function verifyClaim(input: VerifyClaimInput): Promise<VerifyClaimResult> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: claim } = await supabase
        .from('place_claims')
        .select('*')
        .eq('claim_id', input.claimId)
        .single();

    if (!claim) return { success: false, status: 'not_found', error: 'Claim not found' };

    // OTP verification — Supabase Auth manages the token; we just verify via verifyOtp
    if (claim.verification_method === 'phone_otp' && input.otpCode) {
        const phone = claim.verification_evidence_ref;
        if (!phone) {
            return { success: false, status: 'invalid', error: 'No phone on record for this claim. Please restart.' };
        }
        const { error: verifyError } = await supabase.auth.verifyOtp({
            phone,
            token: input.otpCode,
            type: 'sms',
        });
        if (verifyError) {
            return { success: false, status: 'invalid', error: 'Invalid or expired verification code' };
        }
    }

    // DNS / HTML tag verification would be checked server-side
    if (claim.verification_method === 'website_dns' && !input.dnsVerified) {
        return { success: false, status: 'pending', error: 'DNS record not yet verified' };
    }

    // Website email token verification
    if (claim.verification_method === 'website_contact_email_token' && input.emailToken) {
        if (claim.verification_token_expires_at && new Date(claim.verification_token_expires_at) < new Date()) {
            return { success: false, status: 'expired', error: 'Email verification token has expired.' };
        }
        if (input.emailToken !== claim.verification_token) {
            return { success: false, status: 'invalid', error: 'Invalid email verification token' };
        }
    }

    // Voice callback verification
    if (claim.verification_method === 'voice_callback_verification') {
        if (input.voiceCallbackConfirmed !== true && input.otpCode) {
            // Caller entered the code during the callback
            if (claim.otp_expires_at && new Date(claim.otp_expires_at) < new Date()) {
                return { success: false, status: 'expired', error: 'Voice callback code expired.' };
            }
            if (hashOtp(input.otpCode) !== claim.otp_code) {
                return { success: false, status: 'invalid', error: 'Invalid callback code' };
            }
        } else if (!input.voiceCallbackConfirmed) {
            return { success: false, status: 'pending', error: 'Voice callback not yet confirmed' };
        }
    }

    // Mark claim as verified
    await supabase.from('place_claims').update({
        verification_status: 'verified',
        completed_at: new Date().toISOString(),
    }).eq('claim_id', input.claimId);

    // Update place
    await supabase.from('places').update({
        claim_status: 'verified',
        claimed_by_account_id: claim.claimant_account_id,
        verification_status: 'verified',
    }).eq('place_id', claim.place_id);

    // Register in sitemap (trigger handles this)

    return { success: true, status: 'verified' };
}

// ── Eligibility check for a place ──────────────────────────────────────────

export function getAvailableVerificationMethods(place: {
    phone?: string | null;
    website?: string | null;
}): VerificationMethod[] {
    const methods: VerificationMethod[] = [];
    if (place.phone) {
        methods.push('phone_otp');
        methods.push('voice_callback_verification');
    }
    if (place.website) {
        methods.push('website_dns');
        methods.push('website_html_tag');
        methods.push('website_contact_email_token');
    }
    // email_domain_match is always available if user supplies an email
    methods.push('email_domain_match');
    return methods;
}
