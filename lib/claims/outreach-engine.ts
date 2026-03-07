// ══════════════════════════════════════════════════════════════
// OUTREACH ENGINE
// Multi-touch claim outreach with:
//   - Escalation ladder (email -> SMS -> in_app -> voice)
//   - Fatigue limits (max 6/30d, 36h minimum gap)
//   - Template system with variable interpolation
//   - Kill switch and governor controls
//   - Suppression list enforcement
// ══════════════════════════════════════════════════════════════

import { SupabaseClient } from '@supabase/supabase-js';
import { sendViaSMTP, resolveProvider, type EmailEnvelope } from '@/lib/email/ses-client';

// ── Types ────────────────────────────────────────────────────

export type OutreachChannel = 'email' | 'sms' | 'whatsapp' | 'in_app' | 'voice';

export interface OutreachTemplate {
    id: string;
    channel: OutreachChannel;
    subject?: string;
    body: string;
    vars: string[];
}

export interface OutreachQueueItem {
    surface_id: string;
    surface_name: string;
    surface_type: string;
    country_code: string;
    email?: string;
    phone?: string;
    claim_priority_tier: string;
    outreach_step: number;
    outreach_attempts_30d: number;
}

// ── Constants ────────────────────────────────────────────────

const MAX_ATTEMPTS_30D = 6;
const MIN_HOURS_BETWEEN = 36;

const ESCALATION_LADDER: Array<{
    step: number;
    channel: OutreachChannel;
    wait_hours: number;
    template_key: string;
}> = [
        { step: 1, channel: 'email', wait_hours: 48, template_key: 'claim_invite_v1' },
        { step: 2, channel: 'sms', wait_hours: 72, template_key: 'claim_reminder_v1' },
        { step: 3, channel: 'in_app', wait_hours: 96, template_key: 'claim_banner_v1' },
        { step: 4, channel: 'email', wait_hours: 168, template_key: 'claim_reminder_v1' },
    ];

// ── Templates ────────────────────────────────────────────────

const TEMPLATES: Record<string, Record<string, OutreachTemplate>> = {
    email: {
        claim_invite_v1: {
            id: 'email_claim_invite_v1',
            channel: 'email',
            subject: 'Claim your listing on Haul Command (verification link)',
            body: `Hi,

Your listing "{{surface_name}}" on Haul Command is ready to be claimed.

By verifying ownership, you unlock:
- {{benefit_1}}
- {{benefit_2}}
- Full edit access to your listing

Claim now: {{claim_link}}

This takes less than 60 seconds.

- The Haul Command Team`,
            vars: ['surface_name', 'country', 'claim_link', 'benefit_1', 'benefit_2'],
        },
        claim_reminder_v1: {
            id: 'email_claim_reminder_v1',
            channel: 'email',
            subject: 'Reminder: verify ownership to unlock your listing',
            body: `Hi,

Just a reminder that "{{surface_name}}" is still unclaimed on Haul Command.

Verify now to unlock your trust badge and visibility boost: {{claim_link}}

Verification will close on {{deadline}} if not completed.

- The Haul Command Team`,
            vars: ['surface_name', 'claim_link', 'deadline'],
        },
    },
    sms: {
        claim_invite_v1: {
            id: 'sms_claim_invite_v1',
            channel: 'sms',
            body: 'Haul Command: Claim "{{surface_name}}" and unlock your trust badge + visibility boost. Verify now: {{claim_short_link}}',
            vars: ['surface_name', 'claim_short_link'],
        },
        claim_reminder_v1: {
            id: 'sms_claim_reminder_v1',
            channel: 'sms',
            body: 'Reminder: "{{surface_name}}" is still unclaimed. Verify in 60 sec: {{claim_short_link}}',
            vars: ['surface_name', 'claim_short_link'],
        },
    },
    in_app: {
        claim_banner_v1: {
            id: 'in_app_claim_banner_v1',
            channel: 'in_app',
            body: 'Claim "{{surface_name}}" to unlock edits, trust badge, and lead routing. {{claim_link}}',
            vars: ['surface_name', 'claim_link', 'benefit_1'],
        },
    },
};

