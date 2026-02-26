import { clsx } from "clsx";
import { Award, Shield, Zap, Crown } from "lucide-react";

export type RankTier = 'ROOKIE' | 'ROAD_READY' | 'ELITE' | 'LEGEND';

interface RankBadgeProps {
    tier: RankTier | string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const TIER_CONFIG = {
    ROOKIE: {
        label: 'ROOKIE',
        color: 'bg-slate-100 text-slate-600 border-slate-200',
        icon: Shield,
        glow: ''
    },
    ROAD_READY: {
        label: 'ROAD READY',
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: Zap,
        glow: 'shadow-[0_0_10px_rgba(251,191,36,0.2)]'
    },
    ELITE: {
        label: 'ELITE',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: Award,
        glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]'
    },
    LEGEND: {
        label: 'LEGEND',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: Crown,
        glow: 'shadow-[0_0_20px_rgba(234,179,8,0.5)] border-yellow-400'
    }
};

export function RankBadge({ tier, size = 'md', className }: RankBadgeProps) {
    // Safe normalization
    const normalizedTier = (typeof tier === 'string' ? tier.toUpperCase() : 'ROOKIE') as RankTier;
    const config = TIER_CONFIG[normalizedTier] || TIER_CONFIG.ROOKIE;
    const Icon = config.icon;

    const sizeClasses = {
        sm: 'text-xs px-1.5 py-0.5 gap-1',
        md: 'text-sm px-2.5 py-1 gap-1.5',
        lg: 'text-base px-3 py-1.5 gap-2'
    };

    return (
        <div className={clsx(
            "inline-flex items-center rounded-full border font-bold uppercase tracking-wide",
            config.color,
            config.glow,
            sizeClasses[size],
            className
        )}>
            <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
            <span>{config.label}</span>
            {normalizedTier === 'LEGEND' && (
                <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
            )}
        </div>
    );
}
