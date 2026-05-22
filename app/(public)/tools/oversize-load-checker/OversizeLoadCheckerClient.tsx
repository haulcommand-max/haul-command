'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  assessOversizeLoad,
  OVERSIZE_LIMITS,
  type OversizeJurisdictionCode,
} from '@/lib/tools/oversizeLoad';

const PRESETS = [
  { label: 'Legal dry van', widthFeet: 8.5, heightFeet: 13.5, lengthFeet: 53, grossWeightLbs: 78000 },
  { label: 'Wide excavator', widthFeet: 12, heightFeet: 13.8, lengthFeet: 62, grossWeightLbs: 92000 },
  { label: 'Tall transformer', widthFeet: 11, heightFeet: 15.2, lengthFeet: 70, grossWeightLbs: 148000 },
  { label: 'Superload screen', widthFeet: 17, heightFeet: 16, lengthFeet: 120, grossWeightLbs: 240000 },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export function OversizeLoadCheckerClient() {
  const [jurisdiction, setJurisdiction] = useState<OversizeJurisdictionCode>('US');
  const [widthFeet, setWidthFeet] = useState(12);
  const [heightFeet, setHeightFeet] = useState(14);
  const [lengthFeet, setLengthFeet] = useState(70);
  const [grossWeightLbs, setGrossWeightLbs] = useState(92000);

  const assessment = useMemo(
    () =>
      assessOversizeLoad({
        jurisdiction,
        widthFeet,
        heightFeet,
        lengthFeet,
        grossWeightLbs,
      }),
    [grossWeightLbs, heightFeet, jurisdiction, lengthFeet, widthFeet],
  );

  const statusColor =
    assessment.status === 'legal'
      ? '#22c55e'
      : assessment.status === 'permit_required'
        ? '#F1A91B'
        : assessment.status === 'escort_likely'
          ? '#f97316'
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
            <span>Load Classification</span>
          </div>
          <h1 className="mb-3 text-4xl font-black">Oversize Load Checker</h1>
          <p className="max-w-2xl text-lg leading-relaxed text-gray-400">
            Enter dimensions and gross weight to screen permit triggers, pilot-car needs, high-pole risk, and superload review signals before dispatch.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[420px_1fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
            <h2 className="mb-5 text-sm font-black uppercase tracking-wider">Load Inputs</h2>
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

              {[
                { label: 'Width (ft)', value: widthFeet, set: setWidthFeet, min: 0, step: 0.1 },
                { label: 'Height (ft)', value: heightFeet, set: setHeightFeet, min: 0, step: 0.1 },
                { label: 'Length (ft)', value: lengthFeet, set: setLengthFeet, min: 0, step: 1 },
                { label: 'Gross weight (lb)', value: grossWeightLbs, set: setGrossWeightLbs, min: 0, step: 1000 },
              ].map((field) => (
                <label key={field.label} className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">{field.label}</span>
                  <input
                    type="number"
                    min={field.min}
                    step={field.step}
                    value={field.value}
                    onChange={(event) => field.set(Number(event.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3 text-sm text-white outline-none focus:border-[#F1A91B]"
                  />
                </label>
              ))}
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
                    setWidthFeet(preset.widthFeet);
                    setHeightFeet(preset.heightFeet);
                    setLengthFeet(preset.lengthFeet);
                    setGrossWeightLbs(preset.grossWeightLbs);
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
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">Result</p>
                <h2 className="text-3xl font-black" style={{ color: statusColor }}>
                  {assessment.statusLabel}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">{assessment.summary}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0B0F14] px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-wider text-gray-500">Escorts</p>
                <p className="text-2xl font-black text-white">{assessment.escortCountEstimate}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              {[
                ['Permit', assessment.permitRequired ? 'Likely' : 'Not flagged'],
                ['High pole', assessment.highPoleLikely ? 'Likely' : 'Not flagged'],
                ['Police escort', assessment.policeEscortLikely ? 'Possible' : 'Not flagged'],
                ['Superload review', assessment.superloadReviewLikely ? 'Likely' : 'Not flagged'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/[0.06] bg-[#0B0F14] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
                  <p className="mt-1 text-sm font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
            <h2 className="mb-4 text-sm font-black uppercase tracking-wider">Exceeded Limits</h2>
            {assessment.exceeded.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="pb-3">Field</th>
                      <th className="pb-3">Actual</th>
                      <th className="pb-3">Planning limit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {assessment.exceeded.map((row) => (
                      <tr key={row.field}>
                        <td className="py-3 font-bold text-white">{row.field}</td>
                        <td className="py-3 text-[#F1A91B]">
                          {formatNumber(row.actual)} {row.unit}
                        </td>
                        <td className="py-3 text-gray-400">
                          {formatNumber(row.limit)} {row.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No entered value exceeds the selected planning profile.</p>
            )}
          </div>

          <div className="rounded-2xl border border-[#F1A91B]/20 bg-[#F1A91B]/5 p-6">
            <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-[#F1A91B]">Next actions</h2>
            <ol className="space-y-3 text-sm leading-relaxed text-gray-300">
              {assessment.nextActions.map((action) => (
                <li key={action} className="rounded-xl border border-[#F1A91B]/10 bg-[#0B0F14] p-3">
                  {action}
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['/tools/escort-count-calculator', 'Escort Count'],
              ['/tools/axle-weight-calculator', 'Axle Weight'],
              ['/tools/pilot-car-rate-calculator', 'Pilot Car Rate'],
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

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wider">Authority note</h2>
          <p className="text-sm leading-relaxed text-gray-400">
            This is a planning screen, not an official permit decision. Final requirements come from the active permit, route survey, bridge postings, local movement restrictions, and the issuing authority for each jurisdiction.
          </p>
        </div>
      </section>
    </main>
  );
}
