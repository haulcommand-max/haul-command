/**
 * Install Conversion Engine
 * 
 * Converts web authority into high-quality mobile installs and action.
 * Decides WHEN and HOW to prompt app install based on user intent signals.
 * 
 * Rule: "Prompt only at high-intent moments. No spammy global banner."
 */

export type PromptType = 'none' | 'subtle_badge' | 'contextual_cta' | 'full_modal' | 'deep_link';

export interface InstallContext {
    role: 'operator' | 'broker' | 'dispatcher' | 'training_partner' | 'visitor';
    page_type: string;
    device_type: 'mobile' | 'tablet' | 'desktop';
    is_app_installed: boolean;
    intent_signals: {
        claim_started: boolean;
        claim_completed: boolean;
        shortlist_saved: boolean;
        search_count_session: number;
        profile_views_session: number;
        return_visitor: boolean;
        time_on_site_seconds: number;
        load_board_viewed: boolean;
        availability_toggled: boolean;
    };
    session_number: number; // how many times user has visited
    last_prompt_hours_ago: number | null; // null = never prompted
}

export interface InstallDecision {
    should_prompt: boolean;
    prompt_type: PromptType;
    copy: {
        headline: string;
        body: string;
        cta: string;
    };
    deep_link_target: string;
    install_campaign_tag: string;
    cooldown_hours: number;
}

// Role-specific deep link targets
const DEEP_LINKS: Record<string, string> = {
    operator_claim: '/app/claim',
    operator_availability: '/app/availability',
    operator_jobs: '/app/jobs',
    broker_shortlist: '/app/shortlist',
    broker_search: '/app/search',
    dispatcher_loads: '/app/loads',
    default: '/app',
};

// Minimum cooldown between prompts (hours)
const MIN_COOLDOWN = 24;
const AGGRESSIVE_COOLDOWN = 4; // for high-intent moments

export function decideInstallPrompt(ctx: InstallContext): InstallDecision {
    const noPrompt: InstallDecision = {
        should_prompt: false,
        prompt_type: 'none',
        copy: { headline: '', body: '', cta: '' },
        deep_link_target: DEEP_LINKS.default,
        install_campaign_tag: 'none',
        cooldown_hours: MIN_COOLDOWN,
    };

    // Never prompt if app already installed
    if (ctx.is_app_installed) return noPrompt;

    // Never prompt on desktop (app is mobile-first)
    if (ctx.device_type === 'desktop') return noPrompt;

    // Respect cooldown
    if (ctx.last_prompt_hours_ago !== null && ctx.last_prompt_hours_ago < MIN_COOLDOWN) {
        // Exception: high-intent moments can override with shorter cooldown
        const isHighIntent = ctx.intent_signals.claim_completed || ctx.intent_signals.availability_toggled;
        if (!isHighIntent || ctx.last_prompt_hours_ago < AGGRESSIVE_COOLDOWN) {
            return noPrompt;
        }
    }

    const signals = ctx.intent_signals;

    // HIGH INTENT: Claim completed → full modal
    if (signals.claim_completed) {
        return {
            should_prompt: true,
            prompt_type: 'full_modal',
            copy: {
                headline: '🎉 Profile Claimed!',
                body: 'Get the app to manage your availability, receive load alerts instantly, and respond to jobs 5x faster.',
                cta: 'Get the App — Free',
            },
            deep_link_target: DEEP_LINKS.operator_availability,
            install_campaign_tag: 'claim_complete',
            cooldown_hours: AGGRESSIVE_COOLDOWN,
        };
    }

    // HIGH INTENT: Claim started but not finished
    if (signals.claim_started && !signals.claim_completed) {
        return {
            should_prompt: true,
            prompt_type: 'contextual_cta',
            copy: {
                headline: 'Finish Faster on the App',
                body: 'Complete your claim in 2 taps with camera verification.',
                cta: 'Continue in App',
            },
            deep_link_target: DEEP_LINKS.operator_claim,
            install_campaign_tag: 'claim_rescue',
            cooldown_hours: MIN_COOLDOWN,
        };
    }

    // HIGH INTENT: Shortlist saved (broker/dispatcher)
    if (signals.shortlist_saved && (ctx.role === 'broker' || ctx.role === 'dispatcher')) {
        return {
            should_prompt: true,
            prompt_type: 'contextual_cta',
            copy: {
                headline: 'Your Shortlist — On the Go',
                body: 'Get instant alerts when your saved operators update availability.',
                cta: 'Open in App',
            },
            deep_link_target: DEEP_LINKS.broker_shortlist,
            install_campaign_tag: 'shortlist_save',
            cooldown_hours: MIN_COOLDOWN,
        };
    }

    // MEDIUM INTENT: Multiple searches or profile views
    if (signals.search_count_session >= 3 || signals.profile_views_session >= 4) {
        return {
            should_prompt: true,
            prompt_type: 'subtle_badge',
            copy: {
                headline: 'Search Faster',
                body: 'Use the app for instant results and geo-proximity sorting.',
                cta: 'Try the App',
            },
            deep_link_target: ctx.role === 'broker' ? DEEP_LINKS.broker_search : DEEP_LINKS.default,
            install_campaign_tag: 'heavy_search',
            cooldown_hours: MIN_COOLDOWN,
        };
    }

    // MEDIUM INTENT: Load board viewed on mobile
    if (signals.load_board_viewed && ctx.device_type === 'mobile') {
        return {
            should_prompt: true,
            prompt_type: 'contextual_cta',
            copy: {
                headline: 'Never Miss a Load',
                body: 'Get push alerts for new loads matching your corridor. Respond first.',
                cta: 'Get Load Alerts',
            },
            deep_link_target: DEEP_LINKS.dispatcher_loads,
            install_campaign_tag: 'load_board',
            cooldown_hours: MIN_COOLDOWN,
        };
    }

    // LOW INTENT: Return visitor on mobile, 3+ sessions
    if (ctx.return_visitor && ctx.session_number >= 3 && ctx.device_type === 'mobile') {
        return {
            should_prompt: true,
            prompt_type: 'subtle_badge',
            copy: {
                headline: 'Welcome Back',
                body: 'Get the app for a faster experience.',
                cta: 'Install',
            },
            deep_link_target: DEEP_LINKS.default,
            install_campaign_tag: 'return_visitor',
            cooldown_hours: MIN_COOLDOWN * 2,
        };
    }

    // Default: no prompt
    return noPrompt;
}
