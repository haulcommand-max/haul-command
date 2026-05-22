'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  STATE_WEIGHT_LIMITS,
  calculateFederalBridgeLimit,
  evaluateAxleWeight,
  getStateWeightLimit,
} from '@/lib/tools/axleWeight';

const AXLE_PRESETS = [
  { label: '5-axle tractor trailer', axleCount: 5, bridgeFeet: 51, grossWeight: 80000 },
  { label: '6-axle lowboy', axleCount: 6, bridgeFeet: 55, grossWeight: 96000 },
  { label: '7-axle heavy haul', axleCount: 7, bridgeFeet: 60, grossWeight: 110000 },
  { label: '9-axle superload', axleCount: 9, bridgeFeet: 70, grossWeight: 140000 },
];

export function AxleWeightCalculatorClient() {
  const [axleCount, setAxleCount] = useState(5);
  const [outerBridgeFeet, setOuterBridgeFeet] = useState(51);
  const [grossWeightLbs, setGrossWeightLbs] = useState(80000);
  const [stateCode, setStateCode] = useState('US');

  const state = getStateWeightLimit(stateCode);
  const result = useMemo(
    () =>
      evaluateAxleWeight({
        axleCount,
        outerBridgeFeet,
        grossWeightLbs,
        singleAxleMaxLbs: state.singleAxleLbs,
        tandemAxleMaxLbs: state.tandemAxleLbs,
        stateCode,
      }),
    [axleCount, grossWeightLbs, outerBridgeFeet, state, stateCode],
  );

  const statusColor = result.status === 'legal' ? '#86efac' : '#fca5a5';

  function applyPreset(preset: (typeof AXLE_PRESETS)[number]) {
    setAxleCount(preset.axleCount);
    setOuterBridgeFeet(preset.bridgeFeet);
    setGrossWeightLbs(preset.grossWeight);
  }

  return (
    <main className="min-h-screen bg-[#07090d] text-[#f0f2f5]" data-hc-topic-hero="manual">
      <section className="border-b border-[#131c28] bg-gradient-to-r from-[#0a1929] to-[#07090d] px-5 py-10 md:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#22c55e]">
              Free Tool / No Login Required
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black uppercase tracking-tight md:text-6xl">
              Axle Weight Calculator
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#8a9ab0] md:text-lg">
              Run a Federal Bridge Formula screen by axle count, outer bridge spacing, gross
              weight, and planning state before you quote, permit, or dispatch an oversize move.
            </p>
          </div>
          <div className="rounded-2xl border border-[#1e3048] bg-[#0f1a24] p-5">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-[#566880]">
              Result
            </div>
            <div className="mt-3 text-3xl font-black uppercase" style={{ color: statusColor }}>
              {result.status === 'legal' ? 'Planning Legal' : 'Over Limit'}
            </div>
            <p className="mt-3 text-sm leading-6 text-[#8a9ab0]">{result.summary}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8 lg:grid-cols-[420px_1fr] lg:px-12">
        <form className="rounded-2xl border border-[#1e3048] bg-[#0f1a24] p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Axles in group"
              value={axleCount}
              min={1}
              max={12}
              step={1}
              onChange={setAxleCount}
            />
            <NumberField
              label="Outer bridge feet"
              value={outerBridgeFeet}
              min={4}
              max={120}
              step={1}
              onChange={setOuterBridgeFeet}
            />
          </div>

          <div className="mt-4">
            <NumberField
              label="Actual gross weight"
              value={grossWeightLbs}
              min={10000}
              max={250000}
              step={500}
              onChange={setGrossWeightLbs}
            />
          </div>

          <div className="mt-4">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-[#566880]">
              Planning jurisdiction
            </label>
            <select
              value={stateCode}
              onChange={(event) => setStateCode(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#1e3048] bg-[#07090d] px-3 py-3 text-sm font-semibold text-white"
            >
              {STATE_WEIGHT_LIMITS.map((limit) => (
                <option key={limit.code} value={limit.code}>
                  {limit.name} ({limit.code})
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-5 text-[#566880]">{state.note}</p>
          </div>

          <div className="mt-6">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-[#566880]">
              Common presets
            </div>
            <div className="mt-3 grid gap-2">
              {AXLE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="rounded-xl border border-[#1e3048] bg-[#07090d] px-3 py-3 text-left text-sm font-bold text-white transition hover:border-[#22c55e]"
                >
                  {preset.label}
                  <span className="block text-xs font-medium text-[#566880]">
                    {preset.axleCount} axles / {preset.bridgeFeet} ft / {preset.grossWeight.toLocaleString()} lb
                  </span>
                </button>
              ))}
            </div>
          </div>
        </form>

        <div className="space-y-5">
          <section className="grid gap-4 md:grid-cols-4">
            <Metric label="Bridge formula limit" value={`${result.bridgeLimitLbs.toLocaleString()} lb`} />
            <Metric label="Controlling limit" value={`${result.controllingLimitLbs.toLocaleString()} lb`} />
            <Metric label={result.overByLbs > 0 ? 'Over by' : 'Under by'} value={`${(result.overByLbs || result.underByLbs).toLocaleString()} lb`} />
            <Metric label="Permit signal" value={result.permitLikelyRequired ? 'Likely' : 'Check route'} />
          </section>

          <section className="rounded-2xl border border-[#1e3048] bg-[#0f1a24] p-5">
            <h2 className="text-2xl font-black uppercase tracking-tight">Bridge Formula</h2>
            <div className="mt-4 rounded-xl bg-[#07090d] p-4 text-center font-mono text-sm text-[#22c55e]">
              W = 500 x (LN / (N - 1) + 12N + 36)
            </div>
            <div className="mt-4 grid gap-3 text-xs md:grid-cols-3">
              <FormulaCard label="W" body="Maximum allowed weight in pounds for the axle group." />
              <FormulaCard label="L" body="Feet between the outer axles in the group being checked." />
              <FormulaCard label="N" body="Number of axles in the group under consideration." />
            </div>
          </section>

          <section className="rounded-2xl border border-[#1e3048] bg-[#0f1a24] p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">State Planning Limits</h2>
                <p className="mt-1 text-sm text-[#8a9ab0]">
                  Use as a planning screen only. Final legal limits come from the active permit,
                  route, bridge posting, and state authority.
                </p>
              </div>
              <Link
                href="/permits/request"
                className="rounded-xl bg-[#22c55e] px-4 py-3 text-sm font-black text-[#071009]"
              >
                Request permit help
              </Link>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#1e3048] text-left text-[#566880]">
                    <th className="py-2 pr-4">State</th>
                    <th className="py-2 pr-4">GVW</th>
                    <th className="py-2 pr-4">Single axle</th>
                    <th className="py-2 pr-4">Tandem</th>
                    <th className="py-2 pr-4">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {STATE_WEIGHT_LIMITS.map((limit) => (
                    <tr key={limit.code} className="border-b border-[#131c28] hover:bg-[#111821]">
                      <td className="py-3 pr-4 font-bold text-[#d0dce8]">{limit.code}</td>
                      <td className="py-3 pr-4 text-[#8a9ab0]">{limit.gvwLimitLbs.toLocaleString()} lb</td>
                      <td className="py-3 pr-4 text-[#8a9ab0]">{limit.singleAxleLbs.toLocaleString()} lb</td>
                      <td className="py-3 pr-4 text-[#8a9ab0]">{limit.tandemAxleLbs.toLocaleString()} lb</td>
                      <td className="py-3 pr-4 text-[#566880]">{limit.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <ActionCard
              title="Check load dimensions"
              body="Pair weight screening with width, height, and length thresholds."
              href="/tools/load-dimension-checker"
              label="Open dimension checker"
            />
            <ActionCard
              title="Estimate permits"
              body="Move overweight results into permit-cost and lead-time planning."
              href="/tools/permit-sla-tracker"
              label="Check permit SLA"
            />
            <ActionCard
              title="Find escorts"
              body="Route legal-risk moves toward verified operators and compliance support."
              href="/directory?category=pilot-car"
              label="Find operators"
            />
          </section>
        </div>
      </section>
    </main>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-[#566880]">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full rounded-xl border border-[#1e3048] bg-[#07090d] px-3 py-3 text-sm font-semibold text-white"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#1e3048] bg-[#0f1a24] p-4">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-[#566880]">{label}</div>
      <div className="mt-2 text-2xl font-black text-[#22c55e]">{value}</div>
    </div>
  );
}

function FormulaCard({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-xl bg-[#07090d] p-3">
      <span className="font-black text-[#d4950e]">{label}</span>
      <p className="mt-1 leading-5 text-[#8a9ab0]">{body}</p>
    </div>
  );
}

function ActionCard({
  title,
  body,
  href,
  label,
}: {
  title: string;
  body: string;
  href: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-[#1e3048] bg-[#0f1a24] p-5">
      <h3 className="text-lg font-black uppercase tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#8a9ab0]">{body}</p>
      <Link href={href} className="mt-4 inline-flex text-sm font-black text-[#22c55e] hover:text-white">
        {label}
      </Link>
    </div>
  );
}
