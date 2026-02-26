import { supabaseServer } from '@/lib/supabase/server';
import { AlertTriangle, Flame, TrendingUp, CheckCircle } from 'lucide-react';

interface ScarcityData {
    forecast_band: 'surplus' | 'balanced' | 'tightening' | 'shortage' | 'critical';
    shortage_probability: number;
    future_shortage_score: number;
    trigger_escort_recruitment: boolean;
    increase_marketplace_vis: boolean;
    seo_priority_boost: boolean;
}

interface Props {
    geoKey: string;                       // e.g. "texas" or "houston-texas"
    geoType: 'state' | 'city' | 'corridor';
    className?: string;
}

const BAND_CONFIG = {
    surplus: null,                         // hide
    balanced: null,                        // hide
    tightening: {
        icon: TrendingUp,
        bg: 'bg-yellow-500/10 border-yellow-500/30',
        iconColor: 'text-yellow-400',
        text: 'text-yellow-100',
        label: 'Demand Rising',
        message: 'Escort demand in this area is trending upward. Supply may tighten in the next 2 weeks.',
    },
    shortage: {
        icon: AlertTriangle,
        bg: 'bg-orange-500/10 border-orange-500/30',
        iconColor: 'text-orange-400',
        text: 'text-orange-100',
        label: '⚠ Escort Shortage Alert',
        message: 'This market is experiencing an escort shortage. Brokers in this region have reported difficulty finding qualified pilot cars.',
    },
    critical: {
        icon: Flame,
        bg: 'bg-red-500/10 border-red-500/30',
        iconColor: 'text-red-400',
        text: 'text-red-100',
        label: '🔴 Critical Escort Shortage',
        message: 'Critically low escort availability. Loads in this corridor are experiencing multi-day fill delays.',
    },
};

export default async function ScarcityBanner({ geoKey, geoType, className = '' }: Props) {
    const supabase = supabaseServer();

    const { data, error } = await supabase
        .from('scarcity_forecast')
        .select('forecast_band, shortage_probability, future_shortage_score, trigger_escort_recruitment, increase_marketplace_vis, seo_priority_boost')
        .eq('geo_key', geoKey)
        .eq('geo_type', geoType)
        .gt('valid_until', new Date().toISOString())
        .order('computed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error || !data) return null;

    const scarcity = data as ScarcityData;
    const config = BAND_CONFIG[scarcity.forecast_band];

    if (!config) return null;   // surplus / balanced — nothing to show

    const Icon = config.icon;
    const probabilityPct = Math.round(scarcity.shortage_probability * 100);

    return (
        <div className={`rounded-xl border px-5 py-4 ${config.bg} ${className}`}>
            <div className="flex gap-3">
                <div className={`mt-0.5 ${config.iconColor}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <p className={`text-sm font-semibold ${config.text}`}>{config.label}</p>
                    <p className={`text-sm mt-1 ${config.text} opacity-80`}>{config.message}</p>

                    {/* Shortage probability bar */}
                    {scarcity.shortage_probability > 0.3 && (
                        <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1 opacity-70" style={{ color: 'inherit' }}>
                                <span>Shortage probability (14-day)</span>
                                <span className="font-semibold">{probabilityPct}%</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${probabilityPct}%`,
                                        background: scarcity.forecast_band === 'critical'
                                            ? '#ef4444'
                                            : scarcity.forecast_band === 'shortage'
                                                ? '#f97316'
                                                : '#eab308',
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* CTA: If recruitment is flagged, show join prompt */}
                    {scarcity.trigger_escort_recruitment && (
                        <div className="mt-3">
                            <a
                                href="/join?utm_source=scarcity_banner"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                            >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Escorts: This area needs you — join Haul Command
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
