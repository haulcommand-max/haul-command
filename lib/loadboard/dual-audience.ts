// lib/loadboard/dual-audience.ts
//
// Haul Command — Dual-Audience Routing Logic
// Spec: Map-First Load Board v1.0.0
//
// One site, two experiences. Detects, persists, and routes
// based on user role (operator vs shipper/broker).

// ============================================================
// TYPES
// ============================================================

export type UserRole = 'operator' | 'shipper';

export type DetectionMethod =
    | 'explicit_switch'
    | 'authenticated_profile'
    | 'cookie'
    | 'utm_hint'
    | 'first_click'
    | 'default';

export interface RoleDetectionResult {
    role: UserRole;
    method: DetectionMethod;
    confidence: 'high' | 'medium' | 'low';
}

export interface RoleDefaults {
    role: UserRole;
    label: string;
    map_layer: string;
    list_mode: string;
    primary_cta: string;
    secondary_cta: string;
    default_filters: {
        escort_type: string;
        date_window: string;
    };
}

export interface RoleGates {
    allowed: string[];
    restricted: string[];
}

// ============================================================
// ROLE DEFINITIONS
// ============================================================

const ROLE_CONFIGS: Record<UserRole, RoleDefaults> = {
    operator: {
        role: 'operator',
        label: "I'm an Operator",
        map_layer: 'liquidity_heat_surface',
        list_mode: 'jobs',
        primary_cta: 'Apply / Contact',
        secondary_cta: 'Boost Profile',
        default_filters: {
            escort_type: 'chase_only',
            date_window: 'next_14_days',
        },
    },
    shipper: {
        role: 'shipper',
        label: "I'm a Shipper/Broker",
        map_layer: 'coverage_band_tiles',
        list_mode: 'operators_near_route',
        primary_cta: 'Post Job',
        secondary_cta: 'View Verified Operators',
        default_filters: {
            escort_type: 'chase_only',
            date_window: 'next_14_days',
        },
    },
};

const ROLE_GATES: Record<UserRole, RoleGates> = {
    operator: {
        allowed: ['apply_contact', 'profile_claim', 'verification_purchase', 'view_jobs', 'save_search'],
        restricted: ['bulk_export', 'post_job'],
    },
    shipper: {
        allowed: ['post_job', 'invite_operator', 'coverage_reports', 'view_operators', 'bulk_export'],
        restricted: ['operator_only_perks', 'profile_claim'],
    },
};

// ============================================================
// ROLE DETECTION
// ============================================================

/**
 * Detect user role following spec precedence:
 * 1. Explicit UI switch
 * 2. Authenticated profile role
 * 3. Cookie
 * 4. UTM hint
 * 5. First click intent
 * 6. Default (shipper)
 */
export function detectRole(context: {
    explicitSwitch?: UserRole;
    profileRole?: UserRole;
    cookieRole?: UserRole;
    utmRoleHint?: string;
    firstClickIntent?: 'post_job' | 'find_work';
}): RoleDetectionResult {
    // 1. Explicit switch — highest priority, highest confidence
    if (context.explicitSwitch) {
        return {
            role: context.explicitSwitch,
            method: 'explicit_switch',
            confidence: 'high',
        };
    }

    // 2. Authenticated profile
    if (context.profileRole) {
        return {
            role: context.profileRole,
            method: 'authenticated_profile',
            confidence: 'high',
        };
    }

    // 3. Cookie
    if (context.cookieRole) {
        return {
            role: context.cookieRole,
            method: 'cookie',
            confidence: 'medium',
        };
    }

    // 4. UTM hint
    if (context.utmRoleHint) {
        const role = normalizeRoleHint(context.utmRoleHint);
        if (role) {
            return {
                role,
                method: 'utm_hint',
                confidence: 'medium',
            };
        }
    }

    // 5. First click intent
    if (context.firstClickIntent) {
        return {
            role: context.firstClickIntent === 'find_work' ? 'operator' : 'shipper',
            method: 'first_click',
            confidence: 'low',
        };
    }

    // 6. Default
    return {
        role: 'shipper',
        method: 'default',
        confidence: 'low',
    };
}

function normalizeRoleHint(hint: string): UserRole | null {
    const lower = hint.toLowerCase().trim();
    if (['operator', 'driver', 'pilot', 'escort', 'chase'].includes(lower)) return 'operator';
    if (['shipper', 'broker', 'carrier', 'transport', 'poster'].includes(lower)) return 'shipper';
    return null;
}

// ============================================================
// ROLE DEFAULTS
// ============================================================

