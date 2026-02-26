import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

interface DriverTrustBadgeProps {
    score: number; // 0-100
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export function DriverTrustBadge({ score, size = 'md', showLabel = true }: DriverTrustBadgeProps) {
    let colorClass = 'text-emerald-500';
    let bgClass = 'bg-emerald-500/10';
    let borderClass = 'border-emerald-500/20';
    let Icon = ShieldCheck;
    let label = 'Elite Trust';

    if (score < 40) {
        colorClass = 'text-red-500';
        bgClass = 'bg-red-500/10';
        borderClass = 'border-red-500/20';
        Icon = ShieldAlert;
        label = 'Low Trust';
    } else if (score < 80) {
        colorClass = 'text-amber-500';
        bgClass = 'bg-amber-500/10';
        borderClass = 'border-amber-500/20';
        Icon = Shield;
        label = 'Verified';
    }

    const sizes = {
        sm: { icon: 14, text: 'text-[10px]', px: 'px-1.5 py-0.5' },
        md: { icon: 16, text: 'text-xs', px: 'px-2 py-1' },
        lg: { icon: 20, text: 'text-sm', px: 'px-3 py-1.5' },
    };

    const s = sizes[size];

    return (
        <div className={`inline-flex items-center gap-1.5 rounded-full border ${bgClass} ${borderClass} ${s.px} ${colorClass}`}>
            <Icon size={s.icon} strokeWidth={2.5} />
            <span className={`font-bold tracking-wide ${s.text}`}>
                {score} {showLabel && <span className="opacity-80 font-medium">| {label}</span>}
            </span>
        </div>
    );
}

// Helper to calculate score deterministically based on profile completeness during bootstrap phase
export function calculateTrustScore(driver: any): number {
    let s = 15; // Base score just for existing
    if (driver.is_verified) s += 30;
    if (driver.has_twic) s += 15;
    if (driver.insurance_verified) s += 20;
    if (driver.avatar_url) s += 10;
    if (driver.completed_jobs > 0) s += Math.min(10, driver.completed_jobs * 2);
    return Math.min(100, s);
}
