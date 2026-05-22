'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  calculateCertificationTimeline,
  certificationPaceLabels,
  isCertificationStudyPace,
  type CertificationPath,
  type CertificationStudyPace,
} from '@/lib/tools/certificationTimeline';

const paceOptions = Object.entries(certificationPaceLabels) as [CertificationStudyPace, string][];

function formatCurrency(value: number) {
  if (value <= 0) return 'Verify';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function localDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function uniquePaths(paths: CertificationPath[]) {
  const seen = new Set<string>();
  return paths.filter((path) => {
    if (!path.jurisdiction_code || seen.has(path.jurisdiction_code)) return false;
    seen.add(path.jurisdiction_code);
    return true;
  });
}

export function CertificationTimelineClient({
  paths,
}: {
  paths: CertificationPath[];
}) {
  const options = useMemo(() => uniquePaths(paths), [paths]);
  const defaultTarget =
    options.find((path) => path.requires_certification)?.jurisdiction_code ??
    options[0]?.jurisdiction_code ??
    'manual';
  const [targetCode, setTargetCode] = useState(defaultTarget);
  const [currentCredentialCode, setCurrentCredentialCode] = useState('none');
  const [pace, setPace] = useState<CertificationStudyPace>('part_time');
  const [startDate, setStartDate] = useState('');
  const [manualJurisdiction, setManualJurisdiction] = useState('Manual jurisdiction');
  const [manualRequiresCertification, setManualRequiresCertification] = useState(true);
  const [manualTrainingHours, setManualTrainingHours] = useState('16');
  const [manualCertificationCost, setManualCertificationCost] = useState('300');
  const [manualRenewalYears, setManualRenewalYears] = useState('3');

  const effectiveOptions = useMemo<CertificationPath[]>(() => {
    if (options.length > 0) return options;
    return [
      {
        id: 'manual',
        jurisdiction_code: 'manual',
        jurisdiction_name: manualJurisdiction.trim() || 'Manual jurisdiction',
        requires_certification: manualRequiresCertification,
        training_hours: Number(manualTrainingHours) || 0,
        certification_cost: Number(manualCertificationCost) || 0,
        renewal_period_years: Number(manualRenewalYears) || null,
        reciprocity_states: [],
      },
    ];
  }, [
    manualCertificationCost,
    manualJurisdiction,
    manualRenewalYears,
    manualRequiresCertification,
    manualTrainingHours,
    options,
  ]);

  const result = useMemo(() => {
    return calculateCertificationTimeline(effectiveOptions, {
      targetCode: targetCode || effectiveOptions[0].jurisdiction_code,
      currentCredentialCode,
      pace,
      startDate,
    });
  }, [currentCredentialCode, effectiveOptions, pace, startDate, targetCode]);

  useEffect(() => {
    setStartDate((current) => current || localDateInputValue(new Date()));
  }, []);

  const isManualMode = options.length === 0;
  const requiringCert = effectiveOptions.filter((path) => path.requires_certification).length;
  const noCertMarked = effectiveOptions.length - requiringCert;
  const reciprocalNames =
    result.target.reciprocity_states
      ?.map((code) => effectiveOptions.find((path) => path.jurisdiction_code === code)?.jurisdiction_name ?? code)
      .slice(0, 8) ?? [];

  return (
    <div data-hc-topic-hero="manual" className="min-h-screen bg-[#0B0F14] text-white">
      <section className="border-b border-[#F1A91B]/10">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#F1A91B]">
            <Link href="/tools" className="hover:text-white">
              Tools
            </Link>
            <span>/</span>
            <span>Certification</span>
          </div>
          <h1 className="max-w-4xl text-3xl font-black tracking-tight md:text-5xl">
            Pilot Car Certification Timeline
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            Estimate when an operator can be ready for a target jurisdiction using stored training
            hours, fee records, renewal cycles, and reciprocity indicators. This is a planning tool;
            the official issuing authority controls final eligibility.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-2xl font-black text-[#F1A91B]">{options.length}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Stored jurisdictions loaded</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-2xl font-black text-[#F1A91B]">{requiringCert}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Marked certification-required</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-2xl font-black text-[#F1A91B]">{noCertMarked}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Marked no-certification</div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-white/10 bg-[#111827] p-5">
          <h2 className="text-lg font-black">Timeline Inputs</h2>
          {isManualMode && (
            <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
              Stored certification path records did not load in this environment. Manual planning
              mode is active, so the estimate uses the values you enter below instead of inventing
              jurisdiction-specific rules.
            </div>
          )}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Target jurisdiction</span>
              {isManualMode ? (
                <input
                  type="text"
                  value={manualJurisdiction}
                  onChange={(event) => setManualJurisdiction(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3 text-white outline-none focus:border-[#F1A91B]"
                />
              ) : (
                <select
                  value={result.target.jurisdiction_code}
                  onChange={(event) => setTargetCode(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3 text-white outline-none focus:border-[#F1A91B]"
                >
                  {effectiveOptions.map((path) => (
                    <option key={path.jurisdiction_code} value={path.jurisdiction_code}>
                      {path.jurisdiction_name}
                    </option>
                  ))}
                </select>
              )}
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current credential</span>
              <select
                value={currentCredentialCode}
                onChange={(event) => setCurrentCredentialCode(event.target.value)}
                disabled={isManualMode}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3 text-white outline-none focus:border-[#F1A91B]"
              >
                <option value="none">No active credential</option>
                {effectiveOptions.map((path) => (
                  <option key={path.jurisdiction_code} value={path.jurisdiction_code}>
                    {path.jurisdiction_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Study pace</span>
              <select
                value={pace}
                onChange={(event) => {
                  const next = event.target.value;
                  if (isCertificationStudyPace(next)) setPace(next);
                }}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3 text-white outline-none focus:border-[#F1A91B]"
              >
                {paceOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3 text-white outline-none focus:border-[#F1A91B]"
              />
            </label>
          </div>

          {isManualMode && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3">
                <input
                  type="checkbox"
                  checked={manualRequiresCertification}
                  onChange={(event) => setManualRequiresCertification(event.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-bold">Certification required for this plan</span>
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Training hours</span>
                <input
                  type="number"
                  min={0}
                  value={manualTrainingHours}
                  onChange={(event) => setManualTrainingHours(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3 text-white outline-none focus:border-[#F1A91B]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Certification fees</span>
                <input
                  type="number"
                  min={0}
                  value={manualCertificationCost}
                  onChange={(event) => setManualCertificationCost(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3 text-white outline-none focus:border-[#F1A91B]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Renewal cycle years</span>
                <input
                  type="number"
                  min={0}
                  value={manualRenewalYears}
                  onChange={(event) => setManualRenewalYears(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#0B0F14] px-3 py-3 text-white outline-none focus:border-[#F1A91B]"
                />
              </label>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-[#F1A91B]/20 bg-[#F1A91B]/10 p-5">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#F1A91B]">Ready date</div>
            <div className="mt-2 text-4xl font-black">{formatDate(result.readyDate)}</div>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Estimated {result.estimatedDays} calendar day{result.estimatedDays === 1 ? '' : 's'} for{' '}
              {result.target.jurisdiction_name}.{' '}
              {result.reciprocityLikely
                ? 'The selected credential appears to shorten the path through reciprocity.'
                : 'No reciprocity shortcut is currently applied.'}
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {[
              ['Training hours', result.trainingHours === null ? 'Verify' : `${result.trainingHours}`],
              ['Estimated fees', formatCurrency(result.estimatedCost)],
              ['Renewal cycle', result.renewalPeriodYears ? `${result.renewalPeriodYears} yr` : 'Verify'],
              ['Reciprocity', result.reciprocityLikely ? 'Likely' : 'Not applied'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-[#0B0F14] p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</div>
                <div className="mt-2 text-xl font-black">{value}</div>
              </div>
            ))}
          </div>

          <section className="mt-7">
            <h2 className="text-lg font-black">Certification Steps</h2>
            <div className="mt-4 space-y-3">
              {result.steps.map((step, index) => (
                <div key={step.label} className="rounded-2xl border border-white/10 bg-[#0B0F14] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-[#F1A91B]">Step {index + 1}</div>
                      <h3 className="mt-1 text-base font-black">{step.label}</h3>
                    </div>
                    <div className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold">{step.days} days</div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{step.detail}</p>
                </div>
              ))}
            </div>
          </section>

          {reciprocalNames.length > 0 && (
            <section className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-black">Reciprocity Signals</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {result.target.jurisdiction_name} has reciprocity records for these credentials in
                the current data. Confirm documentation requirements before relying on any
                reciprocal badge.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {reciprocalNames.map((name) => (
                  <span key={name} className="rounded-full border border-white/10 bg-[#0B0F14] px-3 py-2 text-xs font-bold text-slate-200">
                    {name}
                  </span>
                ))}
              </div>
            </section>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-white/10 bg-[#111827] p-5">
            <h2 className="text-lg font-black">Warnings</h2>
            <div className="mt-4 space-y-3">
              {result.warnings.map((warning) => (
                <p key={warning} className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm leading-6 text-amber-100">
                  {warning}
                </p>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#111827] p-5">
            <h2 className="text-lg font-black">Next Actions</h2>
            <div className="mt-4 grid gap-3">
              {[
                ['/training', 'Find approved training'],
                ['/tools/certification-reciprocity-checker', 'Check reciprocity'],
                ['/claim', 'Add credentials to profile'],
                ['/directory', 'Find certified operators'],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-xl border border-white/10 bg-[#0B0F14] px-4 py-3 text-sm font-bold text-white hover:border-[#F1A91B]"
                >
                  {label}
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </main>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="rounded-2xl border border-white/10 bg-[#111827] p-5">
          <h2 className="text-lg font-black">Jurisdiction Matrix</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2">Jurisdiction</th>
                  <th className="px-3 py-2">Certification</th>
                  <th className="px-3 py-2">Hours</th>
                  <th className="px-3 py-2">Stored fee</th>
                  <th className="px-3 py-2">Renewal</th>
                  <th className="px-3 py-2">Reciprocity records</th>
                </tr>
              </thead>
              <tbody>
                {effectiveOptions.map((path) => (
                  <tr key={path.jurisdiction_code} className="bg-[#0B0F14]">
                    <td className="rounded-l-xl px-3 py-3 font-bold">{path.jurisdiction_name}</td>
                    <td className="px-3 py-3">{path.requires_certification ? 'Required' : 'Not marked required'}</td>
                    <td className="px-3 py-3">{path.training_hours ?? 'Verify'}</td>
                    <td className="px-3 py-3">{formatCurrency(path.certification_cost ?? 0)}</td>
                    <td className="px-3 py-3">{path.renewal_period_years ? `${path.renewal_period_years} yr` : 'Verify'}</td>
                    <td className="rounded-r-xl px-3 py-3">{path.reciprocity_states?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
