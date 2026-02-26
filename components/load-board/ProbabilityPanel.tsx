'use client';

interface StageProbabilities {
    p_offer: number | null;
    p_view: number | null;
    p_accept: number | null;
}

interface TopFactor {
    label: string;
    value: number;
    direction: 'up' | 'down';
}

interface ProbabilityPanelProps {
    p_fill_60m: number | null;
    p_fill_4h?: number | null;
    p_low: number | null;
    p_high: number | null;
    confidence: number;
    computed_at: string | null;
    stage_probs: StageProbabilities;
    top_factors: TopFactor[];
    recommended_fixes?: string[];
}

/**
 * ProbabilityPanel — confidence-gated fill probability display.
 * Rules per spec:
 * - confidence >= 0.35: show exact % with bar
 * - confidence 0.20–0.35: show range (p_low–p_high) + "Low data"
 * - confidence < 0.20: show qualitative label + top factors only, NO exact %
 */
export function ProbabilityPanel({
    p_fill_60m,
    p_fill_4h,
    p_low,
    p_high,
    confidence,
    computed_at,
    stage_probs,
    top_factors,
    recommended_fixes = [],
}: ProbabilityPanelProps) {
    const showExact = confidence >= 0.35;
    const showRange = confidence >= 0.20 && confidence < 0.35;
    const showLabelOnly = confidence < 0.20;

    const fillPct = p_fill_60m != null ? Math.round(p_fill_60m * 100) : null;
    const lowPct = p_low != null ? Math.round(p_low * 100) : null;
    const highPct = p_high != null ? Math.round(p_high * 100) : null;
    const confPct = Math.round(confidence * 100);

    const getQualitativeLabel = () => {
        if (p_fill_60m == null) return 'Unknown';
        if (p_fill_60m >= 0.70) return 'Fast Fill';
        if (p_fill_60m >= 0.45) return 'Moderate';
        return 'Slow Mover';
    };

    const getBarColor = () => {
        if (p_fill_60m == null) return 'bg-hc-industrial-charcoal';
        if (p_fill_60m >= 0.70) return 'bg-hc-success';
        if (p_fill_60m >= 0.45) return 'bg-hc-warning';
        return 'bg-hc-danger';
    };

    return (
        <div className="space-y-3 pt-3 border-t border-hc-industrial-charcoal">
            {/* Main probability display */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-hc-charcoal-text uppercase tracking-wider">Fill Probability</span>
                    {(showRange || showLabelOnly) && (
                        <span className="px-1.5 py-0.5 bg-hc-warning/20 text-hc-warning text-xs rounded">
                            Low data
                        </span>
                    )}
                </div>
                <div className="text-right">
                    {showExact && fillPct != null && (
                        <span className="text-lg font-bold text-hc-steel-text">{fillPct}%</span>
                    )}
                    {showRange && lowPct != null && highPct != null && (
                        <span className="text-base font-semibold text-hc-command-gold">{lowPct}–{highPct}%</span>
                    )}
                    {showLabelOnly && (
                        <span className="text-base font-semibold text-hc-charcoal-text">{getQualitativeLabel()}</span>
                    )}
                </div>
            </div>

            {/* Fill bar (only when exact) */}
            {showExact && fillPct != null && (
                <div className="w-full h-1.5 bg-hc-industrial-charcoal rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${getBarColor()}`}
                        style={{ width: `${fillPct}%` }}
                    />
                </div>
            )}

            {/* Stage bars: p_offer × p_view × p_accept */}
            {(stage_probs.p_offer != null || stage_probs.p_view != null || stage_probs.p_accept != null) && (
                <div className="space-y-1.5">
                    {[
                        { label: 'Offer sent', value: stage_probs.p_offer },
                        { label: 'Viewed', value: stage_probs.p_view },
                        { label: 'Accepted', value: stage_probs.p_accept },
                    ].map(({ label, value }) => (
                        value != null && (
                            <div key={label} className="flex items-center gap-2">
                                <span className="text-xs text-hc-charcoal-text w-20 flex-shrink-0">{label}</span>
                                <div className="flex-1 h-1 bg-hc-industrial-charcoal rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-hc-command-gold/70 rounded-full"
                                        style={{ width: `${Math.round(value * 100)}%` }}
                                    />
                                </div>
                                <span className="text-xs text-hc-charcoal-text w-8 text-right">
                                    {Math.round(value * 100)}%
                                </span>
                            </div>
                        )
                    ))}
                </div>
            )}

            {/* Confidence indicator */}
            <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${confidence >= 0.5 ? 'bg-hc-success' :
                    confidence >= 0.35 ? 'bg-hc-warning' : 'bg-hc-danger'
                    }`} />
                <span className="text-xs text-hc-charcoal-text">Confidence {confPct}%</span>
            </div>

            {/* Top factors */}
            {top_factors.length > 0 && (
                <div className="space-y-1">
                    {top_factors.slice(0, 3).map((f, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <span className="text-xs text-hc-charcoal-text">{f.label}</span>
                            <span className={`text-xs font-medium ${f.direction === 'up' ? 'text-hc-success' : 'text-hc-danger'}`}>
                                {f.direction === 'up' ? '↑' : '↓'} {Math.round(f.value * 100)}%
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
