import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { TotalTripCostCalculatorClient } from './TotalTripCostCalculatorClient';
import type { TripCostBenchmarks } from '@/lib/tools/totalTripCost';

export const metadata: Metadata = {
  title: 'Total Trip Cost Calculator - Oversize Load Move Budget | Haul Command',
  description:
    'Estimate the complete cost of an oversize load move: permits, pilot cars, fuel, tolls, overnight stops, waiting time, police escort, route survey, and contingency.',
  alternates: { canonical: 'https://www.haulcommand.com/tools/total-trip-cost-calculator' },
};

export const dynamic = 'force-dynamic';

type RateRow = {
  surface_key: string;
  rate_mid: number | null;
};

function benchmarkValue(rows: RateRow[], key: string, fallback: number) {
  const row = rows.find((item) => item.surface_key === key);
  return typeof row?.rate_mid === 'number' && Number.isFinite(row.rate_mid) ? row.rate_mid : fallback;
}

export default async function TotalTripCostPage() {
  const supabase = createClient();

  const { data: rates } = await supabase
    .from('hc_rates_public')
    .select('surface_key, rate_mid')
    .in('surface_key', [
      'us_pilot_car_daily',
      'us_height_pole_rate',
      'us_police_escort_rate',
      'us_route_survey_rate',
      'us_wait_time_rate',
    ])
    .limit(10);

  const rateRows = (rates ?? []) as RateRow[];
  const benchmarks: TripCostBenchmarks = {
    pilotCarDaily: benchmarkValue(rateRows, 'us_pilot_car_daily', 450),
    heightPoleDaily: benchmarkValue(rateRows, 'us_height_pole_rate', 625),
    policeHourly: benchmarkValue(rateRows, 'us_police_escort_rate', 150),
    waitHourly: benchmarkValue(rateRows, 'us_wait_time_rate', 85),
    routeSurveyFlat: benchmarkValue(rateRows, 'us_route_survey_rate', 900),
  };

  return <TotalTripCostCalculatorClient benchmarks={benchmarks} />;
}
