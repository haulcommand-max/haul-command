import { SVGProps, ReactNode } from 'react';

/**
 * Haul Command Ecosystem Icon Pack — Type System
 * 80 icons · 8 variants · full registry
 */

export type HcVariant = 'outline' | 'filled' | 'duotone' | 'active_selected' | 'map_pin' | 'badge_mini' | 'app_nav' | 'empty_state';
export type IconPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type IconGroup = 'core_market' | 'infrastructure' | 'support_services' | 'commerce_marketplace' | 'compliance_finance' | 'platform_surfaces' | 'status_badges';

export interface HcIconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    variant?: HcVariant;
}

export interface IconDef {
    id: string;
    label: string;
    priority: IconPriority;
    group: IconGroup;
    rank: number;
    paths: ReactNode;
    /** SVG path d-string for the primary shape (used by filled/duotone) */
    primaryFill?: string;
}

export interface HcIconMeta {
    id: string;
    label: string;
    priority: IconPriority;
    group: IconGroup;
    rank: number;
    component: React.ComponentType<HcIconProps>;
}

export const HC_SVG_DEFAULTS = {
    xmlns: 'http://www.w3.org/2000/svg' as const,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
};
