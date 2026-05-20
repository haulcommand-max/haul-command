"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Compass, Search } from "lucide-react";
import {
  resolveSupportRoles,
  type MoveUrgency,
  type PermitReadiness,
  type RouteConfidence,
} from "@/lib/support/role-need-resolver";

function parseOptionalNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

const fieldClass =
  "min-h-11 rounded-lg border border-white/10 bg-white/[0.07] px-3 text-sm font-semibold text-white outline-none transition-colors placeholder:text-white/35 focus:border-[#C6923A]/70";

export function RoleNeedResolver({ defaultCountry = "US" }: { defaultCountry?: string }) {
  const [widthFt, setWidthFt] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [lengthFt, setLengthFt] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [routeConfidence, setRouteConfidence] = useState<RouteConfidence>("unknown");
  const [permitReadiness, setPermitReadiness] = useState<PermitReadiness>("unknown");
  const [urgency, setUrgency] = useState<MoveUrgency>("planning");

  const resolution = useMemo(
    () =>
      resolveSupportRoles({
        widthFt: parseOptionalNumber(widthFt),
        heightFt: parseOptionalNumber(heightFt),
        weightLbs: parseOptionalNumber(weightLbs),
        lengthFt: parseOptionalNumber(lengthFt),
        countryCode: defaultCountry === "GLOBAL" ? "US" : defaultCountry,
        origin,
        destination,
        routeConfidence,
        permitReadiness,
        urgency,
      }),
    [defaultCountry, destination, heightFt, lengthFt, origin, permitReadiness, routeConfidence, urgency, weightLbs, widthFt],
  );

  const riskTone =
    resolution.riskLevel === "critical"
      ? "border-red-400/40 bg-red-500/10 text-red-100"
      : resolution.riskLevel === "high"
        ? "border-orange-400/40 bg-orange-500/10 text-orange-100"
        : resolution.riskLevel === "medium"
          ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
          : "border-emerald-400/40 bg-emerald-500/10 text-emerald-100";

  return (
    <section
      aria-labelledby="role-need-resolver"
      className="mb-8 overflow-hidden rounded-2xl border border-[#C6923A]/25 bg-black/45 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-[2px]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="border-b border-[#C6923A]/20 p-5 md:p-6 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#C6923A]">
            <Compass className="h-4 w-4" />
            Ask who I need
          </div>
          <h2 id="role-need-resolver" className="mt-3 text-2xl font-black tracking-tight text-white md:text-3xl">
            Turn load facts into the first support roles to check
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#d8c6a3]">
            Use this when the buyer is unsure whether the move needs a pilot car, high pole, route survey, permit help, traffic control, steer support, or staging fallback.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <input className={fieldClass} inputMode="decimal" placeholder="Width ft" value={widthFt} onChange={(event) => setWidthFt(event.target.value)} />
            <input className={fieldClass} inputMode="decimal" placeholder="Height ft" value={heightFt} onChange={(event) => setHeightFt(event.target.value)} />
            <input className={fieldClass} inputMode="decimal" placeholder="Weight lbs" value={weightLbs} onChange={(event) => setWeightLbs(event.target.value)} />
            <input className={fieldClass} inputMode="decimal" placeholder="Length ft" value={lengthFt} onChange={(event) => setLengthFt(event.target.value)} />
            <input className={`${fieldClass} col-span-2`} placeholder="Origin city or route start" value={origin} onChange={(event) => setOrigin(event.target.value)} />
            <input className={`${fieldClass} col-span-2`} placeholder="Destination city or route end" value={destination} onChange={(event) => setDestination(event.target.value)} />
            <select className={fieldClass} value={routeConfidence} onChange={(event) => setRouteConfidence(event.target.value as RouteConfidence)}>
              <option value="unknown">Route unknown</option>
              <option value="needs_review">Route needs review</option>
              <option value="known">Route known</option>
            </select>
            <select className={fieldClass} value={permitReadiness} onChange={(event) => setPermitReadiness(event.target.value as PermitReadiness)}>
              <option value="unknown">Permit status unknown</option>
              <option value="not_started">Permits not started</option>
              <option value="in_progress">Permits in progress</option>
              <option value="ready">Permits ready</option>
            </select>
            <select className={`${fieldClass} col-span-2`} value={urgency} onChange={(event) => setUrgency(event.target.value as MoveUrgency)}>
              <option value="planning">Planning ahead</option>
              <option value="this_week">Moving this week</option>
              <option value="today">Moving today</option>
            </select>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${riskTone}`}>
              {resolution.riskLevel} planning risk
            </span>
            <span className="text-xs font-bold text-white/45">{resolution.countryCode} planning context</span>
          </div>

          <p className="mt-4 rounded-xl border border-[#C6923A]/25 bg-[#C6923A]/10 p-3 text-sm font-semibold leading-6 text-[#fff7e8]">
            {resolution.summary}
          </p>

          <div className="mt-4 space-y-3">
            {resolution.recommendedRoles.slice(0, 5).map((role) => (
              <Link
                key={role.id}
                href={role.directoryHref}
                className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.055] p-3 transition-colors hover:border-[#C6923A]/55 hover:bg-[#C6923A]/10"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#C6923A]" />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-white group-hover:text-[#F8DFB0]">{role.label}</span>
                    <span className="rounded-full border border-white/10 bg-black/25 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white/55">
                      {role.confidence}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[#d8c6a3]">{role.reason}</span>
                </span>
              </Link>
            ))}
          </div>

          {resolution.warnings.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3">
              {resolution.warnings.slice(0, 2).map((warning) => (
                <div key={warning} className="flex gap-2 text-xs font-semibold leading-5 text-amber-100">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
            {resolution.nextActions.map((action, index) => (
              <Link
                key={action.intent}
                href={action.href}
                className={index === 0
                  ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#C6923A] px-3 py-2 text-center text-xs font-black text-[#0B0B0C] hover:bg-[#E0B05C]"
                  : "inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2 text-center text-xs font-black text-[#F8DFB0] hover:border-[#C6923A]/55 hover:bg-[#C6923A]/10"}
              >
                {index === 0 && <Search className="h-3.5 w-3.5" />}
                {action.label}
              </Link>
            ))}
          </div>

          <p className="mt-4 text-[11px] leading-5 text-white/40">{resolution.disclaimer}</p>
        </div>
      </div>
    </section>
  );
}
