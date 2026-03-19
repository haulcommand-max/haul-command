/**
 * Sponsor Relevance Engine
 * 
 * Chooses the best sponsor, placement, and offer by page context.
 * Partners with AdGrid inventory, Claude creative, PostHog analytics.
 * 
 * Inputs: page_class, role, corridor, workflow_state, credential_need
 * Outputs: sponsor_selection, placement_priority, creative_recommendations
 */

export type PageClass =
    | 'operator_profile'
    | 'corridor_page'
    | 'city_page'
    | 'state_page'
    | 'country_page'
    | 'leaderboard'
    | 'report_card'
    | 'training_page'
    | 'credential_page'
    | 'search_results'
    | 'load_board'
    | 'near_me'
    | 'compare_page'
    | 'tool_page'
    | 'discussion'
    | 'home';

export type SponsorGoal =
    | 'brand_awareness'
    | 'lead_generation'
    | 'course_enrollment'
    | 'equipment_inquiry'
    | 'insurance_quote'
    | 'service_promotion';

export interface SponsorSlot {
    slot_id: string;
    page_class: PageClass;
    position: 'top_banner' | 'sidebar' | 'inline' | 'footer' | 'interstitial';
    max_sponsors: number;
    density_cap: number; // max ads per page
    min_relevance_score: number;
}

export interface SponsorCandidate {
    sponsor_id: string;
    company_name: string;
    goal: SponsorGoal;
    targeting: {
        corridors?: string[];
        states?: string[];
        countries?: string[];
        roles?: string[];
        credential_needs?: string[];
        score_tiers?: string[];
    };
    bid_amount: number; // CPM or CPC
    creative: {
        headline: string;
        description: string;
        cta_text: string;
        cta_url: string;
        image_url?: string;
    };
    budget_remaining: number;
    quality_score: number; // 0-100
}

export interface SponsorMatch {
    sponsor_id: string;
    relevance_score: number;
    placement: SponsorSlot['position'];
    effective_bid: number; // bid * quality * relevance
    creative: SponsorCandidate['creative'];
}

// Page → slot definitions
const PAGE_SLOTS: Record<PageClass, SponsorSlot[]> = {
    operator_profile: [
        { slot_id: 'profile_sidebar', page_class: 'operator_profile', position: 'sidebar', max_sponsors: 2, density_cap: 3, min_relevance_score: 40 },
    ],
    corridor_page: [
        { slot_id: 'corridor_top', page_class: 'corridor_page', position: 'top_banner', max_sponsors: 1, density_cap: 2, min_relevance_score: 50 },
        { slot_id: 'corridor_inline', page_class: 'corridor_page', position: 'inline', max_sponsors: 2, density_cap: 2, min_relevance_score: 40 },
    ],
    search_results: [
        { slot_id: 'search_top', page_class: 'search_results', position: 'top_banner', max_sponsors: 1, density_cap: 2, min_relevance_score: 60 },
        { slot_id: 'search_inline', page_class: 'search_results', position: 'inline', max_sponsors: 3, density_cap: 3, min_relevance_score: 30 },
    ],
    training_page: [
        { slot_id: 'training_sidebar', page_class: 'training_page', position: 'sidebar', max_sponsors: 2, density_cap: 2, min_relevance_score: 50 },
    ],
    leaderboard: [
        { slot_id: 'lb_top', page_class: 'leaderboard', position: 'top_banner', max_sponsors: 1, density_cap: 1, min_relevance_score: 70 },
    ],
    home: [
        { slot_id: 'home_hero', page_class: 'home', position: 'top_banner', max_sponsors: 1, density_cap: 1, min_relevance_score: 80 },
    ],
    // Remaining pages get minimal or no ads
    city_page: [{ slot_id: 'city_sidebar', page_class: 'city_page', position: 'sidebar', max_sponsors: 1, density_cap: 1, min_relevance_score: 40 }],
    state_page: [{ slot_id: 'state_sidebar', page_class: 'state_page', position: 'sidebar', max_sponsors: 1, density_cap: 1, min_relevance_score: 40 }],
    country_page: [{ slot_id: 'country_sidebar', page_class: 'country_page', position: 'sidebar', max_sponsors: 1, density_cap: 1, min_relevance_score: 50 }],
    report_card: [{ slot_id: 'rc_footer', page_class: 'report_card', position: 'footer', max_sponsors: 1, density_cap: 1, min_relevance_score: 50 }],
    credential_page: [{ slot_id: 'cred_sidebar', page_class: 'credential_page', position: 'sidebar', max_sponsors: 2, density_cap: 2, min_relevance_score: 40 }],
    load_board: [{ slot_id: 'lb_inline', page_class: 'load_board', position: 'inline', max_sponsors: 2, density_cap: 2, min_relevance_score: 40 }],
    near_me: [{ slot_id: 'nm_sidebar', page_class: 'near_me', position: 'sidebar', max_sponsors: 1, density_cap: 1, min_relevance_score: 50 }],
    compare_page: [],
    tool_page: [{ slot_id: 'tool_footer', page_class: 'tool_page', position: 'footer', max_sponsors: 1, density_cap: 1, min_relevance_score: 60 }],
    discussion: [{ slot_id: 'disc_sidebar', page_class: 'discussion', position: 'sidebar', max_sponsors: 1, density_cap: 1, min_relevance_score: 40 }],
};

