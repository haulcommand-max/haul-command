/**
 * SMTP Provider Abstraction
 * 
 * Swappable SMTP relay: Brevo (default), Amazon SES SMTP, Resend SMTP.
 * Provider is read from `app_settings.email.provider` at runtime.
 * All sends go through the email_jobs queue → email-worker drains via this module.
 */

// ─── Types ───────────────────────────────────────────────────────
export type SmtpProvider = 'brevo_smtp' | 'amazon_ses_smtp' | 'resend_smtp';

export interface SmtpProfile {
    host: string;
    port: number;
    user: string;
    pass: string;
    tls: boolean;
}

export interface EmailEnvelope {
    from: string;
    fromName: string;
    replyTo: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
    tags?: Record<string, string>;
}

export interface SendResult {
    success: boolean;
    messageId?: string;
    error?: string;
    provider: SmtpProvider;
}

// ─── Provider Profiles ───────────────────────────────────────────
const SMTP_PROFILES: Record<SmtpProvider, () => SmtpProfile> = {
    brevo_smtp: () => ({
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        tls: true,
    }),
    amazon_ses_smtp: () => ({
        host: process.env.SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        tls: true,
    }),
    resend_smtp: () => ({
        host: process.env.SMTP_HOST || 'smtp.resend.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER || 'resend',
        pass: process.env.SMTP_PASS || '',
        tls: true,
    }),
};

/**
 * Get the SMTP profile for the current provider.
 */
export function getSmtpProfile(provider: SmtpProvider): SmtpProfile {
    const factory = SMTP_PROFILES[provider];
    if (!factory) throw new Error(`Unknown SMTP provider: ${provider}`);
    return factory();
}

/**
 * Send an email via SMTP using the Deno-native or Node-compatible approach.
 * 
 * In Supabase Edge Functions (Deno), we use a lightweight SMTP client.
 * In Next.js API routes, you can swap this for nodemailer.
 */
export async function sendViaSMTP(
    envelope: EmailEnvelope,
    provider: SmtpProvider
): Promise<SendResult> {
    const profile = getSmtpProfile(provider);

    // Build raw SMTP payload for the /api/email/smtp-relay endpoint
    // This endpoint wraps nodemailer for Node.js environments
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/email/smtp-relay`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.EMAIL_INTERNAL_SECRET || ''}`,
                },
                body: JSON.stringify({ envelope, smtp: profile }),
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            return { success: false, error: errText, provider };
        }

        const result = await response.json();
        return { success: true, messageId: result.messageId, provider };
    } catch (err: any) {
        return { success: false, error: err.message, provider };
    }
}

/**
 * Resolve the current SMTP provider from app_settings.
 * Falls back to 'brevo_smtp' if not set.
 */
export async function resolveProvider(supabase: any): Promise<SmtpProvider> {
    const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'email.provider')
        .single();

    return (data?.value as SmtpProvider) || 'brevo_smtp';
}

/**
 * Check if a specific email feature flag is enabled.
 */
export async function isFeatureEnabled(supabase: any, flag: string): Promise<boolean> {
    const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', flag)
        .single();

    return data?.value === 'true';
}

/**
 * Get a numeric setting from app_settings.
 */
export async function getNumericSetting(supabase: any, key: string, fallback: number): Promise<number> {
    const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .single();

    return data?.value ? parseInt(data.value, 10) : fallback;
}
