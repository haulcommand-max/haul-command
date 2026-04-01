'use client';

interface HardFillPanelProps {
    label: 'Low' | 'Medium' | 'High' | 'Critical';
    score: number;
    load_id: string;
    top_reasons?: string[];
    recommended_fixes?: Array<{ action: string; label: string }>;
}

const LABEL_STYLES: Record<string, string> = {
    Low: 'bg-hc-success/20 text-hc-success border-hc-success/30',
    Medium: 'bg-hc-warning/20 text-hc-warning border-hc-warning/30',
    High: 'bg-hc-primary-gold/20 text-hc-primary-gold border-hc-primary-gold/30',
    Critical: 'bg-hc-danger/20 text-hc-danger border-hc-danger/30',
};

export function HardFillPanel({ label, score, load_id, top_reasons = [], recommended_fixes = [] }: HardFillPanelProps) {
    const pct = Math.round(score * 100);

    async function handleFix(action: string) {
        // Actions: 'raise_rate', 'expand_radius', 'widen_window'
        // These call broker-facing RPCs or navigate to load edit
        if (action === 'widen_window') {
            window.location.href = `/loads/${load_id}/edit?hint=widen_window`;
        } else if (action === 'raise_rate') {
            window.location.href = `/loads/${load_id}/edit?hint=raise_rate`;
        } else if (action === 'expand_radius') {
            // Trigger match-generate with expanded radius
            await fetch('/api/loads/boost-radius', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ load_id }),
            });
        }
    }

    return (
        <div className="rounded-lg border border-hc-industrial-charcoal bg-hc-command-black/50 p-3 space-y-2">
            <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${LABEL_STYLES[label] ?? ''}`}>
                    {label} Fill Risk
                </span>
                <span className="text-xs text-hc-charcoal-text">{pct}% risk score</span>
            </div>

            {top_reasons.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    {top_reasons.slice(0, 3).map(r => (
                        <span key={r} className="text-xs text-hc-charcoal-text px-1.5 py-0.5 bg-hc-industrial-charcoal rounded">
                            {r}
                        </span>
                    ))}
                </div>
            )}

            {recommended_fixes.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    {recommended_fixes.map(fix => (
                        <button
                            key={fix.action}
                            onClick={() => handleFix(fix.action)}
                            className="text-xs px-2 py-1 bg-hc-primary-gold/20 hover:bg-hc-primary-gold/30 text-hc-primary-gold rounded border border-hc-primary-gold/30 transition-colors"
                        >
                            {fix.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
