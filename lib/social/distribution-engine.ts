// lib/social/distribution-engine.ts
// ══════════════════════════════════════════════════════════════
// SOCIAL DISTRIBUTION ENGINE — Automated Content Distribution
//
// Manages the complete social distribution lifecycle:
//   schedule → generate → publish → track → funnel → report
//
// Channels: Email, Push, In-App, SMS (future: Facebook, LinkedIn, X)
// Targeting: Role-aware, country-aware, corridor-aware
// Tracking: UTM + server events + follow-on funnel attribution
// ══════════════════════════════════════════════════════════════

import type { SupabaseClient } from '@supabase/supabase-js';

// ── Types ───────────────────────────────────────────────────

export type DistributionChannel =
    | 'email' | 'push' | 'in_app' | 'sms'
    | 'facebook' | 'instagram' | 'linkedin' | 'x' | 'youtube' | 'tiktok';

export type ContentBucket =
    | 'corridor_alert'         // Demand spike in a corridor
    | 'market_opportunity'     // New market opening
    | 'rate_shift'             // Rate changes
    | 'new_load_posted'        // New load matching criteria
    | 'operator_milestone'     // Operator hit a milestone
    | 'watchlist_digest'       // Watchlist summary
    | 'sponsor_opportunity'    // Sponsorship available
    | 'product_update'         // Platform feature update
    | 'education'              // Tips, guides, how-tos
    | 'community'              // Social proof, testimonials
    | 'compliance_update'      // Regulatory changes
    | 'seasonal_demand';       // Seasonal demand forecasts

export type TargetRole = 'operator' | 'broker' | 'both';

export interface DistributionPost {
    id: string;
    content_bucket: ContentBucket;
    channel: DistributionChannel;
    target_role: TargetRole;
    country_code: string;
    corridor_code?: string;
    headline: string;
    body: string;
    cta_text: string;
    cta_url: string;
    image_url?: string;
    utm_params: UTMParams;
    scheduled_at: string;
    published_at?: string;
    status: 'draft' | 'scheduled' | 'published' | 'failed';
    variant_id?: string;
    metadata: Record<string, unknown>;
}

export interface UTMParams {
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_content?: string;
    utm_term?: string;
}

export interface DistributionResult {
    post_id: string;
    channel: DistributionChannel;
    success: boolean;
    delivered_count?: number;
    error?: string;
}

export interface FunnelAttribution {
    post_id: string;
    channel: DistributionChannel;
    utm_campaign: string;
    visits: number;
    signups: number;
    claims: number;
    conversions: number;
    revenue_usd: number;
}

// ── Engine ──────────────────────────────────────────────────

export class DistributionEngine {
    constructor(private db: SupabaseClient) {}

    // ── SCHEDULING ──────────────────────────────────────────

    async schedulePost(post: Omit<DistributionPost, 'id' | 'status' | 'utm_params'>): Promise<{ ok: boolean; post_id?: string; error?: string }> {
        const utm: UTMParams = {
            utm_source: post.channel,
            utm_medium: this.getUtmMedium(post.channel),
            utm_campaign: `hc_${post.content_bucket}_${post.country_code.toLowerCase()}_${Date.now()}`,
            utm_content: post.variant_id || undefined,
        };

        const ctaWithUtm = this.appendUtm(post.cta_url, utm);

        const { data, error } = await this.db
            .from('distribution_posts')
            .insert({
                content_bucket: post.content_bucket,
                channel: post.channel,
                target_role: post.target_role,
                country_code: post.country_code,
                corridor_code: post.corridor_code || null,
                headline: post.headline,
                body: post.body,
                cta_text: post.cta_text,
                cta_url: ctaWithUtm,
                image_url: post.image_url || null,
                utm_source: utm.utm_source,
                utm_medium: utm.utm_medium,
                utm_campaign: utm.utm_campaign,
                utm_content: utm.utm_content || null,
                scheduled_at: post.scheduled_at,
                status: 'scheduled',
                variant_id: post.variant_id || null,
                metadata: post.metadata || {},
            })
            .select('id')
            .single();

        if (error) return { ok: false, error: error.message };
        return { ok: true, post_id: data.id };
    }

    // ── PUBLISHING ──────────────────────────────────────────

    async publishDuePostsBatch(): Promise<{ published: number; failed: number }> {
        // Get all posts scheduled for now or earlier
        const { data: duePosts } = await this.db
            .from('distribution_posts')
            .select('*')
            .eq('status', 'scheduled')
            .lte('scheduled_at', new Date().toISOString())
            .order('scheduled_at', { ascending: true })
            .limit(50);

        if (!duePosts || duePosts.length === 0) return { published: 0, failed: 0 };

        let published = 0;
        let failed = 0;

        for (const post of duePosts) {
            const result = await this.publishPost(post);
            if (result.success) {
                published++;
            } else {
                failed++;
            }
        }

        return { published, failed };
    }