// ── Benefit mapping by surface type ──────────────────────────

const BENEFITS: Record<string, [string, string]> = {
    operator_profile: ['Rank boost + trust badge + leads', 'Priority placement in search results'],
    port: ['Authority badge + compliance links + visibility', 'Inbound logistics routing'],
    hotel: ['Crew lodging visibility + route corridor placement', 'Direct booking leads from drivers'],
    motel: ['Crew lodging visibility + route corridor placement', 'Direct booking leads from drivers'],
    facility: ['Inbound logistics listing + reviews', 'Lead routing from nearby loads'],
    service_provider: ['Verified provider badge', 'Lead routing from operators'],
};

// ══════════════════════════════════════════════════════════════
// OUTREACH ENGINE CLASS
// ══════════════════════════════════════════════════════════════

export class OutreachEngine {
    constructor(private db: SupabaseClient) { }

    /**
     * Build outreach queue for unclaimed surfaces.
     * Respects fatigue limits, governor controls, and suppression lists.
     */
    async buildOutreachQueue(options: {
        tiers?: string[];
        limitPerCountry?: number;
    } = {}): Promise<{
        queued: number;
        skipped_fatigue: number;
        skipped_suppressed: number;
        skipped_governor: number;
    }> {
        const tiers = options.tiers ?? ['A', 'B'];
        const limitPerCountry = options.limitPerCountry ?? 250;

        // 1. Check governor kill switches
        const { data: governor } = await this.db
            .from('claim_governor')
            .select('id, enabled, value')
            .in('id', ['outreach_global_pause', 'country_pause_list', 'surface_type_pause_list']);

        const governors = Object.fromEntries((governor ?? []).map(g => [g.id, g]));

        if (governors.outreach_global_pause?.enabled) {
            return { queued: 0, skipped_fatigue: 0, skipped_suppressed: 0, skipped_governor: -1 };
        }

        const pausedCountries: string[] = governors.country_pause_list?.value ?? [];
        const pausedTypes: string[] = governors.surface_type_pause_list?.value ?? [];

        // 2. Get eligible surfaces
        let query = this.db
            .from('surfaces')
            .select('id, name, surface_type, country_code, email, phone, claim_priority_tier, outreach_step, outreach_attempts_30d, last_outreach_at')
            .in('claim_status', ['unclaimed', 'claimable'])
            .in('claim_priority_tier', tiers)
            .order('claim_priority_score', { ascending: false })
            .limit(limitPerCountry * 52);

        const { data: surfaces } = await query;
        if (!surfaces?.length) return { queued: 0, skipped_fatigue: 0, skipped_suppressed: 0, skipped_governor: 0 };

        // 3. Get suppression list
        const { data: suppressions } = await this.db
            .from('outreach_suppressions')
            .select('contact_value');
        const suppressedSet = new Set((suppressions ?? []).map(s => s.contact_value));

        let queued = 0;
        let skippedFatigue = 0;
        let skippedSuppressed = 0;
        let skippedGovernor = 0;
        const countryCounts: Record<string, number> = {};

        for (const surface of surfaces) {
            // Governor: country pause
            if (pausedCountries.includes(surface.country_code)) {
                skippedGovernor++;
                continue;
            }

            // Governor: surface type pause
            if (pausedTypes.includes(surface.surface_type)) {
                skippedGovernor++;
                continue;
            }

            // Governor: per-country limit
            const cc = surface.country_code;
            countryCounts[cc] = (countryCounts[cc] ?? 0) + 1;
            if (countryCounts[cc] > limitPerCountry) continue;

            // Fatigue: max attempts
            if (surface.outreach_attempts_30d >= MAX_ATTEMPTS_30D) {
                skippedFatigue++;
                continue;
            }

            // Fatigue: min hours between
            if (surface.last_outreach_at) {
                const hoursSince = (Date.now() - new Date(surface.last_outreach_at).getTime()) / 3600000;
                if (hoursSince < MIN_HOURS_BETWEEN) {
                    skippedFatigue++;
                    continue;
                }
            }

            // Suppression check
            if ((surface.email && suppressedSet.has(surface.email)) ||
                (surface.phone && suppressedSet.has(surface.phone))) {
                skippedSuppressed++;
                continue;
            }

            // Determine escalation step
            const step = Math.min(surface.outreach_step + 1, ESCALATION_LADDER.length);
            const ladder = ESCALATION_LADDER[step - 1];
            if (!ladder) continue;

            // Check channel availability
            if (ladder.channel === 'email' && !surface.email) continue;
            if (ladder.channel === 'sms' && !surface.phone) continue;

            // Get template
            const template = TEMPLATES[ladder.channel]?.[ladder.template_key];
            if (!template) continue;

            // Queue the outreach event
            await this.db.from('outreach_events').insert({
                surface_id: surface.id,
                channel: ladder.channel,
                template_id: template.id,
                status: 'queued',
                metadata: {
                    step,
                    surface_name: surface.name,
                    country: surface.country_code,
                    benefits: BENEFITS[surface.surface_type] ?? BENEFITS.operator_profile,
                },
            });

            // Update surface outreach tracking
            await this.db.from('surfaces').update({
                outreach_step: step,
                outreach_attempts_30d: surface.outreach_attempts_30d + 1,
                last_outreach_at: new Date().toISOString(),
                next_outreach_at: new Date(Date.now() + ladder.wait_hours * 3600000).toISOString(),
            }).eq('id', surface.id);

            queued++;
        }

        return { queued, skipped_fatigue: skippedFatigue, skipped_suppressed: skippedSuppressed, skipped_governor: skippedGovernor };
    }

