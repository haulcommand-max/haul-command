/**
 * Profile Completion Engine — Tier 3
 *
 * Drives claimed operators to 100% through behavioral psychology:
 *
 * SCORING:
 *   identity (20): display_name, phone, email, home_base_city, home_base_state
 *   coverage (25): coverage_states, preferred_corridors, radius_miles
 *   equipment (20): vehicle_type, certifications, pilot_car_level
 *   availability (15): status, hours
 *   trust (10): photo, insurance_proof, id_verification
 *   performance (10): response_time, completed_jobs, broker_feedback
 *
 * GATES:
 *   - Missing display_name or phone → capped at 35
 *   - Missing coverage_states → capped at 55
 *
 * MILESTONES (with visibility boosts):
 *   20% → "nice — you're live. keep going."
 *   40% → 24h search rank boost (small)
 *   60% → 48h search rank boost (medium) + leaderboard eligibility
 *   80% → 7-day featured operator eligibility
 *   100% → "perfect. you're fully optimized."
 *
 * VISIBILITY SCORE:
 *   Composite of: profile_completion (40%), availability (25%),
 *   last_active recency (15%), response_time (10%), verified (10%)
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ProfileField {
    key: string;
    label: string;
    section: ProfileSection;
    present: boolean;
    visibility_gain: number;
}

export type ProfileSection = 'identity' | 'coverage' | 'equipment' | 'availability' | 'trust' | 'performance';

export interface CompletionScore {
    total: number;                    // 0–100, after gate caps
    raw_total: number;                // 0–100, before gate caps
    sections: Record<ProfileSection, { score: number; max: number; fields: ProfileField[] }>;
    gates_applied: string[];
    milestone_reached: number | null; // new milestone hit on this computation
    milestones_passed: number[];      // all milestones passed
    visibility_level: 'high' | 'medium' | 'low' | 'hidden';
    next_best_step: { field: string; label: string; visibility_gain: number; section: string } | null;
    peer_avg: number | null;
}

export interface VisibilityScore {
    total: number;                     // 0–100
    level: 'high' | 'medium' | 'low' | 'hidden';
    components: {
        profile_completion: number;
        availability: number;
        recency: number;
        response_speed: number;
        verified: number;
    };
    search_rank_multiplier: number;
}

export type BadgeId = 'founding_operator' | 'verified_operator' | 'fast_responder' | 'complete_profile' | 'rising_momentum';

export interface Badge {
    id: BadgeId;
    label: string;
    emoji: string;
    earned: boolean;
    earned_at?: string;
}

export interface NudgePayload {
    type: 'missed_opportunity' | 'broker_viewed' | 'leaderboard_gate' | 'daily_digest' | 'app_download';
    title: string;
    body: string;
    cta_label: string;
    cta_action: string;
    priority: 'high' | 'medium' | 'low';
}

export interface MilestoneToast {
    milestone: number;
    message: string;
    boost_granted: string | null;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const SECTION_WEIGHTS: Record<ProfileSection, number> = {
    identity: 20,
    coverage: 25,
    equipment: 20,
    availability: 15,
    trust: 10,
    performance: 10,
};

const FIELD_DEFS: { key: string; label: string; section: ProfileSection; visibility_gain: number }[] = [
    // Identity (20)
    { key: 'display_name', label: 'Display Name', section: 'identity', visibility_gain: 5 },
    { key: 'phone', label: 'Phone Number', section: 'identity', visibility_gain: 5 },
    { key: 'email', label: 'Email Address', section: 'identity', visibility_gain: 4 },
    { key: 'home_base_city', label: 'Home Base City', section: 'identity', visibility_gain: 3 },
    { key: 'home_base_state', label: 'Home Base State', section: 'identity', visibility_gain: 3 },
    // Coverage (25)
    { key: 'coverage_states', label: 'Coverage States', section: 'coverage', visibility_gain: 12 },
    { key: 'preferred_corridors', label: 'Preferred Corridors', section: 'coverage', visibility_gain: 8 },
    { key: 'radius_miles', label: 'Service Radius', section: 'coverage', visibility_gain: 5 },
    // Equipment (20)
    { key: 'vehicle_type', label: 'Vehicle Type', section: 'equipment', visibility_gain: 8 },
    { key: 'certifications', label: 'Certifications', section: 'equipment', visibility_gain: 7 },
    { key: 'pilot_car_level', label: 'Pilot Car Level', section: 'equipment', visibility_gain: 5 },
    // Availability (15)
    { key: 'availability_status', label: 'Availability Status', section: 'availability', visibility_gain: 8 },
    { key: 'operating_hours', label: 'Operating Hours', section: 'availability', visibility_gain: 7 },
    // Trust (10)
    { key: 'photo', label: 'Photo / Logo', section: 'trust', visibility_gain: 6 },
    { key: 'insurance_proof', label: 'Insurance Proof', section: 'trust', visibility_gain: 2 },
    { key: 'id_verification', label: 'ID Verification', section: 'trust', visibility_gain: 2 },
    // Performance (10) — auto-populated, not user-editable
    { key: 'response_time', label: 'Response Time', section: 'performance', visibility_gain: 4 },
    { key: 'completed_jobs', label: 'Completed Jobs', section: 'performance', visibility_gain: 3 },
    { key: 'broker_feedback', label: 'Broker Feedback', section: 'performance', visibility_gain: 3 },
];

const MILESTONES = [20, 40, 60, 80, 100];

const MILESTONE_TOASTS: Record<number, MilestoneToast> = {
    20: { milestone: 20, message: "nice — you're live. keep going.", boost_granted: null },
    40: { milestone: 40, message: 'good. you just unlocked a small visibility boost (24h).', boost_granted: 'search_rank_boost_24h' },
    60: { milestone: 60, message: "you're now eligible for full leaderboard ranking.", boost_granted: 'search_rank_boost_48h' },
    80: { milestone: 80, message: 'strong profile. brokers trust this.', boost_granted: 'featured_eligibility_7d' },
    100: { milestone: 100, message: "perfect. you're fully optimized.", boost_granted: 'featured_eligibility_30d' },
};

const LEADERBOARD_GATE = 60;

// ── Engine ─────────────────────────────────────────────────────────────────────

export class ProfileCompletionEngine {
    constructor(private supabase: SupabaseClient) { }

    // ─────────────────────────────────────────────────────────────────
    // COMPUTE COMPLETION SCORE
    // ─────────────────────────────────────────────────────────────────

    async computeCompletionScore(userId: string): Promise<CompletionScore> {
        // Fetch all data in parallel
        const [profileRes, driverRes, docsRes, certsRes, offersRes, reviewsRes, prevMilestones] = await Promise.all([
            this.supabase.from('profiles').select('*').eq('id', userId).single(),
            this.supabase.from('driver_profiles').select('*').eq('user_id', userId).single(),
            this.supabase.from('documents').select('id, document_type').eq('owner_id', userId),
            this.supabase.from('certifications').select('id').eq('user_id', userId),
            this.supabase.from('offers').select('id').eq('driver_id', userId).eq('status', 'accepted').limit(1),
            this.supabase.from('reviews').select('id').eq('reviewee_id', userId).limit(1),
            this.getPreviousMilestones(userId),
        ]);

        const profile = profileRes.data;
        const driver = driverRes.data;
        const docs = docsRes.data ?? [];
        const certs = certsRes.data ?? [];

        // Build field presence map
        const presence: Record<string, boolean> = {
            display_name: !!(profile?.display_name && profile.display_name.trim().length > 2),
            phone: !!(profile?.phone || profile?.phone_verified),
            email: !!(profile?.email),
            home_base_city: !!(driver?.home_base_city || profile?.city),
            home_base_state: !!(driver?.home_state || profile?.home_state),
            coverage_states: !!(driver?.coverage_states && driver.coverage_states.length > 0),
            preferred_corridors: !!(driver?.preferred_corridors && driver.preferred_corridors.length > 0),
            radius_miles: !!(driver?.service_radius_miles && driver.service_radius_miles > 0),
            vehicle_type: !!(driver?.vehicle_type || (driver?.equipment_tags && driver.equipment_tags.length > 0)),
            certifications: !!(certs.length > 0),
            pilot_car_level: !!(driver?.pilot_car_level),
            availability_status: !!(driver?.availability_status && driver.availability_status !== 'unknown'),
            operating_hours: !!(driver?.operating_hours),
            photo: !!(profile?.avatar_url),
            insurance_proof: !!(docs.find((d: any) => d.document_type === 'insurance')),
            id_verification: !!(profile?.id_verified || profile?.phone_verified),
            response_time: !!(offersRes.data && offersRes.data.length > 0), // has responded to at least one offer
            completed_jobs: !!(offersRes.data && offersRes.data.length > 0),
            broker_feedback: !!(reviewsRes.data && reviewsRes.data.length > 0),
        };

        // Build section scores
        const sections: Record<ProfileSection, { score: number; max: number; fields: ProfileField[] }> = {
            identity: { score: 0, max: SECTION_WEIGHTS.identity, fields: [] },
            coverage: { score: 0, max: SECTION_WEIGHTS.coverage, fields: [] },
            equipment: { score: 0, max: SECTION_WEIGHTS.equipment, fields: [] },
            availability: { score: 0, max: SECTION_WEIGHTS.availability, fields: [] },
            trust: { score: 0, max: SECTION_WEIGHTS.trust, fields: [] },
            performance: { score: 0, max: SECTION_WEIGHTS.performance, fields: [] },
        };

        for (const def of FIELD_DEFS) {
            const isPresent = presence[def.key] ?? false;
            const field: ProfileField = { ...def, present: isPresent };
            sections[def.section].fields.push(field);
        }

        // Score each section proportionally
        for (const section of Object.keys(sections) as ProfileSection[]) {
            const s = sections[section];
            const totalFields = s.fields.length;
            const completedFields = s.fields.filter(f => f.present).length;
            s.score = totalFields > 0 ? Math.round((completedFields / totalFields) * s.max) : 0;
        }

        let rawTotal = Object.values(sections).reduce((sum, s) => sum + s.score, 0);

        // Apply gates
        const gatesApplied: string[] = [];
        let cappedTotal = rawTotal;

        if (!presence.display_name || !presence.phone) {
            cappedTotal = Math.min(cappedTotal, 35);
            gatesApplied.push('min_identity_gate');
        }
        if (!presence.coverage_states) {
            cappedTotal = Math.min(cappedTotal, 55);
            gatesApplied.push('coverage_gate');
        }

        // Milestones
        const milestonesPassed = MILESTONES.filter(m => cappedTotal >= m);
        const newMilestone = milestonesPassed.find(m => !prevMilestones.includes(m)) ?? null;

        // Next best step: highest visibility_gain among incomplete fields (excluding performance)
        const incompleteFillable = FIELD_DEFS
            .filter(f => !presence[f.key] && f.section !== 'performance')
            .sort((a, b) => b.visibility_gain - a.visibility_gain);

        const nextStep = incompleteFillable.length > 0
            ? { field: incompleteFillable[0].key, label: incompleteFillable[0].label, visibility_gain: incompleteFillable[0].visibility_gain, section: incompleteFillable[0].section }
            : null;

        // Visibility level
        const visLevel: CompletionScore['visibility_level'] =
            cappedTotal >= 80 ? 'high' : cappedTotal >= 50 ? 'medium' : cappedTotal >= 25 ? 'low' : 'hidden';

        // Peer avg (approximate from state)
        const state = profile?.home_state ?? driver?.home_state;
        let peerAvg: number | null = null;
        if (state) {
            const { data: peers } = await this.supabase
                .from('operator_momentum')
                .select('score')
                .limit(50);
            if (peers && peers.length > 0) {
                peerAvg = Math.round(peers.reduce((s: number, p: any) => s + (p.score ?? 50), 0) / peers.length);
            }
        }

        // Persist score
        await this.supabase.from('operator_momentum').upsert({
            user_id: userId,
            score: cappedTotal,
            band: cappedTotal >= 75 ? 'rising' : cappedTotal >= 50 ? 'steady' : cappedTotal >= 25 ? 'cooling' : 'inactive',
            components: {
                identity: sections.identity.score,
                coverage: sections.coverage.score,
                equipment: sections.equipment.score,
                availability: sections.availability.score,
                trust: sections.trust.score,
                performance: sections.performance.score,
            },
            visibility_multiplier: cappedTotal >= 80 ? 1.5 : cappedTotal >= 60 ? 1.2 : cappedTotal >= 40 ? 1.0 : 0.5,
            computed_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        // If new milestone, grant boost
        if (newMilestone) {
            await this.grantMilestoneBoost(userId, newMilestone);
            await this.saveMilestone(userId, newMilestone);
        }

        return {
            total: cappedTotal,
            raw_total: rawTotal,
            sections,
            gates_applied: gatesApplied,
            milestone_reached: newMilestone,
            milestones_passed: milestonesPassed,
            visibility_level: visLevel,
            next_best_step: nextStep,
            peer_avg: peerAvg,
        };
    }

    // ─────────────────────────────────────────────────────────────────
    // VISIBILITY SCORE
    // ─────────────────────────────────────────────────────────────────

    async computeVisibilityScore(userId: string): Promise<VisibilityScore> {
        const [completionRes, driverRes, profileRes, offersRes] = await Promise.all([
            this.computeCompletionScore(userId),
            this.supabase.from('driver_profiles').select('availability_status, last_active_at').eq('user_id', userId).single(),
            this.supabase.from('profiles').select('id_verified, phone_verified').eq('id', userId).single(),
            this.supabase.from('offers').select('sent_at, responded_at').eq('driver_id', userId)
                .not('responded_at', 'is', null).order('created_at', { ascending: false }).limit(10),
        ]);

        const driver = driverRes.data;
        const profile = profileRes.data;

        // Profile completion (40% of visibility)
        const profileComp = completionRes.total;

        // Availability (25%)
        const isAvailable = driver?.availability_status === 'available';
        const availScore = isAvailable ? 100 : driver?.availability_status === 'busy' ? 50 : 0;

        // Recency (15%)
        const lastActive = driver?.last_active_at ? new Date(driver.last_active_at) : null;
        const hoursSince = lastActive ? (Date.now() - lastActive.getTime()) / 3600000 : 999;
        const recencyScore = hoursSince < 1 ? 100 : hoursSince < 6 ? 80 : hoursSince < 24 ? 60 : hoursSince < 72 ? 30 : 0;

        // Response speed (10%)
        const responses = (offersRes.data ?? []) as any[];
        let responseScore = 50; // default
        if (responses.length > 0) {
            const times = responses.map((o: any) => (new Date(o.responded_at).getTime() - new Date(o.sent_at).getTime()) / 60000);
            const median = times.sort((a: number, b: number) => a - b)[Math.floor(times.length / 2)];
            responseScore = median <= 5 ? 100 : median <= 15 ? 80 : median <= 30 ? 60 : median <= 60 ? 40 : 20;
        }

        // Verified (10%)
        const verifiedScore = (profile?.id_verified ? 50 : 0) + (profile?.phone_verified ? 50 : 0);

        const total = Math.round(
            profileComp * 0.40 +
            availScore * 0.25 +
            recencyScore * 0.15 +
            responseScore * 0.10 +
            verifiedScore * 0.10
        );

        const level: VisibilityScore['level'] = total >= 75 ? 'high' : total >= 45 ? 'medium' : total >= 20 ? 'low' : 'hidden';
        const multiplier = total >= 75 ? 1.5 : total >= 45 ? 1.0 : total >= 20 ? 0.6 : 0.2;

        return {
            total,
            level,
            components: {
                profile_completion: profileComp,
                availability: availScore,
                recency: recencyScore,
                response_speed: responseScore,
                verified: verifiedScore,
            },
            search_rank_multiplier: multiplier,
        };
    }

    // ─────────────────────────────────────────────────────────────────
    // BADGES
    // ─────────────────────────────────────────────────────────────────

    async computeBadges(userId: string): Promise<Badge[]> {
        const [profileRes, completionRes, offersRes, momentumRes] = await Promise.all([
            this.supabase.from('profiles').select('created_at, id_verified, phone_verified').eq('id', userId).single(),
            this.computeCompletionScore(userId),
            this.supabase.from('offers').select('sent_at, responded_at').eq('driver_id', userId)
                .not('responded_at', 'is', null).limit(20),
            this.supabase.from('operator_momentum').select('band').eq('user_id', userId).single(),
        ]);

        const profile = profileRes.data;
        const responses = (offersRes.data ?? []) as any[];

        // Founding operator: created before 2026-04-01
        const founding = profile?.created_at && new Date(profile.created_at) < new Date('2026-04-01');

        // Verified
        const verified = !!(profile?.id_verified || profile?.phone_verified);

        // Fast responder: median response < 10 min
        let fastResponder = false;
        if (responses.length >= 3) {
            const times = responses.map((o: any) => (new Date(o.responded_at).getTime() - new Date(o.sent_at).getTime()) / 60000);
            const median = times.sort((a: number, b: number) => a - b)[Math.floor(times.length / 2)];
            fastResponder = median < 10;
        }

        // Complete profile
        const completeProfile = completionRes.total >= 100;

        // Rising momentum
        const risingMomentum = momentumRes.data?.band === 'rising';

        return [
            { id: 'founding_operator', label: 'Founding Operator', emoji: '🏴', earned: !!founding, earned_at: profile?.created_at },
            { id: 'verified_operator', label: 'Verified Operator', emoji: '✅', earned: verified },
            { id: 'fast_responder', label: 'Fast Responder', emoji: '⚡', earned: fastResponder },
            { id: 'complete_profile', label: 'Complete Profile', emoji: '💯', earned: completeProfile },
            { id: 'rising_momentum', label: 'Rising Momentum', emoji: '🔥', earned: risingMomentum },
        ];
    }

    // ─────────────────────────────────────────────────────────────────
    // TRIGGERS
    // ─────────────────────────────────────────────────────────────────

    async onProfileClaimed(userId: string): Promise<{
        completion: CompletionScore;
        toast: MilestoneToast | null;
        nudge: NudgePayload;
    }> {
        const completion = await this.computeCompletionScore(userId);

        const toast = completion.milestone_reached ? MILESTONE_TOASTS[completion.milestone_reached] ?? null : null;

        const nudge: NudgePayload = {
            type: 'app_download',
            title: 'want instant load alerts?',
            body: 'download the app to get real-time notifications.',
            cta_label: 'enable alerts',
            cta_action: '/app-download',
            priority: 'medium',
        };

        // Audit
        await this.supabase.from('audit_events').insert({
            event_type: 'profile_claimed',
            actor_id: userId,
            subject_type: 'profile',
            subject_id: userId,
            payload: { score: completion.total, visibility: completion.visibility_level },
        });

        return { completion, toast, nudge };
    }

    async onProfileFieldUpdated(userId: string, field: string): Promise<{
        completion: CompletionScore;
        visibility: VisibilityScore;
        toast: MilestoneToast | null;
    }> {
        const completion = await this.computeCompletionScore(userId);
        const visibility = await this.computeVisibilityScore(userId);
        const toast = completion.milestone_reached ? MILESTONE_TOASTS[completion.milestone_reached] ?? null : null;

        await this.supabase.from('audit_events').insert({
            event_type: 'profile_progress_updated',
            actor_id: userId,
            subject_type: 'profile',
            subject_id: userId,
            payload: { field, score: completion.total, visibility: visibility.total, milestone: completion.milestone_reached },
        });

        return { completion, visibility, toast };
    }

    async onBrokerProfileView(profileUserId: string, viewerUserId: string | null): Promise<NudgePayload | null> {
        // Log the view
        await this.supabase.from('profile_views').insert({
            profile_user_id: profileUserId,
            viewer_user_id: viewerUserId,
            viewer_role: viewerUserId ? 'broker' : 'anonymous',
            source: 'search',
        });

        // Only nudge if profile < 80%
        const completion = await this.computeCompletionScore(profileUserId);
        if (completion.total >= 80) return null;

        // Check throttling: max 1 broker-viewed nudge per 24h
        const dayAgo = new Date(Date.now() - 86400000).toISOString();
        const { count } = await this.supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', profileUserId)
            .contains('metadata', { type: 'broker_viewed' })
            .gte('created_at', dayAgo);

        if ((count ?? 0) > 0) return null;

        const nudge: NudgePayload = {
            type: 'broker_viewed',
            title: '👀 a broker viewed your profile',
            body: 'complete your profile to improve your chances.',
            cta_label: 'finish now',
            cta_action: '/profile/edit',
            priority: 'high',
        };

        // Dispatch
        await this.supabase.from('notifications').insert({
            user_id: profileUserId,
            channel: 'inapp',
            title: nudge.title,
            body: nudge.body,
            metadata: { type: 'broker_viewed', viewer_id: viewerUserId, profile_score: completion.total },
        });

        return nudge;
    }

    /**
     * Daily digest job: nudge incomplete operators with corridor demand near them.
     */
    async runDailyDigest(): Promise<{ nudged: number; skipped: number }> {
        // Find claimed but incomplete operators
        const { data: operators } = await this.supabase
            .from('operator_momentum')
            .select('user_id, score')
            .lt('score', 80)
            .gt('score', 0);

        let nudged = 0;
        let skipped = 0;

        for (const op of (operators ?? [])) {
            // Check frequency cap: max 1 daily digest per 24h
            const dayAgo = new Date(Date.now() - 86400000).toISOString();
            const { count } = await this.supabase
                .from('notifications')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', op.user_id)
                .contains('metadata', { type: 'daily_digest' })
                .gte('created_at', dayAgo);

            if ((count ?? 0) > 0) { skipped++; continue; }

            // Check if demand exists near operator
            const { data: driver } = await this.supabase
                .from('driver_profiles')
                .select('coverage_states')
                .eq('user_id', op.user_id)
                .single();

            const states = driver?.coverage_states ?? [];
            const { count: loadCount } = await this.supabase
                .from('loads')
                .select('id', { count: 'exact', head: true })
                .in('origin_state', states.length > 0 ? states : ['__none__'])
                .in('status', ['open', 'posted']);

            if ((loadCount ?? 0) === 0) { skipped++; continue; }

            await this.supabase.from('notifications').insert({
                user_id: op.user_id,
                channel: 'inapp',
                title: 'high demand near you this week.',
                body: `your profile is ${op.score}% — you may be missing broker searches.`,
                metadata: { type: 'daily_digest', score: op.score, loads_nearby: loadCount },
            });

            nudged++;
        }

        return { nudged, skipped };
    }

    // ─────────────────────────────────────────────────────────────────
    // LEADERBOARD GATING
    // ─────────────────────────────────────────────────────────────────

    async isLeaderboardEligible(userId: string): Promise<{ eligible: boolean; score: number; gate: number; nudge: NudgePayload | null }> {
        const completion = await this.computeCompletionScore(userId);
        const eligible = completion.total >= LEADERBOARD_GATE;

        return {
            eligible,
            score: completion.total,
            gate: LEADERBOARD_GATE,
            nudge: eligible ? null : {
                type: 'leaderboard_gate',
                title: `complete ${LEADERBOARD_GATE}% to appear on the leaderboard.`,
                body: `you're at ${completion.total}% — ${LEADERBOARD_GATE - completion.total}% to go.`,
                cta_label: `get to ${LEADERBOARD_GATE}%`,
                cta_action: '/profile/edit',
                priority: 'medium',
            },
        };
    }

    // ─────────────────────────────────────────────────────────────────
    // MILESTONE / BOOST HELPERS
    // ─────────────────────────────────────────────────────────────────

    private async grantMilestoneBoost(userId: string, milestone: number): Promise<void> {
        const config = MILESTONE_TOASTS[milestone];
        if (!config?.boost_granted) return;

        let multiplier = 1.0;
        let hours = 24;

        switch (config.boost_granted) {
            case 'search_rank_boost_24h':
                multiplier = 1.15; hours = 24; break;
            case 'search_rank_boost_48h':
                multiplier = 1.25; hours = 48; break;
            case 'featured_eligibility_7d':
                multiplier = 1.5; hours = 168; break;
            case 'featured_eligibility_30d':
                multiplier = 1.5; hours = 720; break;
        }

        await this.supabase.from('search_boosts').upsert({
            user_id: userId,
            boost_type: `milestone_${milestone}`,
            multiplier,
            expires_at: new Date(Date.now() + hours * 3600000).toISOString(),
        }, { onConflict: 'user_id,boost_type' });

        await this.supabase.from('audit_events').insert({
            event_type: 'visibility_boost_granted',
            actor_id: userId,
            subject_type: 'boost',
            subject_id: `milestone_${milestone}`,
            payload: { milestone, multiplier, hours, boost_type: config.boost_granted },
        });
    }

    private async getPreviousMilestones(userId: string): Promise<number[]> {
        const { data } = await this.supabase
            .from('audit_events')
            .select('payload')
            .eq('actor_id', userId)
            .eq('event_type', 'visibility_boost_granted');

        return (data ?? []).map((e: any) => e.payload?.milestone).filter(Boolean);
    }

    private async saveMilestone(userId: string, milestone: number): Promise<void> {
        await this.supabase.from('audit_events').insert({
            event_type: 'milestone_reached',
            actor_id: userId,
            subject_type: 'profile',
            subject_id: userId,
            payload: { milestone, toast: MILESTONE_TOASTS[milestone] },
        });
    }
}
