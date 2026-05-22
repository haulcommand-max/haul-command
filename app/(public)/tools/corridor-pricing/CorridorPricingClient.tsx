'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  calculateCorridorPricing,
  latestByCorridor,
  type CorridorPricingRecord,
} from '@/lib/tools/corridorPricing';

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function numberValue(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function labelFromSlug(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function CorridorPricingClient({ records }: { records: CorridorPricingRecord[] }) {
  const corridors = useMemo(() => latestByCorridor(records), [records]);
  const [selectedSlug, setSelectedSlug] = useState(corridors[0]?.slug ?? 'manual');
  const selected = corridors.find((corridor) => corridor.slug === selectedSlug)?.current ?? null;
  const manualMode = !selected;

  const [manualName, setManualName] = useState('Manual corridor');
  const [routeMiles, setRouteMiles] = useState('650');
  const [escortVehicles, setEscortVehicles] = useState('2');
  const [baseRate, setBaseRate] = useState('2.25');
  const [floorRate, setFloorRate] = useState('1.75');
  const [ceilingRate, setCeilingRate] = useState('3.25');
  const [volumeIndex, setVolumeIndex] = useState('50');
  const [deadheadPercent, setDeadheadPercent] = useState('15');
  const [waitHours, setWaitHours] = useState('4');
  const [waitHourlyRate, setWaitHourlyRate] = useState('85');

  const effectiveBase = selected?.avg_rate_per_mile ?? numberValue(baseRate, 2.25);
  const effectiveFloor = selected?.min_rate_per_mile ?? numberValue(floorRate, 1.75);
  const effectiveCeiling = selected?.max_rate_per_mile ?? numberValue(ceilingRate, 3.25);
  const effectiveVolume = selected?.volume_index ?? numberValue(volumeIndex, 50);

  const result = useMemo(
    () =>
      calculateCorridorPricing({
        routeMiles: numberValue(routeMiles, 650),
        escortVehicles: numberValue(escortVehicles, 2),
        baseRatePerMile: effectiveBase,
        floorRatePerMile: effectiveFloor,
        ceilingRatePerMile: effectiveCeiling,
        volumeIndex: effectiveVolume,
        deadheadPercent: numberValue(deadheadPercent, 15),
        waitHours: numberValue(waitHours, 4),
        waitHourlyRate: numberValue(waitHourlyRate, 85),
      }),
    [
      deadheadPercent,
      effectiveBase,
      effectiveCeiling,
      effectiveFloor,
      effectiveVolume,
      escortVehicles,
      routeMiles,
      waitHourlyRate,
      waitHours,
    ],
  );

  const currentName = selected ? labelFromSlug(selected.corridor_slug) : manualName || 'Manual corridor';

  return (
    <div data-hc-topic-hero="manual" className="min-h-screen bg-[#07110F] text-white">
      <section className="border-b border-emerald-400/10">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
            <Link href="/tools" className="hover:text-white">Tools</Link>
            <span>/</span>
            <span>Pricing</span>
          </div>
          <h1 className="max-w-4xl text-3xl font-black tracking-tight md:text-5xl">
            Corridor Pricing Estimator
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            Estimate pilot car lane pricing from stored corridor rate signals or manual quote inputs.
            Use this as a negotiation range, not a binding rate card.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-2xl font-black text-emerald-300">{corridors.length}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Stored corridors loaded</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-2xl font-black text-emerald-300">{result.billableMiles}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Billable miles modeled</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-2xl font-black text-emerald-300">{effectiveVolume}/100</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Volume index used</div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-white/10 bg-[#0D1B18] p-5">
          <h2 className="text-lg font-black">Pricing Inputs</h2>
          {corridors.length === 0 && (
            <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
              No stored corridor pricing rows loaded in this environment. Manual mode is active and
              only uses values you enter here.
            </div>
          )}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Corridor</span>
              {corridors.length > 0 ? (
                <select
                  value={selectedSlug}
                  onChange={(event) => setSelectedSlug(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#07110F] px-3 py-3 text-white outline-none focus:border-emerald-300"
                >
                  {corridors.map((corridor) => (
                    <option key={corridor.slug} value={corridor.slug}>
                      {labelFromSlug(corridor.slug)}
                    </option>
                  ))}
                  <option value="manual">Manual corridor</option>
                </select>
              ) : (
                <input
                  value={manualName}
                  onChange={(event) => setManualName(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#07110F] px-3 py-3 text-white outline-none focus:border-emerald-300"
                />
              )}
            </label>
            {[
              ['Route miles', routeMiles, setRouteMiles],
              ['Escort vehicles', escortVehicles, setEscortVehicles],
              ['Deadhead %', deadheadPercent, setDeadheadPercent],
              ['Wait hours', waitHours, setWaitHours],
              ['Wait hourly rate', waitHourlyRate, setWaitHourlyRate],
            ].map(([label, value, setter]) => (
              <label key={label as string} className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label as string}</span>
                <input
                  type="number"
                  min={0}
                  value={value as string}
                  onChange={(event) => (setter as (value: string) => void)(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#07110F] px-3 py-3 text-white outline-none focus:border-emerald-300"
                />
              </label>
            ))}
          </div>

          {manualMode && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                ['Floor rate / mi', floorRate, setFloorRate],
                ['Base rate / mi', baseRate, setBaseRate],
                ['Ceiling rate / mi', ceilingRate, setCeilingRate],
                ['Volume index', volumeIndex, setVolumeIndex],
              ].map(([label, value, setter]) => (
                <label key={label as string} className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label as string}</span>
                  <input
                    type="number"
                    min={0}
                    value={value as string}
                    onChange={(event) => (setter as (value: string) => void)(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#07110F] px-3 py-3 text-white outline-none focus:border-emerald-300"
                  />
                </label>
              ))}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-5">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Planning midpoint</div>
            <div className="mt-2 text-4xl font-black">{money(result.midpoint)}</div>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {currentName}: {money(result.floor)} floor to {money(result.ceiling)} ceiling after
              billable miles, escort count, demand pressure, and wait time.
            </p>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-white/10 bg-[#0D1B18] p-5">
            <h2 className="text-lg font-black">Range Breakdown</h2>
            <div className="mt-4 grid gap-3">
              {[
                ['Floor', money(result.floor)],
                ['Midpoint', money(result.midpoint)],
                ['Ceiling', money(result.ceiling)],
                ['Wait charge', money(result.waitCharge)],
                ['Demand multiplier', `${result.demandMultiplier.toFixed(2)}x`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#07110F] p-3">
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className="font-black">{value}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-white/10 bg-[#0D1B18] p-5">
            <h2 className="text-lg font-black">Next Actions</h2>
            <div className="mt-4 grid gap-3">
              <Link href="/available-now" className="rounded-xl border border-white/10 bg-[#07110F] px-4 py-3 text-sm font-bold text-white hover:border-emerald-300">Find escorts now</Link>
              <Link href="/loads/post" className="rounded-xl border border-white/10 bg-[#07110F] px-4 py-3 text-sm font-bold text-white hover:border-emerald-300">Post a load</Link>
              <Link href="/tools/pilot-car-rate-calculator" className="rounded-xl border border-white/10 bg-[#07110F] px-4 py-3 text-sm font-bold text-white hover:border-emerald-300">Check pilot car rate</Link>
            </div>
          </section>
        </aside>
      </main>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="rounded-2xl border border-white/10 bg-[#0D1B18] p-5">
          <h2 className="text-lg font-black">Stored Corridor Signals</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(corridors.length > 0 ? corridors : [{ slug: 'manual', current: null, previous: null }]).map((corridor) => (
              <div key={corridor.slug} className="rounded-xl border border-white/10 bg-[#07110F] p-4">
                <div className="font-black">{corridor.current ? labelFromSlug(corridor.slug) : currentName}</div>
                <div className="mt-2 text-sm text-slate-400">
                  {corridor.current
                    ? `$${corridor.current.min_rate_per_mile?.toFixed(2) ?? 'verify'} - $${corridor.current.max_rate_per_mile?.toFixed(2) ?? 'verify'} / mi, volume ${corridor.current.volume_index ?? 'verify'}/100`
                    : 'Manual mode: no stored lane pricing rows loaded.'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
