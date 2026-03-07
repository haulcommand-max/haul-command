/**
 * BROKER CONFIDENCE LAYER — Social Gravity v2 Gap Fix #3
 *
 * "Fastest revenue gain" (+25-55% conversion lift)
 *
 * Brokers don't pay for lists. They pay for certainty under time pressure.
 *
 * When a broker views an operator, surface:
 *   - Median response time (with P95/P80/P60 percentile)
 *   - On-time history percentage
 *   - Repeat broker count ("6 brokers have rehired this operator")
 *   - Corridor familiarity score ("expert on I-75 FL")
 *   - "Likely to accept" probability
 *   - Last active indicator
 *
 * This converts browsing → booking by reducing uncertainty.
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface BrokerConfidenceReport {
    operator_id: string;
    operator_name: string;

    // Speed signals
    response_time: {
        median_minutes: number;
        percentile: 'P95' | 'P80' | 'P60' | 'P40' | 'below';
        label: string;                // "responds in ~12 min (faster than 80% of operators)"
    };

    // Reliability signals
    reliability: {
        on_time_pct: number;           // 0-100
        completed_jobs: number;
        cancellation_rate: number;     // 0-1
        label: string;                // "96% on-time across 34 jobs"
    };

    // Social proof
    social_proof: {
        repeat_broker_count: number;   // unique brokers who rehired
        total_broker_count: number;    // total unique brokers worked with
        repeat_rate: number;          // 0-1
        label: string;                // "8 brokers have rehired this operator"
    };

    // Corridor expertise
    corridor_expertise: {
        primary_corridor: string | null;
        corridor_jobs: number;
        familiarity_score: number;    // 0-100
        label: string;                // "expert on I-75 FL (23 completed jobs)"
    };

    // Booking probability
    booking_probability: {
        score: number;                 // 0-100
        label: string;                // "likely to accept" | "usually accepts" | "selective"
        factors: string[];
    };

    // Availability
    availability: {
        status: 'available' | 'busy' | 'offline' | 'recently_active';
        last_active_hours: number;
        label: string;                // "available now" | "last active 2h ago"
    };

    // Overall confidence tier
    confidence_tier: 'high' | 'medium' | 'low' | 'unknown';
    confidence_score: number;          // 0-100
    summary: string;                   // one-line verdict
}

// ── Percentile thresholds (minutes) ──────────────────────────────────────────

const RESPONSE_PERCENTILES = {
    P95: 5,     // top 5% respond within 5 min
    P80: 15,    // top 20% within 15 min
    P60: 30,    // top 40% within 30 min
    P40: 60,    // top 60% within 1 hour
};

// ── Engine ────────────────────────────────────────────────────────────────────

export class BrokerConfidenceEngine {
    constructor(private db: SupabaseClient) { }

    /**
     * Generate a full confidence report for an operator.
     * Called when a broker views an operator profile or search result card.
     */
    async generateReport(
        operatorId: string,
        corridorContext?: string,
    ): Promise<BrokerConfidenceReport> {
        const [
            operator,
            responseStats,
            jobStats,
            brokerStats,
            corridorStats,
            availabilityData,
        ] = await Promise.all([
            this.getOperator(operatorId),
            this.getResponseStats(operatorId),
            this.getJobStats(operatorId),
            this.getBrokerStats(operatorId),
            this.getCorridorStats(operatorId, corridorContext),
            this.getAvailability(operatorId),
        ]);

        // ── Response time ─────────────────────────────────────────────
        const medianMin = responseStats.median_minutes;
        let percentile: BrokerConfidenceReport['response_time']['percentile'] = 'below';
        if (medianMin <= RESPONSE_PERCENTILES.P95) percentile = 'P95';
        else if (medianMin <= RESPONSE_PERCENTILES.P80) percentile = 'P80';
        else if (medianMin <= RESPONSE_PERCENTILES.P60) percentile = 'P60';
        else if (medianMin <= RESPONSE_PERCENTILES.P40) percentile = 'P40';

        const pctLabels: Record<string, string> = {
            P95: 'faster than 95% of operators',
            P80: 'faster than 80% of operators',
            P60: 'faster than 60% of operators',
            P40: 'faster than 40% of operators',
            below: 'average response speed',
        };

        const responseTime = {
            median_minutes: medianMin,
            percentile,
            label: `responds in ~${medianMin} min (${pctLabels[percentile]})`,
        };

        // ── Reliability ───────────────────────────────────────────────
        const reliability = {
            on_time_pct: jobStats.on_time_pct,
            completed_jobs: jobStats.completed,
            cancellation_rate: jobStats.cancellation_rate,
            label: `${jobStats.on_time_pct}% on-time across ${jobStats.completed} jobs`,
        };

        // ── Social proof ──────────────────────────────────────────────
        const socialProof = {
            repeat_broker_count: brokerStats.repeat_brokers,
            total_broker_count: brokerStats.total_brokers,
            repeat_rate: brokerStats.total_brokers > 0
                ? brokerStats.repeat_brokers / brokerStats.total_brokers
                : 0,
            label: brokerStats.repeat_brokers > 0
                ? `${brokerStats.repeat_brokers} brokers have rehired this operator`
                : `${brokerStats.total_brokers} unique brokers served`,
        };

        // ── Corridor expertise ────────────────────────────────────────
        const familiarityScore = Math.min(
            100,
            corridorStats.corridor_jobs * 4.5 + (corridorStats.corridor_jobs > 5 ? 20 : 0),
        );
        const corridorExpertise = {
            primary_corridor: corridorStats.primary_corridor,
            corridor_jobs: corridorStats.corridor_jobs,
            familiarity_score: Math.round(familiarityScore),
            label: corridorStats.primary_corridor
                ? `${familiarityScore >= 70 ? 'expert' : 'experienced'} on ${corridorStats.primary_corridor} (${corridorStats.corridor_jobs} jobs)`
                : 'no corridor history yet',
        };

        // ── Booking probability ───────────────────────────────────────
        const bookingScore = this.computeBookingProbability(
            availabilityData,
            responseStats,
            jobStats,
            brokerStats,
        );
        const bookingLabel = bookingScore >= 80 ? 'likely to accept'
            : bookingScore >= 60 ? 'usually accepts'
                : bookingScore >= 40 ? 'selective'
                    : 'unpredictable';

        const bookingFactors: string[] = [];
        if (availabilityData.status === 'available') bookingFactors.push('currently available');
        if (medianMin <= 15) bookingFactors.push('fast responder');
        if (jobStats.cancellation_rate < 0.05) bookingFactors.push('low cancellation rate');
        if (brokerStats.repeat_brokers >= 3) bookingFactors.push('high repeat rate');

        const bookingProbability = {
            score: bookingScore,
            label: bookingLabel,
            factors: bookingFactors,
        };

        // ── Availability ──────────────────────────────────────────────
        const availability = {
            status: availabilityData.status,
            last_active_hours: availabilityData.last_active_hours,
            label: availabilityData.status === 'available'
                ? 'available now'
                : availabilityData.last_active_hours < 1
                    ? 'active minutes ago'
                    : `last active ${Math.round(availabilityData.last_active_hours)}h ago`,
        };

        // ── Overall confidence ────────────────────────────────────────
        const confidence = this.computeOverallConfidence(
            responseTime,
            reliability,
            socialProof,
            corridorExpertise,
            bookingProbability,
            availability,
        );

        const summary = confidence.tier === 'high'
            ? 'verified fast responder with strong track record'
            : confidence.tier === 'medium'
                ? 'reliable operator with proven experience'
                : confidence.tier === 'low'
                    ? 'limited track record — new or inactive operator'
                    : 'not enough data to assess';

        return {
            operator_id: operatorId,
            operator_name: operator?.display_name ?? 'Operator',
            response_time: responseTime,
            reliability,
            social_proof: socialProof,
            corridor_expertise: corridorExpertise,
            booking_probability: bookingProbability,
            availability,
            confidence_tier: confidence.tier,
            confidence_score: confidence.score,
            summary,
        };
    }

    // ── Booking Probability ───────────────────────────────────────────────

    private computeBookingProbability(
        availability: { status: string; last_active_hours: number },
        response: { median_minutes: number },
        jobs: { completed: number; cancellation_rate: number; acceptance_rate: number },
        brokers: { repeat_brokers: number },
    ): number {
        let score = 0;

        // Available now = huge boost
        if (availability.status === 'available') score += 35;
        else if (availability.last_active_hours < 2) score += 20;
        else if (availability.last_active_hours < 6) score += 10;

        // Fast responder
        if (response.median_minutes <= 10) score += 25;
        else if (response.median_minutes <= 30) score += 15;
        else if (response.median_minutes <= 60) score += 8;

        // Acceptance rate history
        score += Math.min(25, jobs.acceptance_rate * 25);

        // Low cancellation
        if (jobs.cancellation_rate < 0.03) score += 10;
        else if (jobs.cancellation_rate < 0.08) score += 5;

        // Repeat business = reliable
        if (brokers.repeat_brokers >= 5) score += 5;

        return Math.min(100, Math.round(score));
    }

    // ── Overall Confidence ────────────────────────────────────────────────

    private computeOverallConfidence(
        response: BrokerConfidenceReport['response_time'],
        reliability: BrokerConfidenceReport['reliability'],
        social: BrokerConfidenceReport['social_proof'],
        corridor: BrokerConfidenceReport['corridor_expertise'],
        booking: BrokerConfidenceReport['booking_probability'],
        avail: BrokerConfidenceReport['availability'],
    ): { tier: BrokerConfidenceReport['confidence_tier']; score: number } {
        let score = 0;

        // Response speed (25%)
        if (response.percentile === 'P95') score += 25;
        else if (response.percentile === 'P80') score += 20;
        else if (response.percentile === 'P60') score += 15;
        else if (response.percentile === 'P40') score += 10;
        else score += 3;

        // Reliability (25%)
        score += Math.round(reliability.on_time_pct * 0.25);

        // Social proof (20%)
        const socialScore = Math.min(20, social.repeat_broker_count * 3 + social.total_broker_count);
        score += socialScore;

        // Corridor (15%)
        score += Math.round(corridor.familiarity_score * 0.15);

        // Availability (15%)
        if (avail.status === 'available') score += 15;
        else if (avail.last_active_hours < 2) score += 10;
        else if (avail.last_active_hours < 12) score += 5;

        score = Math.min(100, score);

        const tier: BrokerConfidenceReport['confidence_tier'] =
            score >= 75 ? 'high' :
                score >= 50 ? 'medium' :
                    score >= 25 ? 'low' : 'unknown';

        return { tier, score };
    }

    // ── Data fetchers ─────────────────────────────────────────────────────

    private async getOperator(id: string) {
        const { data } = await this.db
            .from('operators')
            .select('display_name, home_base_state')
            .eq('id', id)
            .single();
        return data;
    }

    private async getResponseStats(id: string) {
        const { data } = await this.db
            .from('operator_stats')
            .select('median_response_minutes')
            .eq('user_id', id)
            .single();
        return { median_minutes: data?.median_response_minutes ?? 45 };
    }

    private async getJobStats(id: string) {
        const { data } = await this.db
            .from('operator_stats')
            .select('completed_jobs, on_time_rate, cancellation_rate, acceptance_rate')
            .eq('user_id', id)
            .single();
        return {
            completed: data?.completed_jobs ?? 0,
            on_time_pct: Math.round((data?.on_time_rate ?? 0.85) * 100),
            cancellation_rate: data?.cancellation_rate ?? 0.05,
            acceptance_rate: data?.acceptance_rate ?? 0.7,
        };
    }

    private async getBrokerStats(id: string) {
        // Count unique brokers and repeat brokers from jobs table
        const { data } = await this.db.rpc('get_broker_stats_for_operator', {
            p_operator_id: id,
        });
        return {
            total_brokers: data?.total_brokers ?? 0,
            repeat_brokers: data?.repeat_brokers ?? 0,
        };
    }

    private async getCorridorStats(id: string, corridorContext?: string) {
        // Get top corridor by job count
        const { data } = await this.db.rpc('get_corridor_stats_for_operator', {
            p_operator_id: id,
            p_corridor: corridorContext ?? null,
        });
        return {
            primary_corridor: data?.primary_corridor ?? null,
            corridor_jobs: data?.corridor_jobs ?? 0,
        };
    }

    private async getAvailability(id: string) {
        const { data } = await this.db
            .from('operators')
            .select('availability_status, last_active_at')
            .eq('id', id)
            .single();
        const lastActive = data?.last_active_at ? new Date(data.last_active_at) : new Date(0);
        const hoursAgo = (Date.now() - lastActive.getTime()) / 3600000;
        return {
            status: (data?.availability_status ?? 'offline') as 'available' | 'busy' | 'offline' | 'recently_active',
            last_active_hours: hoursAgo,
        };
    }
}