export function getRoleDefaults(role: UserRole): RoleDefaults {
    return ROLE_CONFIGS[role];
}

export function getRoleGates(role: UserRole): RoleGates {
    return ROLE_GATES[role];
}

export function isActionAllowed(role: UserRole, action: string): boolean {
    const gates = ROLE_GATES[role];
    if (gates.restricted.includes(action)) return false;
    if (gates.allowed.includes(action)) return true;
    return true; // Default allow for unspecified actions
}

// ============================================================
// URL + COOKIE HELPERS
// ============================================================

export function buildRoleUrl(basePath: string, role: UserRole): string {
    const url = new URL(basePath, 'https://haulcommand.com');
    url.searchParams.set('role', role);
    return url.pathname + url.search;
}

export function parseRoleFromUrl(searchParams: URLSearchParams): UserRole | undefined {
    const role = searchParams.get('role');
    if (role === 'operator' || role === 'shipper') return role;
    return undefined;
}

export const ROLE_COOKIE = {
    name: 'hc_role',
    ttl_days: 180,
    options: {
        path: '/',
        sameSite: 'lax' as const,
        secure: true,
    },
};

// ============================================================
// ROLE EVENT TRACKING
// ============================================================

export interface RoleEvent {
    event_type: 'role_switch' | 'role_detected' | 'role_default_applied' | 'onboarding_tooltip_shown' | 'onboarding_tooltip_dismissed';
    from_role?: UserRole;
    to_role: UserRole;
    detection_method: DetectionMethod;
    metadata?: Record<string, unknown>;
}

export function createRoleEvent(
    detection: RoleDetectionResult,
    previousRole?: UserRole
): RoleEvent {
    const isSwitch = previousRole && previousRole !== detection.role;

    return {
        event_type: isSwitch ? 'role_switch' :
            detection.method === 'default' ? 'role_default_applied' :
                'role_detected',
        from_role: previousRole,
        to_role: detection.role,
        detection_method: detection.method,
    };
}

// ============================================================
// SOFT GATES
// ============================================================

export type SoftGateId = 'contact_gate' | 'high_value_gate';

export interface SoftGateResult {
    gate_id: SoftGateId;
    triggered: boolean;
    behavior: 'prompt_login' | 'upgrade_prompt';
    blocking: boolean;
}

export function evaluateSoftGates(context: {
    action: string;
    isLoggedIn: boolean;
    isVerifiedUser: boolean;
    targetVerificationLevel?: string;
}): SoftGateResult | null {
    // Contact gate: trying to contact without login
    if (
        (context.action === 'contact' || context.action === 'apply') &&
        !context.isLoggedIn
    ) {
        return {
            gate_id: 'contact_gate',
            triggered: true,
            behavior: 'prompt_login',
            blocking: true,
        };
    }

    // High value gate: viewing elite details without being verified
    if (
        context.action === 'view_details' &&
        context.targetVerificationLevel === 'verified_elite' &&
        !context.isVerifiedUser
    ) {
        return {
            gate_id: 'high_value_gate',
            triggered: true,
            behavior: 'upgrade_prompt',
            blocking: false, // non-blocking preview
        };
    }

    return null;
}

// ============================================================
// OAUTH PROVIDERS
// ============================================================

export const OAUTH_PROVIDERS: Record<UserRole, string[]> = {
    operator: ['google', 'facebook', 'linkedin'],
    shipper: ['google', 'linkedin'],
};

export function getOAuthProviders(role: UserRole): string[] {
    return OAUTH_PROVIDERS[role];
}

// ============================================================
// ONBOARDING
// ============================================================

export interface OnboardingStep {
    step: number;
    text: string;
    target_element: string;
}

export function getOnboardingSteps(role: UserRole): OnboardingStep[] {
    if (role === 'operator') {
        return [
            { step: 1, text: 'Browse active escort jobs on the map. Blue clusters show demand by region.', target_element: '#map-container' },
            { step: 2, text: 'Filter by escort type, date, and location to find jobs that fit.', target_element: '#search-bar' },
            { step: 3, text: 'Tap a job to apply or contact the poster directly.', target_element: '#result-card-0' },
        ];
    }
    return [
        { step: 1, text: 'See live coverage across the country. Green zones have the most verified operators.', target_element: '#map-container' },
        { step: 2, text: 'Post a job to get matched with verified escort operators instantly.', target_element: '#post-job-cta' },
        { step: 3, text: 'Check the coverage badge to know if operators are available in your area.', target_element: '#coverage-badge' },
    ];
}
