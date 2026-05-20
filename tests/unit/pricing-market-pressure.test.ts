import { describe, expect, it } from 'vitest';
import {
    buildMarketPricingSignals,
    heatBandFromMarketPressure,
    normalizeSupplyAlerts,
} from '@/lib/pricing/market-pressure';

describe('pricing market pressure signals', () => {
    it('promotes corridor heat from demand pressure and surge', () => {
        expect(heatBandFromMarketPressure({ baseHeatBand: 'balanced', demandPressure: 0.36 })).toBe('warm');
        expect(heatBandFromMarketPressure({ baseHeatBand: 'warm', surgeActive: true, surgeMultiplier: 1.18 })).toBe('hot');
        expect(heatBandFromMarketPressure({ baseHeatBand: 'hot', demandPressure: 0.8 })).toBe('critical');
    });

    it('filters expired and unrelated supply alerts', () => {
        const alerts = normalizeSupplyAlerts([
            {
                id: 'tx',
                city: 'Houston',
                state_code: 'TX',
                message: 'Houston escort capacity is tight.',
                expires_at: new Date(Date.now() + 60_000).toISOString(),
            },
            {
                id: 'old',
                city: 'Dallas',
                state_code: 'TX',
                message: 'Expired signal',
                expires_at: new Date(Date.now() - 60_000).toISOString(),
            },
            {
                id: 'ca',
                city: 'Los Angeles',
                state_code: 'CA',
                message: 'West coast pressure',
            },
        ], 'Houston TX');

        expect(alerts).toHaveLength(1);
        expect(alerts[0]).toMatchObject({
            id: 'tx',
            label: 'Houston, TX',
        });
    });

    it('builds a broker-safe market signal payload', () => {
        const signals = buildMarketPricingSignals({
            baseHeatBand: 'balanced',
            demandSignal: {
                demand_pressure: '0.62',
                surge_active: true,
                surge_multiplier: '1.24',
                demand_level: 'high',
            },
            supplySnapshot: {
                supply_count: 9,
                available_count: 3,
                demand_pressure: '0.58',
            },
            supplyAlerts: [
                { id: 'alert-1', city: 'Odessa', state_code: 'TX', available_count: 3, message: 'Oilfield escort supply pressure.' },
            ],
            marketKey: 'Odessa TX',
        });

        expect(signals).toMatchObject({
            demand_pressure: 0.62,
            surge_active: true,
            surge_multiplier: 1.24,
            supply_count: 9,
            available_count: 3,
            supply_alert_count: 1,
            corridor_heat_band: 'hot',
            pressure_label: 'surging',
        });
    });
});