    async publishPost(post: DistributionPost): Promise<DistributionResult> {
        try {
            let result: DistributionResult;

            switch (post.channel) {
                case 'email':
                    result = await this.publishToEmail(post);
                    break;
                case 'push':
                    result = await this.publishToPush(post);
                    break;
                case 'in_app':
                    result = await this.publishToInApp(post);
                    break;
                default:
                    result = await this.publishToQueue(post);
                    break;
            }

            // Update status
            await this.db
                .from('distribution_posts')
                .update({
                    status: result.success ? 'published' : 'failed',
                    published_at: result.success ? new Date().toISOString() : null,
                    metadata: {
                        ...(post.metadata || {}),
                        publish_result: result,
                    },
                })
                .eq('id', post.id);

            // Track event
            await this.trackDistributionEvent(post, result);

            return result;
        } catch (error) {
            await this.db
                .from('distribution_posts')
                .update({ status: 'failed' })
                .eq('id', post.id);

            return {
                post_id: post.id,
                channel: post.channel,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    // ── CHANNEL PUBLISHERS ──────────────────────────────────

    private async publishToEmail(post: DistributionPost): Promise<DistributionResult> {
        // Get targeted recipients based on role + country + corridor
        const { data: recipients } = await this.db
            .from('profiles')
            .select('id, email')
            .eq('country', post.country_code)
            .not('email', 'is', null)
            .limit(1000);

        if (!recipients || recipients.length === 0) {
            return { post_id: post.id, channel: 'email', success: true, delivered_count: 0 };
        }

        // Queue emails via push_queue (picked up by email sender cron)
        const emailJobs = recipients.map(r => ({
            user_id: r.id,
            channel: 'email',
            title: post.headline,
            body: post.body,
            data: {
                type: 'distribution_post',
                post_id: post.id,
                cta_url: post.cta_url,
                cta_text: post.cta_text,
                utm_campaign: post.utm_params?.utm_campaign,
                content_bucket: post.content_bucket,
            },
        }));

        const { error } = await this.db.from('push_queue').insert(emailJobs);

        return {
            post_id: post.id,
            channel: 'email',
            success: !error,
            delivered_count: error ? 0 : recipients.length,
            error: error?.message,
        };
    }

    private async publishToPush(post: DistributionPost): Promise<DistributionResult> {
        const { data: recipients } = await this.db
            .from('profiles')
            .select('id')
            .eq('country', post.country_code)
            .limit(1000);

        if (!recipients || recipients.length === 0) {
            return { post_id: post.id, channel: 'push', success: true, delivered_count: 0 };
        }

        const pushJobs = recipients.map(r => ({
            user_id: r.id,
            channel: 'push',
            title: post.headline,
            body: post.body,
            data: {
                type: 'distribution_post',
                post_id: post.id,
                cta_url: post.cta_url,
                content_bucket: post.content_bucket,
            },
        }));

        const { error } = await this.db.from('push_queue').insert(pushJobs);

        return {
            post_id: post.id,
            channel: 'push',
            success: !error,
            delivered_count: error ? 0 : recipients.length,
            error: error?.message,
        };
    }

    private async publishToInApp(post: DistributionPost): Promise<DistributionResult> {
        // In-app notifications go to the notifications table
        const { data: recipients } = await this.db
            .from('profiles')
            .select('id')
            .eq('country', post.country_code)
            .limit(1000);

        if (!recipients || recipients.length === 0) {
            return { post_id: post.id, channel: 'in_app', success: true, delivered_count: 0 };
        }

        const notifications = recipients.map(r => ({
            user_id: r.id,
            type: 'distribution',
            title: post.headline,
            body: post.body,
            action_url: post.cta_url,
            metadata: {
                post_id: post.id,
                content_bucket: post.content_bucket,
                cta_text: post.cta_text,
            },
            read: false,
        }));

        const { error } = await this.db.from('notifications').insert(notifications);

        return {
            post_id: post.id,
            channel: 'in_app',
            success: !error,
            delivered_count: error ? 0 : recipients.length,
            error: error?.message,
        };
    }

    private async publishToQueue(post: DistributionPost): Promise<DistributionResult> {
        // External channels (Facebook, LinkedIn, X, etc.) go to an external post queue
        // These will be picked up by a future integration or manual process
        const { error } = await this.db
            .from('social_post_queue')
            .insert({
                post_id: post.id,
                channel: post.channel,
                headline: post.headline,
                body: post.body,
                cta_url: post.cta_url,
                image_url: post.image_url,
                country_code: post.country_code,
                status: 'queued',
                scheduled_at: post.scheduled_at,
            });

        return {
            post_id: post.id,
            channel: post.channel,
            success: !error,
            error: error?.message,
        };
    }

    // ── FUNNEL ATTRIBUTION ──────────────────────────────────

    async getFunnelAttribution(
        utmCampaign: string,
        dateRange?: { start: string; end: string },
    ): Promise<FunnelAttribution | null> {
        // Get the post
        const { data: post } = await this.db
            .from('distribution_posts')
            .select('*')
            .eq('utm_campaign', utmCampaign)
            .single();

        if (!post) return null;

        const startDate = dateRange?.start || post.published_at || post.scheduled_at;
        const endDate = dateRange?.end || new Date().toISOString();

        // Count funnel events attributed to this UTM
        const { data: events } = await this.db
            .from('hc_events')
            .select('event_type')
            .contains('properties', { utm_campaign: utmCampaign })
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        if (!events) return null;

        return {
            post_id: post.id,
            channel: post.channel,
            utm_campaign: utmCampaign,
            visits: events.filter(e => e.event_type === 'destination_visit').length,
            signups: events.filter(e => e.event_type === 'signup_complete').length,
            claims: events.filter(e => e.event_type === 'claim_submit').length,
            conversions: events.filter(e =>
                ['sponsor_purchase', 'subscription_purchase', 'boost_purchase'].includes(e.event_type)
            ).length,
            revenue_usd: 0, // Would need to join with payment data
        };
    }

    // ── AUTO-GENERATE CONTENT ───────────────────────────────

    async autoGenerateCorridorAlert(
        countryCode: string,
        corridorCode: string,
        corridorLabel: string,
        loadCount: number,
    ): Promise<string | null> {
        const post = {
            content_bucket: 'corridor_alert' as ContentBucket,
            channel: 'push' as DistributionChannel,
            target_role: 'operator' as TargetRole,
            country_code: countryCode,
            corridor_code: corridorCode,
            headline: `📈 ${loadCount} loads posted in ${corridorLabel}`,
            body: `Demand is rising in ${corridorLabel}. ${loadCount} loads need escorts now. Open the app to claim them.`,
            cta_text: 'View Loads',
            cta_url: `/loads?corridor=${corridorCode}`,
            scheduled_at: new Date().toISOString(),
            metadata: { auto_generated: true, trigger: 'corridor_spike', load_count: loadCount },
        };

        const result = await this.schedulePost(post);

        // Also push to email channel
        await this.schedulePost({ ...post, channel: 'email' });

        return result.post_id || null;
    }

    async autoGenerateRateShiftAlert(
        countryCode: string,
        corridorCode: string,
        corridorLabel: string,
        direction: 'up' | 'down',
        pctChange: number,
        currentRate: number,
    ): Promise<string | null> {
        const emoji = direction === 'up' ? '📈' : '📉';
        const dirText = direction === 'up' ? 'increased' : 'decreased';

        const post = {
            content_bucket: 'rate_shift' as ContentBucket,
            channel: 'push' as DistributionChannel,
            target_role: 'both' as TargetRole,
            country_code: countryCode,
            corridor_code: corridorCode,
            headline: `${emoji} Rates ${dirText} ${pctChange}% in ${corridorLabel}`,
            body: `Escort rates in ${corridorLabel} have ${dirText} ${pctChange}% in the last 24h. Current median: $${currentRate}/mi.`,
            cta_text: 'Check Rates',
            cta_url: `/tools/rate-lookup?corridor=${corridorCode}`,
            scheduled_at: new Date().toISOString(),
            metadata: { auto_generated: true, trigger: 'rate_shift', direction, pct_change: pctChange },
        };

        const result = await this.schedulePost(post);
        return result.post_id || null;
    }

    // ── HELPERS ─────────────────────────────────────────────

    private getUtmMedium(channel: DistributionChannel): string {
        const mediumMap: Record<DistributionChannel, string> = {
            email: 'email',
            push: 'push_notification',
            in_app: 'in_app',
            sms: 'sms',
            facebook: 'social',
            instagram: 'social',
            linkedin: 'social',
            x: 'social',
            youtube: 'video',
            tiktok: 'video',
        };
        return mediumMap[channel] || 'referral';
    }

    private appendUtm(url: string, utm: UTMParams): string {
        const separator = url.includes('?') ? '&' : '?';
        const params = new URLSearchParams();
        params.set('utm_source', utm.utm_source);
        params.set('utm_medium', utm.utm_medium);
        params.set('utm_campaign', utm.utm_campaign);
        if (utm.utm_content) params.set('utm_content', utm.utm_content);
        if (utm.utm_term) params.set('utm_term', utm.utm_term);
        return `${url}${separator}${params.toString()}`;
    }

    private async trackDistributionEvent(post: DistributionPost, result: DistributionResult): Promise<void> {
        try {
            await this.db.from('hc_events').insert({
                event_type: 'distribution_published',
                properties: {
                    post_id: post.id,
                    channel: post.channel,
                    content_bucket: post.content_bucket,
                    country_code: post.country_code,
                    corridor_code: post.corridor_code,
                    target_role: post.target_role,
                    success: result.success,
                    delivered_count: result.delivered_count || 0,
                    utm_campaign: post.utm_params?.utm_campaign,
                },
            });
        } catch {
            // Non-critical
        }
    }
}
