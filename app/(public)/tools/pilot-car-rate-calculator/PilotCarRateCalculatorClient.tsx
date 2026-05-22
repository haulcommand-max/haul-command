'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  calculatePilotCarRate,
  pilotCarDifficultyLabels,
  pilotCarRegionLabels,
  type PilotCarDifficulty,
  type PilotCarRegion,
} from '@/lib/tools/pilotCarRate';

const regions = Object.entries(pilotCarRegionLabels) as [PilotCarRegion, string][];
const difficulties = Object.entries(pilotCarDifficultyLabels) as [PilotCarDifficulty, string][];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function PilotCarRateCalculatorClient() {
  const [miles, setMiles] = useState(650);
  const [escortCount, setEscortCount] = useState(2);
  const [waitHours, setWaitHours] = useState(4);
  const [overnightNights, setOvernightNights] = useState(1);
  const [region, setRegion] = useState<PilotCarRegion>('texas_gulf');
  const [difficulty, setDifficulty] = useState<PilotCarDifficulty>('overwide');
  const [highPole, setHighPole] = useState(false);

  const result = useMemo(
    () =>
      calculatePilotCarRate({
        miles,
        escortCount,
        waitHours,
        overnightNights,
        region,
        difficulty,
        highPole,
      }),
    [difficulty, escortCount, highPole, miles, overnightNights, region, waitHours],
  );

  const rows = [
    ['Escort labor', result.escortLabor],
    ['Mileage charge', result.mileageCharge],
    ['Wait / detention', result.waitCharge],
    ['High-pole add-on', result.highPoleCharge],
    ['Overnight / per diem', result.overnightCharge],
    ['Fuel surcharge estimate', result.fuelSurcharge],
  ];

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      <section className="border-b border-[#F1A91B]/10 bg-[#0B0F14]">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#F1A91B]">
            <Link href="/tools" className="hover:text-white">Tools</Link>
            <span>/</span>
            <span>Rates</span>
          </div>
          <h1 className="max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
            Pilot Car Rate Calculator
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            Estimate pilot car and escort pricing from route miles, escort count, wait time,
            high-pole needs, and regional rate pressure. This is a planning calculator,
            not a binding quote; final rates depend on operator availability, permit windows,
            route restrictions, and authority requirements.
          </p>
        </div>
      </section>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-white/10 bg-[#111827] p-5">
          <h2 className="text-lg font-black">Move Details</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Route miles</span>
              <input
                type="number"
                min={1}
                value={miles}
                onChange={(event) => setMiles(Number(event.target.value))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3 text-white outline-none focus:border-[#F1A91B]"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Escort vehicles</span>
              <input
                type="number"
                min={1}
                max={8}
                value={escortCount}
                onChange={(event) => setEscortCount(Number(event.target.value))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3 text-white outline-none focus:border-[#F1A91B]"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Region</span>
              <select
                value={region}
                onChange={(event) => setRegion(event.target.value as PilotCarRegion)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3 text-white outline-none focus:border-[#F1A91B]"
              >
                {regions.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Load difficulty</span>
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as PilotCarDifficulty)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3 text-white outline-none focus:border-[#F1A91B]"
              >
                {difficulties.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Wait / detention hours</span>
              <input
                type="number"
                min={0}
                value={waitHours}
                onChange={(event) => setWaitHours(Number(event.target.value))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3 text-white outline-none focus:border-[#F1A91B]"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overnight nights</span>
              <input
                type="number"
                min={0}
                value={overnightNights}
                onChange={(event) => setOvernightNights(Number(event.target.value))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3 text-white outline-none focus:border-[#F1A91B]"
              />
            </label>
          </div>

          <label className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 bg-[#0B0F14] p-4">
            <input
              type="checkbox"
              checked={highPole}
              onChange={(event) => setHighPole(event.target.checked)}
              className="h-5 w-5 accent-[#F1A91B]"
            />
            <span>
              <span className="block text-sm font-bold">Include high-pole / height-pole car</span>
              <span className="text-xs text-slate-400">Use when overheight risk or permit language requires it.</span>
            </span>
          </label>

          <div className="mt-6 rounded-xl border border-[#F1A91B]/20 bg-[#0B0F14] p-4">
            <h3 className="text-sm font-black text-[#F1A91B]">Estimate Range</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <div className="text-xs text-slate-500">Low</div>
                <div className="text-2xl font-black">{formatCurrency(result.lowEstimate)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Planning Midpoint</div>
                <div className="text-2xl font-black text-[#F1A91B]">{formatCurrency(result.midEstimate)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">High</div>
                <div className="text-2xl font-black">{formatCurrency(result.highEstimate)}</div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
            <h2 className="text-lg font-black">Rate Breakdown</h2>
            <div className="mt-4 space-y-3">
              {rows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-white/5 pb-2 text-sm">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-bold">{formatCurrency(value as number)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-[#0B0F14] p-4 text-sm text-slate-300">
              <div><strong>{result.travelDays}</strong> travel day estimate</div>
              <div><strong>{result.billableMiles}</strong> billable miles</div>
              <div><strong>{formatCurrency(result.perEscortMid)}</strong> midpoint per escort</div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#F1A91B]/20 bg-[#111827] p-5">
            <h2 className="text-lg font-black">Next Actions</h2>
            <div className="mt-4 grid gap-3">
              <Link href="/directory?category=pilot-car" className="rounded-xl bg-[#F1A91B] px-4 py-3 text-center text-sm font-black text-black">
                Find pilot car operators
              </Link>
              <Link href="/quote" className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-white hover:border-[#F1A91B]">
                Request a move quote
              </Link>
              <Link href="/tools/total-trip-cost-calculator" className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-white hover:border-[#F1A91B]">
                Add permits and fuel
              </Link>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
