import React, { ReactNode } from 'react';
import { HcIconProps, HC_SVG_DEFAULTS, HcVariant } from './types';

/**
 * Universal icon renderer — takes raw paths and applies variant treatment.
 *
 * Variants:
 *   outline        → stroke only (default)
 *   filled         → primaryFill filled solid + stroked detail
 *   duotone        → primaryFill at 12% opacity + full strokes
 *   active_selected → gold color, bolder stroke
 *   map_pin        → icon inside teardrop pin container
 *   badge_mini     → heavier stroke, tighter viewBox padding
 *   app_nav        → 20px optimized, balanced weight
 *   empty_state    → larger, lighter, decorative
 */

interface HcIconBaseProps extends HcIconProps {
    paths: ReactNode;
    primaryFill?: string;
}

export function HcIconBase({
    size = 24,
    variant = 'outline',
    paths,
    primaryFill,
    className,
    style,
    ...rest
}: HcIconBaseProps) {
    const s = typeof size === 'string' ? size : `${size}`;

    switch (variant) {
        case 'filled':
            return (
                <svg {...HC_SVG_DEFAULTS} width={s} height={s} className={className} style={style} {...rest}>
                    {primaryFill && <path d={primaryFill} fill="currentColor" stroke="none" />}
                    <g stroke="currentColor" opacity={0.6}>{paths}</g>
                </svg>
            );

        case 'duotone':
            return (
                <svg {...HC_SVG_DEFAULTS} width={s} height={s} className={className} style={style} {...rest}>
                    {primaryFill && <path d={primaryFill} fill="currentColor" opacity={0.12} stroke="none" />}
                    {paths}
                </svg>
            );

        case 'active_selected':
            return (
                <svg {...HC_SVG_DEFAULTS} width={s} height={s} strokeWidth={2.25} className={className} style={{ color: '#C6923A', ...style }} {...rest}>
                    {primaryFill && <path d={primaryFill} fill="currentColor" opacity={0.15} stroke="none" />}
                    {paths}
                </svg>
            );

        case 'map_pin':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width={s} height={s} viewBox="0 0 32 40" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} style={style} {...rest}>
                    {/* Pin teardrop shape */}
                    <path d="M16 38c0 0-13-14-13-22a13 13 0 0 1 26 0c0 8-13 22-13 22z" fill="currentColor" opacity={0.15} stroke="currentColor" strokeWidth={1.5} />
                    {/* Icon inside, translated to center of pin head */}
                    <g transform="translate(4,3)" strokeWidth={1.5}>
                        {paths}
                    </g>
                </svg>
            );

        case 'badge_mini':
            return (
                <svg {...HC_SVG_DEFAULTS} width={s} height={s} strokeWidth={2.25} className={className} style={style} {...rest}>
                    {paths}
                </svg>
            );

        case 'app_nav':
            return (
                <svg {...HC_SVG_DEFAULTS} width={s} height={s} strokeWidth={1.5} className={className} style={style} {...rest}>
                    {primaryFill && <path d={primaryFill} fill="currentColor" opacity={0.08} stroke="none" />}
                    {paths}
                </svg>
            );

        case 'empty_state':
            return (
                <svg {...HC_SVG_DEFAULTS} width={s} height={s} className={className} style={{ opacity: 0.4, ...style }} {...rest}>
                    {primaryFill && <path d={primaryFill} fill="currentColor" opacity={0.06} stroke="none" />}
                    {paths}
                </svg>
            );

        // outline (default)
        default:
            return (
                <svg {...HC_SVG_DEFAULTS} width={s} height={s} className={className} style={style} {...rest}>
                    {paths}
                </svg>
            );
    }
}