interface PageContext {
    page_class: PageClass;
    corridor?: string;
    state?: string;
    country: string;
    role?: string;
    credential_need?: string;
    score_tier?: string;
}

function computeRelevance(candidate: SponsorCandidate, context: PageContext): number {
    let score = 30; // base

    const t = candidate.targeting;

    // Corridor match
    if (context.corridor && t.corridors?.includes(context.corridor)) score += 25;
    // State match
    if (context.state && t.states?.includes(context.state)) score += 15;
    // Country match
    if (t.countries?.includes(context.country)) score += 10;
    // Role match
    if (context.role && t.roles?.includes(context.role)) score += 15;
    // Credential need match
    if (context.credential_need && t.credential_needs?.includes(context.credential_need)) score += 20;

    // Quality multiplier
    score = Math.round(score * (candidate.quality_score / 100));

    return Math.min(100, score);
}

export function matchSponsors(
    candidates: SponsorCandidate[],
    context: PageContext,
): SponsorMatch[] {
    const slots = PAGE_SLOTS[context.page_class] || [];
    if (slots.length === 0) return [];

    // Score all candidates
    const scored = candidates
        .filter(c => c.budget_remaining > 0)
        .map(c => ({
            ...c,
            relevance: computeRelevance(c, context),
        }))
        .filter(c => c.relevance >= Math.min(...slots.map(s => s.min_relevance_score)))
        .sort((a, b) => {
            // Sort by effective bid (bid * relevance * quality)
            const aEff = a.bid_amount * (a.relevance / 100) * (a.quality_score / 100);
            const bEff = b.bid_amount * (b.relevance / 100) * (b.quality_score / 100);
            return bEff - aEff;
        });

    // Fill slots
    const matches: SponsorMatch[] = [];
    const totalDensityCap = Math.max(...slots.map(s => s.density_cap));
    let filled = 0;

    for (const slot of slots) {
        const slotCandidates = scored.filter(c =>
            c.relevance >= slot.min_relevance_score &&
            !matches.some(m => m.sponsor_id === c.sponsor_id)
        );

        for (let i = 0; i < Math.min(slot.max_sponsors, slotCandidates.length); i++) {
            if (filled >= totalDensityCap) break;
            const c = slotCandidates[i];
            matches.push({
                sponsor_id: c.sponsor_id,
                relevance_score: c.relevance,
                placement: slot.position,
                effective_bid: c.bid_amount * (c.relevance / 100) * (c.quality_score / 100),
                creative: c.creative,
            });
            filled++;
        }
    }

    return matches;
}

export { PAGE_SLOTS };