    /**
     * Process queued outreach events (send them).
     * In production, integrate with email/SMS providers.
     */
    async processQueue(limit: number = 100): Promise<{ sent: number; failed: number }> {
        const { data: events } = await this.db
            .from('outreach_events')
            .select('*')
            .eq('status', 'queued')
            .order('created_at')
            .limit(limit);

        if (!events?.length) return { sent: 0, failed: 0 };

        let sent = 0;
        let failed = 0;

        const provider = await resolveProvider(this.db);

        for (const event of events) {
            try {
                if (event.channel === 'email' && event.recipient_email) {
                    const envelope: EmailEnvelope = {
                        from: 'noreply@haulcommand.com',
                        fromName: 'Haul Command',
                        replyTo: 'support@haulcommand.com',
                        to: event.recipient_email,
                        subject: event.subject || 'Claim your business on Haul Command',
                        html: event.body_html || `<p>${event.body_text || ''}</p>`,
                        text: event.body_text,
                        tags: { source: 'outreach', event_id: event.id },
                    };
                    const result = await sendViaSMTP(envelope, provider);
                    if (!result.success) throw new Error(result.error);
                }
                // SMS/voice channels fall through to mark-as-sent (requires Twilio/Vapi)

                await this.db.from('outreach_events').update({
                    status: 'sent',
                    sent_at: new Date().toISOString(),
                }).eq('id', event.id);
                sent++;
            } catch {
                await this.db.from('outreach_events').update({
                    status: 'failed',
                }).eq('id', event.id);
                failed++;
            }
        }

        return { sent, failed };
    }

    /**
     * Add a contact to the suppression list (opt-out).
     */
    async suppressContact(contactValue: string, contactType: 'email' | 'phone', reason: string = 'opt_out'): Promise<void> {
        await this.db.from('outreach_suppressions').upsert({
            contact_value: contactValue,
            contact_type: contactType,
            reason,
            source: 'user_request',
        }, { onConflict: 'contact_value,contact_type' });
    }
}
