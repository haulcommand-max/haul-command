'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  calculateEscortCount,
  escortRoadContextLabels,
  OVERSIZE_LIMITS,
  type EscortRoadContext,
} from '@/lib/tools/escortCount';
import type { OversizeJurisdictionCode } from '@/lib/tools/oversizeLoad';

const PRESETS = [
  { label: '12 ft wide excavator', widthFeet: 12, heightFeet: 13.8, lengthFeet: 68, grossWeightLbs: 90000 },
  { label: 'Tall transformer', widthFeet: 11, heightFeet: 15.2, lengthFeet: 78, grossWeightLbs: 148000 },
  { label: 'Long blade section', widthFeet: 10.5, heightFeet: 13.9, lengthFeet: 128, grossWeightLbs: 76000 },
  { label: 'Superload screen', widthFeet: 17, heightFeet: 16, lengthFeet: 150, grossWeightLbs: 240000 },
];

const MATRIX = [
  { trigger: 'One-escort width threshold', action: 'Plan one pilot car, then verify position with permit conditions.' },
  { trigger: 'Two-escort width threshold', action: 'Plan front and rear escorts before quoting.' },
  { trigger: 'High-pole height threshold', action: 'Plan a high-pole car and vertical-clearance review.' },
  { trigger: '100+ ft length', action: 'Expect rear-control review; 120+ ft often needs front and rear planning.' },
  { trigger: 'Superload-like size or weight', action: 'Plan route survey, agency review, and possible police escort.' },
];

