import React from 'react';
import { Anchor, Moon, Shield, Award } from 'lucide-react';

export type BadgeType = 'TWIC' | 'NIGHT_MOVE' | 'MILLION_INSURED' | 'VETERAN' | 'ELITE';

interface GamifiedBadgeSystemProps {
    badges: BadgeType[];
    size?: 'sm' | 'md';
}

const BADGE_CONFIG: Record<BadgeType, { label: string; bg: string; text: string; icon: any }> = {
    TWIC: {
        label: 'TWIC Port Ready',
        bg: 'bg-blue-500/10 border-blue-500/30',
        text: 'text-blue-400',
        icon: Anchor
    },
    NIGHT_MOVE: {
        label: 'Night Move Cert',
        bg: 'bg-indigo-500/10 border-indigo-500/30',
        text: 'text-indigo-400',
        icon: Moon
    },
    MILLION_INSURED: {
        label: '$1M+ Insured',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        text: 'text-emerald-400',
        icon: Shield
    },
    VETERAN: {
        label: 'Veteran Operator',
        bg: 'bg-purple-500/10 border-purple-500/30',
        text: 'text-purple-400',
        icon: Award
    },
    ELITE: {
        label: 'Algorithm Elite',
        bg: 'bg-[#F1A91B]/10 border-[#F1A91B]/30',
        text: 'text-[#F1A91B]',
        icon: Shield
    },
};

export function GamifiedBadgeSystem({ badges, size = 'md' }: GamifiedBadgeSystemProps) {
    if (!badges || badges.length === 0) return null;

    const iconSize = size === 'sm' ? 12 : 14;
    const textSize = size === 'sm' ? 'text-[9px]' : 'text-[10px]';
    const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1';

    return (
        <div className="flex flex-wrap gap-2">
            {badges.map(b => {
                const config = BADGE_CONFIG[b];
                if (!config) return null;
                const Icon = config.icon;

                return (
                    <div key={b} className={`flex items-center gap-1.5 rounded border ${config.bg} ${padding} ${config.text}`}>
                        <Icon size={iconSize} strokeWidth={2.5} />
                        <span className={`font-bold uppercase tracking-wider ${textSize}`}>
                            {config.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
