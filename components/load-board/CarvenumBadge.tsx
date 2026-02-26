'use client';

interface CarvenumBadgeProps {
    color: 'green' | 'yellow' | 'orange' | 'red' | 'unknown';
    score?: number | null;
    showLabel?: boolean;
}

const COLOR_CONFIG: Record<string, { dot: string; text: string; label: string }> = {
    green: { dot: 'bg-hc-success', text: 'text-hc-success', label: 'Strong Rate' },
    yellow: { dot: 'bg-hc-warning', text: 'text-hc-warning', label: 'Fair Rate' },
    orange: { dot: 'bg-hc-primary-gold', text: 'text-hc-primary-gold', label: 'Below Median' },
    red: { dot: 'bg-hc-danger', text: 'text-hc-danger', label: 'Below Market' },
    unknown: { dot: 'bg-hc-industrial-charcoal', text: 'text-hc-charcoal-text', label: 'Rate Unknown' },
};

/**
 * CarvenumBadge — rate benchmark value indicator.
 * green  = rate >= p75 (top quartile)
 * yellow = p50–p75
 * orange = p25–p50
 * red    = below p25
 * unknown= < 30 lane samples
 * 
 * Placement: loads list (compact dot), load detail (with label), push offer card (dot).
 */
export function CarvenumBadge({ color, score, showLabel = false }: CarvenumBadgeProps) {
    const config = COLOR_CONFIG[color] ?? COLOR_CONFIG.unknown;

    return (
        <div className="flex items-center gap-1.5" title={config.label}>
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${config.dot}`} />
            {showLabel && (
                <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
            )}
        </div>
    );
}