const FAQ_ITEMS = [
  {
    question: 'How many pilot cars does an oversize load need?',
    answer:
      'Pilot car count depends on width, height, length, route context, and permit conditions. A common planning pattern is one escort near the first width threshold, front and rear escorts at higher widths, high-pole support for tall loads, and police or traffic control for superload-like moves.',
  },
  {
    question: 'Does a high-pole car count as an escort vehicle?',
    answer:
      'A high-pole car is usually an escort vehicle assigned to vertical clearance screening. Whether it counts as the required lead escort depends on the permit and jurisdiction.',
  },
  {
    question: 'Can this replace the issued permit?',
    answer:
      'No. This calculator is a planning screen. The issued permit, route survey, and agency instructions control the final escort and traffic-control requirements.',
  },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function parseInput(value: string, fallback: number) {
  if (value.trim() === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function EscortCountCalculatorClient() {
  const [jurisdiction, setJurisdiction] = useState<OversizeJurisdictionCode>('US');
  const [roadContext, setRoadContext] = useState<EscortRoadContext>('interstate');
  const [widthFeet, setWidthFeet] = useState('12');
  const [heightFeet, setHeightFeet] = useState('14');
  const [lengthFeet, setLengthFeet] = useState('80');
  const [grossWeightLbs, setGrossWeightLbs] = useState('90000');
  const [hazmat, setHazmat] = useState(false);

  const result = useMemo(
    () =>
      calculateEscortCount({
        jurisdiction,
        roadContext,
        widthFeet: parseInput(widthFeet, 1),
        heightFeet: parseInput(heightFeet, 1),
        lengthFeet: parseInput(lengthFeet, 1),
        grossWeightLbs: parseInput(grossWeightLbs, 1),
        hazmat,
      }),
    [grossWeightLbs, hazmat, heightFeet, jurisdiction, lengthFeet, roadContext, widthFeet],
  );

  const statusColor =
    result.planningStatus === 'no_escort_flagged'
      ? '#22c55e'
      : result.planningStatus === 'escort_likely'
        ? '#F1A91B'
        : '#ef4444';

  return (
    <main data-hc-topic-hero="manual" className="min-h-screen bg-[#0B0F14] text-white">
      <section className="border-b border-[#F1A91B]/10 bg-[#071019]">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#F1A91B]">
            <Link href="/tools" className="hover:text-white">
              Tools
            </Link>
            <span>/</span>
            <span>Escort Intelligence</span>
          </div>
          <h1 className="mb-3 text-4xl font-black">Escort Count Calculator</h1>
          <p className="max-w-2xl text-lg leading-relaxed text-gray-400">
            Estimate lead, chase, high-pole, police, and route-survey needs from load dimensions and route context before quoting a move.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[420px_1fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
            <h2 className="mb-5 text-sm font-black uppercase tracking-wider">Move Inputs</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Planning jurisdiction</span>
                <select
                  value={jurisdiction}
                  onChange={(event) => setJurisdiction(event.target.value as OversizeJurisdictionCode)}
                  className="w-full rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3 text-sm text-white outline-none focus:border-[#F1A91B]"
                >
                  {OVERSIZE_LIMITS.map((profile) => (
                    <option key={profile.code} value={profile.code}>
                      {profile.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Route context</span>
                <select
                  value={roadContext}
                  onChange={(event) => setRoadContext(event.target.value as EscortRoadContext)}
                  className="w-full rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3 text-sm text-white outline-none focus:border-[#F1A91B]"
                >
                  {Object.entries(escortRoadContextLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              {[
                { label: 'Width (ft)', value: widthFeet, set: setWidthFeet, min: 1, step: 0.1 },
                { label: 'Height (ft)', value: heightFeet, set: setHeightFeet, min: 1, step: 0.1 },
                { label: 'Overall length (ft)', value: lengthFeet, set: setLengthFeet, min: 1, step: 1 },
                { label: 'Gross weight (lb)', value: grossWeightLbs, set: setGrossWeightLbs, min: 1, step: 1000 },
              ].map((field) => (
                <label key={field.label} className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">{field.label}</span>
                  <input
                    type="number"
                    min={field.min}
                    step={field.step}
                    value={field.value}
                    onChange={(event) => field.set(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3 text-sm text-white outline-none focus:border-[#F1A91B]"
                  />
                </label>
              ))}

              <label className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0B0F14] p-3 text-sm font-bold text-gray-300">
                <input
                  type="checkbox"
                  checked={hazmat}
                  onChange={(event) => setHazmat(event.target.checked)}
                  className="h-4 w-4 accent-[#F1A91B]"
                />
                Hazmat or emergency-response coordination involved
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
            <h2 className="mb-4 text-sm font-black uppercase tracking-wider">Common presets</h2>
            <div className="grid gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setWidthFeet(String(preset.widthFeet));
                    setHeightFeet(String(preset.heightFeet));
                    setLengthFeet(String(preset.lengthFeet));
                    setGrossWeightLbs(String(preset.grossWeightLbs));
                  }}
                  className="rounded-xl border border-white/[0.08] bg-[#0B0F14] px-3 py-3 text-left text-sm text-gray-300 hover:border-[#F1A91B]/40 hover:text-white"
                >
                  <span className="block font-bold text-white">{preset.label}</span>
                  {preset.widthFeet} ft W / {preset.heightFeet} ft H / {preset.lengthFeet} ft L / {formatNumber(preset.grossWeightLbs)} lb
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">Result</p>
                <h2 className="text-3xl font-black" style={{ color: statusColor }}>
                  {result.statusLabel}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
                  Planning profile: {result.jurisdictionLabel}. This screen estimates dispatch posture; final authority comes from the issued permit and route-specific conditions.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0B0F14] px-5 py-4 text-right">
                <p className="text-xs uppercase tracking-wider text-gray-500">Escort vehicles</p>
                <p className="text-3xl font-black text-white">{result.totalEscortVehicles}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ['Lead', result.leadEscorts],
                ['Chase', result.chaseEscorts],
                ['High-pole', result.highPoleCars],
                ['Police', result.policeEscortsLikely ? 'Likely' : 'Not flagged'],
                ['Survey', result.routeSurveyLikely ? 'Likely' : 'Not flagged'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/[0.06] bg-[#0B0F14] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
                  <p className="mt-1 text-lg font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
              <h2 className="mb-4 text-sm font-black uppercase tracking-wider">Triggered Rules</h2>
              <div className="space-y-3 text-sm leading-relaxed text-gray-300">
                {result.triggers.map((trigger) => (
                  <div key={trigger} className="rounded-xl border border-white/[0.06] bg-[#0B0F14] p-3">
                    {trigger}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#F1A91B]/20 bg-[#F1A91B]/5 p-6">
              <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-[#F1A91B]">Next Actions</h2>
              <ol className="space-y-3 text-sm leading-relaxed text-gray-300">
                {result.nextActions.map((action) => (
                  <li key={action} className="rounded-xl border border-[#F1A91B]/10 bg-[#0B0F14] p-3">
                    {action}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {result.cautions.length > 0 && (
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6">
              <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-orange-300">Cautions</h2>
              <ul className="space-y-2 text-sm text-orange-100/80">
                {result.cautions.map((caution) => (
                  <li key={caution}>{caution}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
            <h2 className="mb-4 text-sm font-black uppercase tracking-wider">Planning Matrix</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="pb-3">Trigger</th>
                    <th className="pb-3">Dispatch action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {MATRIX.map((row) => (
                    <tr key={row.trigger}>
                      <td className="py-3 pr-4 font-bold text-[#F1A91B]">{row.trigger}</td>
                      <td className="py-3 text-gray-400">{row.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
            <h2 className="mb-4 text-sm font-black uppercase tracking-wider">Escort Count FAQs</h2>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item) => (
                <details key={item.question} className="rounded-xl border border-white/[0.06] bg-[#0B0F14] p-4">
                  <summary className="cursor-pointer text-sm font-bold text-white">{item.question}</summary>
                  <p className="mt-3 text-sm leading-relaxed text-gray-400">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['/tools/pilot-car-rate-calculator', 'Price Escorts'],
              ['/tools/total-trip-cost-calculator', 'Total Trip Cost'],
              ['/tools/oversize-load-checker', 'Oversize Check'],
              ['/directory', 'Find Operators'],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-xl border border-white/[0.08] bg-[#111827] px-4 py-3 text-center text-sm font-bold text-gray-300 hover:border-[#F1A91B]/40 hover:text-[#F1A91B]"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
