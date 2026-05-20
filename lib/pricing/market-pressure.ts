import type { PriceInputs } from '@/lib/pricing/engine';

export type CorridorHeatBand = NonNullable<PriceInputs['corridorHeatBand']>;

export interface DemandSignalRow {
    demand_pressure?: number | string | null;
    surge_active?: boolean | null;
    surge_multiplier?: number | string | null;
    demand_level?: string | null;
}

export interface SupplySnapshotRow {
    supply_count?: number | string | null;
    available_count?: number | string | null;
    demand_pressure?: number | string | null;
}

export interface SupplyAlertRow {
    id?: string | number | null;
    city?: string | null;
    state_code?: string | null;
    corridor_id?: string | null;
    alert_type?: string | null;
    available_count?: number | string | null;
    message?: string | null;
    expires_at?: string | null;
}

export interface MarketPricingSignals {
    demand_pressure: number;
    surge_active: boolean;
    surge_multiplier: number;
    supply_count: number | null;
    available_count: number | null;
    supply_alert_count: number;
    supply_alerts: Array<{
        id: string;
        label: string;
        message: string;
        alert_type: string | null;
        available_count: number | null;
    }>;
    corridor_heat_band: CorridorHeatBand;
    pressure_label: 'normal' | 'tight' | 'surging' | 'critical';
}

const HEAT_RANK: Record<CorridorHeatBand, number> = {
    cold: 0,
    balanced: 1,
    warm: 2,
    hot: 3,
    critical: 4,
};

function toFiniteNumber(value: unknown, fallback = 0): number {
    const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value ?? ''));
    return Number.isFinite(numeric) ? numeric : fallback;
}

function chooseHotterHeatBand(current: CorridorHeatBand, next: CorridorHeatBand): CorridorHeatBand {
    return HEAT_RANK[next] > HEAT_RANK[current] ? next : current;
}

export function heatBandFromMarketPressure(input: {
    baseHeatBand?: CorridorHeatBand;
    demandPressure?: number;
    surgeActive?: boolean;
    surgeMultiplier?: number;
    demandLevel?: string | null;
}): CorridorHeatBand {
    let heat: CorridorHeatBand = input.baseHeatBand ?? 'balanced';
    const demandPressure = Math.max(0, input.demandPressure ?? 0);
    const surgeMultiplier = Math.max(1, input.surgeMultiplier ?? 1);
    const demandLevel = (input.demandLevel ?? '').toLowerCase();

    if (demandLevel === 'high') heat = chooseHotterHeatBand(heat, 'warm');
    if (demandLevel === 'extreme') heat = chooseHotterHeatBand(heat, 'hot');
    if (demandPressure >= 0.35) heat = chooseHotterHeatBand(heat, 'warm');
    if (demandPressure >= 0.55) heat = chooseHotterHeatBand(heat, 'hot');
    if (demandPressure >= 0.75) heat = chooseHotterHeatBand(heat, 'critical');
    if (input.surgeActive || surgeMultiplier >= 1.15) heat = chooseHotterHeatBand(heat, 'hot');
    if (surgeMultiplier >= 1.3) heat = chooseHotterHeatBand(heat, 'critical');

    return heat;
}

export function normalizeSupplyAlerts(rows: SupplyAlertRow[], marketKey?: string): MarketPricingSignals['supply_alerts'] {
    const normalizedKey = (marketKey ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

    return rows
        .filter((row) => {
            const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : null;
            if (expiresAt && expiresAt <= Date.now()) return false;
            if (!normalizedKey) return true;
            const haystack = [row.city, row.state_code, row.corridor_id, row.message]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, ' ');
            const normalizedHaystack = haystack.trim();
            return Boolean(normalizedHaystack) && (normalizedHaystack.includes(normalizedKey) || normalizedKey.includes(normalizedHaystack));
        })
        .slice(0, 3)
        .map((row, index) => ({
            id: String(row.id ?? `supply-alert-${index}`),
            label: [row.city, row.state_code].filter(Boolean).join(', ') || row.corridor_id || 'Market signal',
            message: row.message ?? 'Active supply pressure signal for this market.',
            alert_type: row.alert_type ?? null,
            available_count: row.available_count == null ? null : toFiniteNumber(row.available_count, 0),
        }));
}

export function buildMarketPricingSignals(input: {
    baseHeatBand?: CorridorHeatBand;
    demandSignal?: DemandSignalRow | null;
    supplySnapshot?: SupplySnapshotRow | null;
    supplyAlerts?: SupplyAlertRow[];
    marketKey?: string;
}): MarketPricingSignals {
    const demandPressure = Math.max(
        toFiniteNumber(input.demandSignal?.demand_pressure, 0),
        toFiniteNumber(input.supplySnapshot?.demand_pressure, 0),
    );
    const surgeMultiplier = Math.max(1, toFiniteNumber(input.demandSignal?.surge_multiplier, 1));
    const surgeActive = Boolean(input.demandSignal?.surge_active) || surgeMultiplier > 1.05;
    const alerts = normalizeSupplyAlerts(input.supplyAlerts ?? [], input.marketKey);
    const heat = heatBandFromMarketPressure({
        baseHeatBand: input.baseHeatBand,
        demandPressure,
        surgeActive,
        surgeMultiplier,
        demandLevel: input.demandSignal?.demand_level,
    });

    const pressureLabel: MarketPricingSignals['pressure_label'] =
        heat === 'critical' ? 'critical' : heat === 'hot' ? 'surging' : heat === 'warm' ? 'tight' : 'normal';

    return {
        demand_pressure: Number(demandPressure.toFixed(3)),
        surge_active: surgeActive,
        surge_multiplier: Number(surgeMultiplier.toFixed(2)),
        supply_count: input.supplySnapshot?.supply_count == null ? null : toFiniteNumber(input.supplySnapshot.supply_count, 0),
        available_count: input.supplySnapshot?.available_count == null ? null : toFiniteNumber(input.supplySnapshot.available_count, 0),
        supply_alert_count: alerts.length,
        supply_alerts: alerts,
        corridor_heat_band: heat,
        pressure_label: pressureLabel,
    };
}
