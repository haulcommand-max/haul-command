'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  CertificationType,
  US_STATE_OPTIONS,
  evaluateCertificationReciprocity,
} from '@/lib/tools/certificationReciprocity';

const PRESET_ROUTES = [
  { label: 'West wind move', states: ['WA', 'OR', 'ID', 'UT', 'CO'] },
  { label: 'Southeast heavy haul', states: ['FL', 'GA', 'NC', 'VA'] },
  { label: 'Northeast strict check', states: ['PA', 'NY', 'NJ', 'CT'] },
  { label: 'Energy corridor', states: ['TX', 'NM', 'AZ', 'NV', 'CA'] },
];

const CERT_TYPES: { value: CertificationType; label: string }[] = [
  { value: 'pevo', label: 'PEVO / state escort credential' },
  { value: 'witpac', label: 'WITPAC / wind specialist' },
  { value: 'defensive_driving', label: 'Defensive driving only' },
  { value: 'state_escort', label: 'State-specific escort card' },
];

export function CertificationReciprocityCheckerClient() {
  const [issuedState, setIssuedState] = useState('WA');
  const [targetStates, setTargetStates] = useState<string[]>(['OR', 'UT', 'CO', 'NY']);
  const [certificationType, setCertificationType] = useState<CertificationType>('pevo');
  const [hasDefensiveDriving, setHasDefensiveDriving] = useState(true);
  const [hasInsurance, setHasInsurance] = useState(true);

  const result = useMemo(
    () =>
      evaluateCertificationReciprocity({
        issuedState,
        targetStates,
        certificationType,
        hasDefensiveDriving,
        hasInsurance,
      }),
    [certificationType, hasDefensiveDriving, hasInsurance, issuedState, targetStates],
  );

  function toggleTarget(state: string) {
    setTargetStates((current) =>
      current.includes(state) ? current.filter((item) => item !== state) : [...current, state],
    );
  }

  const statusStyle =
    result.overallStatus === 'accepted'
      ? { border: 'rgba(34,197,94,0.38)', bg: 'rgba(34,197,94,0.12)', text: '#86efac' }
      : result.overallStatus === 'conditional'
        ? { border: 'rgba(245,158,11,0.42)', bg: 'rgba(245,158,11,0.12)', text: '#fcd34d' }
        : { border: 'rgba(248,113,113,0.42)', bg: 'rgba(248,113,113,0.12)', text: '#fca5a5' };

  return (
    <main className="min-h-screen bg-[#0B0F14] text-[#F5F5F0]" data-hc-topic-hero="manual">
      <section className="border-b border-white/10 px-5 py-10 md:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_380px] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-[#C6923A]">
              Credential Dispatch Screen
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black uppercase tracking-tight md:text-6xl">
              Certification Reciprocity Checker
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
              Screen whether a pilot car or escort credential is likely accepted across selected
              route markets before you quote, assign, or dispatch an oversize move.
            </p>
          </div>
          <div className="rounded-2xl border border-[#C6923A]/25 bg-[#C6923A]/10 p-5">
            <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#C6923A]">
              Current Result
            </div>
            <div className="mt-3 text-3xl font-black uppercase" style={{ color: statusStyle.text }}>
              {result.overallStatus.replace('_', ' ')}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{result.summary}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8 lg:grid-cols-[420px_1fr] lg:px-12">
        <form className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div>
            <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Issuing state
            </label>
            <select
              value={issuedState}
              onChange={(event) => setIssuedState(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-[#111821] px-3 py-3 text-sm font-semibold text-white"
            >
              {US_STATE_OPTIONS.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name} ({state.code})
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5">
            <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Credential type
            </label>
            <select
              value={certificationType}
              onChange={(event) => setCertificationType(event.target.value as CertificationType)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-[#111821] px-3 py-3 text-sm font-semibold text-white"
            >
              {CERT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm font-semibold text-slate-200">
              <input
                type="checkbox"
                checked={hasDefensiveDriving}
                onChange={(event) => setHasDefensiveDriving(event.target.checked)}
                className="h-4 w-4 accent-[#C6923A]"
              />
              Defensive driving proof
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm font-semibold text-slate-200">
              <input
                type="checkbox"
                checked={hasInsurance}
                onChange={(event) => setHasInsurance(event.target.checked)}
                className="h-4 w-4 accent-[#C6923A]"
              />
              Insurance proof
            </label>
          </div>

          <div className="mt-6">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Route presets
            </div>
            <div className="mt-3 grid gap-2">
              {PRESET_ROUTES.map((route) => (
                <button
                  key={route.label}
                  type="button"
                  onClick={() => setTargetStates(route.states)}
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-left text-sm font-bold text-white transition hover:border-[#C6923A]/60"
                >
                  {route.label}
                  <span className="block text-xs font-medium text-slate-400">{route.states.join(' -> ')}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Target markets
              </div>
              <button
                type="button"
                onClick={() => setTargetStates([])}
                className="text-xs font-bold text-[#C6923A] hover:text-white"
              >
                Clear
              </button>
            </div>
            <div className="mt-3 grid max-h-72 grid-cols-3 gap-2 overflow-auto pr-1">
              {US_STATE_OPTIONS.map((state) => {
                const selected = targetStates.includes(state.code);
                return (
                  <button
                    key={state.code}
                    type="button"
                    onClick={() => toggleTarget(state.code)}
                    className="rounded-lg border px-2 py-2 text-xs font-black transition"
                    style={{
                      borderColor: selected ? '#C6923A' : 'rgba(255,255,255,0.1)',
                      background: selected ? 'rgba(198,146,58,0.16)' : 'rgba(255,255,255,0.03)',
                      color: selected ? '#F5F5F0' : '#94a3b8',
                    }}
                  >
                    {state.code}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        <div className="space-y-5">
          <section className="grid gap-4 md:grid-cols-4">
            <Metric label="Accepted" value={result.accepted.length} tone="good" />
            <Metric label="Conditional" value={result.conditional.length} tone="warn" />
            <Metric label="Blocked" value={result.blocked.length} tone="bad" />
            <Metric label="Risk score" value={`${result.riskScore}/100`} tone={result.riskScore > 45 ? 'bad' : 'warn'} />
          </section>

          <section
            className="rounded-2xl border p-5"
            style={{ borderColor: statusStyle.border, background: statusStyle.bg }}
          >
            <div className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: statusStyle.text }}>
              Dispatch decision
            </div>
            <p className="mt-3 text-lg font-bold text-white">{result.summary}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              This is a screening tool, not a permit-office approval. Treat blocked or conditional
              results as proof-review work before assigning an operator.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Market Results</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {issuedState} credential checked against {targetStates.length} selected market
                  {targetStates.length === 1 ? '' : 's'}.
                </p>
              </div>
              <Link
                href="/directory?category=pilot-car"
                className="rounded-xl bg-[#C6923A] px-4 py-3 text-sm font-black text-[#0B0F14]"
              >
                Find certified operators
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              {result.results.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-black/20 p-5 text-sm text-slate-300">
                  Select at least one target market to run the checker.
                </div>
              ) : (
                result.results.map((item) => <StateResultCard key={item.state} item={item} />)
              )}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <ActionCard
              title="Verify credentials"
              body="Use this result as the first screen, then verify the card, expiration, ID, insurance, and permit-specific requirements."
              href="/claim"
              label="Claim profile"
            />
            <ActionCard
              title="Check regulations"
              body="Compare the route markets against regulation pages before moving from quote to dispatch."
              href="/regulations"
              label="Open regulations"
            />
            <ActionCard
              title="Build training path"
              body="Turn blocked markets into training demand and credential upgrades."
              href="/training"
              label="View training"
            />
          </section>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: number | string; tone: 'good' | 'warn' | 'bad' }) {
  const color = tone === 'good' ? '#86efac' : tone === 'warn' ? '#fcd34d' : '#fca5a5';
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function StateResultCard({
  item,
}: {
  item: ReturnType<typeof evaluateCertificationReciprocity>['results'][number];
}) {
  const color = item.status === 'accepted' ? '#86efac' : item.status === 'conditional' ? '#fcd34d' : '#fca5a5';
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-lg font-black">{item.state}</div>
        <div className="rounded-full px-3 py-1 text-xs font-black uppercase" style={{ color, background: `${color}22` }}>
          {item.status}
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">{item.reason}</p>
      <p className="mt-2 text-sm font-semibold text-white">{item.nextAction}</p>
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <h3 className="text-lg font-black uppercase tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
      <Link href={href} className="mt-4 inline-flex text-sm font-black text-[#C6923A] hover:text-white">
        {label}
      </Link>
    </div>
  );
}
