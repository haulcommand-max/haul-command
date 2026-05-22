'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  calculateTotalTripCost,
  totalTripComplexityLabels,
  totalTripRegionLabels,
  type TotalTripCostInput,
  type TripComplexity,
  type TripCostBenchmarks,
  type TripCostRegion,
} from '@/lib/tools/totalTripCost';

const regions = Object.entries(totalTripRegionLabels) as [TripCostRegion, string][];
const complexities = Object.entries(totalTripComplexityLabels) as [TripComplexity, string][];

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function NumberField({
  label,
  value,
  min = 0,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3 text-white outline-none focus:border-[#F1A91B]"
      />
    </label>
  );
}

export function TotalTripCostCalculatorClient({ benchmarks }: { benchmarks: TripCostBenchmarks }) {
  const [state, setState] = useState<Omit<TotalTripCostInput, 'benchmarks'>>({
    miles: 1200,
    jurisdictions: 4,
    travelDays: 3,
    escortCount: 2,
    permitAverage: 350,
    fuelMpg: 5.5,
    dieselPrice: 4.25,
    tolls: 250,
    overnightNights: 2,
    overnightRate: 140,
    waitHours: 4,
    policeHours: 0,
    routeSurvey: false,
    highPole: true,
    region: 'texas_gulf',
    complexity: 'overheight',
  });

  const result = useMemo(
    () => calculateTotalTripCost({ ...state, benchmarks }),
    [benchmarks, state],
  );

  const setNumber = (key: keyof Omit<TotalTripCostInput, 'benchmarks' | 'region' | 'complexity' | 'routeSurvey' | 'highPole'>) =>
    (value: number) => setState((current) => ({ ...current, [key]: value }));

  const costRows = [
    ['Permits', result.permitCost],
    ['Pilot cars / escorts', result.escortCost],
    ['High-pole car', result.highPoleCost],
    ['Fuel', result.fuelCost],
    ['Tolls / access fees', result.tollCost],
    ['Overnight / per diem', result.overnightCost],
    ['Wait / detention', result.waitCost],
    ['Police escort', result.policeCost],
    ['Route survey', result.routeSurveyCost],
    ['Planning contingency', result.contingency],
  ];

  return (
    <div data-hc-topic-hero="manual" className="min-h-screen bg-[#0B0F14] text-white">
      <section className="border-b border-[#F1A91B]/10 bg-[#0B0F14]">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#F1A91B]">
            <Link href="/tools" className="hover:text-white">Tools</Link>
            <span>/</span>
            <span>Cost Intelligence</span>
          </div>
          <h1 className="max-w-4xl text-3xl font-black tracking-tight md:text-5xl">
            Total Trip Cost Calculator
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            Estimate the full planning cost of an oversize move: permits, escorts, fuel, tolls,
            lodging, police escort, route survey, waiting time, and contingency. Use this for
            budgeting, then confirm final costs with the issuing authorities and hired operators.
          </p>
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_390px]">
        <section className="rounded-2xl border border-white/10 bg-[#111827] p-5">
          <h2 className="text-lg font-black">Move Inputs</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <NumberField label="Route miles" value={state.miles} min={1} max={5000} onChange={setNumber('miles')} />
            <NumberField label="Travel days" value={state.travelDays} min={1} max={30} onChange={setNumber('travelDays')} />
            <NumberField label="Jurisdictions / permits" value={state.jurisdictions} min={1} max={25} onChange={setNumber('jurisdictions')} />
            <NumberField label="Average permit cost" value={state.permitAverage} min={0} max={5000} onChange={setNumber('permitAverage')} />
            <NumberField label="Escort vehicles" value={state.escortCount} min={0} max={8} onChange={setNumber('escortCount')} />
            <NumberField label="Wait / detention hours" value={state.waitHours} min={0} max={96} onChange={setNumber('waitHours')} />
            <NumberField label="Truck fuel MPG" value={state.fuelMpg} min={2} max={12} step={0.1} onChange={setNumber('fuelMpg')} />
            <NumberField label="Diesel price / gallon" value={state.dieselPrice} min={1} max={12} step={0.01} onChange={setNumber('dieselPrice')} />
            <NumberField label="Tolls / access fees" value={state.tolls} min={0} max={10000} onChange={setNumber('tolls')} />
            <NumberField label="Overnight nights" value={state.overnightNights} min={0} max={30} onChange={setNumber('overnightNights')} />
            <NumberField label="Overnight rate" value={state.overnightRate} min={0} max={500} onChange={setNumber('overnightRate')} />
            <NumberField label="Police escort hours" value={state.policeHours} min={0} max={96} onChange={setNumber('policeHours')} />
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Region</span>
              <select
                value={state.region}
                onChange={(event) => setState((current) => ({ ...current, region: event.target.value as TripCostRegion }))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3 text-white outline-none focus:border-[#F1A91B]"
              >
                {regions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Move complexity</span>
              <select
                value={state.complexity}
                onChange={(event) => setState((current) => ({ ...current, complexity: event.target.value as TripComplexity }))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3 text-white outline-none focus:border-[#F1A91B]"
              >
                {complexities.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0B0F14] p-4">
              <input
                type="checkbox"
                checked={state.highPole}
                onChange={(event) => setState((current) => ({ ...current, highPole: event.target.checked }))}
                className="h-5 w-5 accent-[#F1A91B]"
              />
              <span>
                <span className="block text-sm font-bold">Include high-pole car</span>
                <span className="text-xs text-slate-400">Use for overheight risk or permit language.</span>
              </span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0B0F14] p-4">
              <input
                type="checkbox"
                checked={state.routeSurvey}
                onChange={(event) => setState((current) => ({ ...current, routeSurvey: event.target.checked }))}
                className="h-5 w-5 accent-[#F1A91B]"
              />
              <span>
                <span className="block text-sm font-bold">Include route survey</span>
                <span className="text-xs text-slate-400">Common for superloads and unfamiliar corridors.</span>
              </span>
            </label>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#F1A91B]/20 bg-[#111827] p-5">
            <h2 className="text-lg font-black">Estimated Cost Range</h2>
            <div className="mt-4 grid gap-3">
              <div className="rounded-xl bg-[#0B0F14] p-4">
                <div className="text-xs text-slate-500">Planning midpoint</div>
                <div className="text-4xl font-black text-[#F1A91B]">{money(result.midEstimate)}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#0B0F14] p-4">
                  <div className="text-xs text-slate-500">Low</div>
                  <div className="text-2xl font-black">{money(result.lowEstimate)}</div>
                </div>
                <div className="rounded-xl bg-[#0B0F14] p-4">
                  <div className="text-xs text-slate-500">High</div>
                  <div className="text-2xl font-black">{money(result.highEstimate)}</div>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0B0F14] p-4 text-sm text-slate-300">
                <div><strong>{result.travelDays}</strong> travel days</div>
                <div><strong>{money(result.perMileMid)}</strong> midpoint cost per mile</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
            <h2 className="text-lg font-black">Cost Breakdown</h2>
            <div className="mt-4 space-y-3">
              {costRows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-white/5 pb-2 text-sm">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-bold">{money(value as number)}</span>
                </div>
              ))}
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5">
              <h2 className="text-sm font-black uppercase tracking-wider text-amber-200">Planning Flags</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-100">
                {result.warnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-[#F1A91B]/20 bg-[#111827] p-5">
            <h2 className="text-lg font-black">Next Actions</h2>
            <div className="mt-4 grid gap-3">
              <Link href="/quote" className="rounded-xl bg-[#F1A91B] px-4 py-3 text-center text-sm font-black text-black">
                Request a move quote
              </Link>
              <Link href="/directory?category=pilot-car" className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-white hover:border-[#F1A91B]">
                Find pilot car operators
              </Link>
              <Link href="/tools/pilot-car-rate-calculator" className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-white hover:border-[#F1A91B]">
                Check pilot car rates
              </Link>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
