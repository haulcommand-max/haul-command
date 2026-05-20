import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { ReactNode } from "react";

import type { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Competitor Intel | Haul Command Admin",
  robots: {
    index: false,
    follow: false,
  },
};

type CompetitorIntelRow =
  Database["public"]["Tables"]["competitor_intel"]["Row"];
type OperatorRow = Database["public"]["Tables"]["operators"]["Row"];

type DashboardData = {
  configured: boolean;
  errors: string[];
  intel: CompetitorIntelRow[];
  claimQueue: OperatorRow[];
};

type StatusKey = "WINNING" | "TIED" | "BEHIND" | "UNKNOWN";

async function fetchCompetitorDashboard(): Promise<DashboardData> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return {
      configured: false,
      errors: ["Supabase admin credentials are not configured for this environment."],
      intel: [],
      claimQueue: [],
    };
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  });

  const errors: string[] = [];

  const [intelResult, claimQueueResult] = await Promise.all([
    supabase
      .from("competitor_intel")
      .select(
        "id, competitor_name, country_code, state, competitor_operator_count, our_operator_count, coverage_delta, our_status, competitor_url, last_checked, notes",
      )
      .order("coverage_delta", { ascending: true, nullsFirst: false })
      .limit(150),
    supabase
      .from("operators")
      .select(
        "id, company_name, contact_name, state, country_code, region, region_code, source, competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority, claim_value_score, confidence_score, completeness_score, is_claimed, claimed_at, freshness_score, freshness_decay_state, freshness_computed_at",
      )
      .eq("competitor_sourced", true)
      .order("claim_value_score", { ascending: false, nullsFirst: false })
      .limit(30),
  ]);

  if (intelResult.error) {
    errors.push(`competitor_intel: ${intelResult.error.message}`);
  }

  if (claimQueueResult.error) {
    errors.push(`operators claim queue: ${claimQueueResult.error.message}`);
  }

  return {
    configured: true,
    errors,
    intel: intelResult.data ?? [],
    claimQueue: claimQueueResult.data ?? [],
  };
}

function normalizeStatus(status: string | null): StatusKey {
  const normalized = (status ?? "").trim().toUpperCase();
  if (normalized === "WINNING" || normalized === "TIED" || normalized === "BEHIND") {
    return normalized;
  }
  return "UNKNOWN";
}

function text(value: unknown, fallback = "Unknown"): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
}

function numberValue(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatDate(value: string | null): string {
  if (!value) return "Not checked";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not checked";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function daysSince(value: string | null): number | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.floor((Date.now() - parsed.getTime()) / 86_400_000);
}

function statusClass(status: StatusKey): string {
  if (status === "WINNING") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (status === "TIED") return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  if (status === "BEHIND") return "border-red-500/35 bg-red-500/10 text-red-200";
  return "border-white/10 bg-white/5 text-zinc-300";
}

function priorityClass(priority: string | null): string {
  const normalized = (priority ?? "").toLowerCase();
  if (normalized.includes("high") || normalized.includes("p0")) return "text-red-200";
  if (normalized.includes("medium") || normalized.includes("p1")) return "text-amber-200";
  if (normalized.includes("low")) return "text-zinc-300";
  return "text-zinc-400";
}

export default async function CompetitorIntelPage() {
  const data = await fetchCompetitorDashboard();
  const statusCounts = data.intel.reduce<Record<StatusKey, number>>(
    (acc, row) => {
      acc[normalizeStatus(row.our_status)] += 1;
      return acc;
    },
    { WINNING: 0, TIED: 0, BEHIND: 0, UNKNOWN: 0 },
  );
  const trackedCompetitors = new Set(data.intel.map((row) => row.competitor_name)).size;
  const trackedMarkets = data.intel.length;
  const netCoverageDelta = data.intel.reduce(
    (sum, row) => sum + numberValue(row.coverage_delta),
    0,
  );
  const highValueClaims = data.claimQueue.filter(
    (operator) => numberValue(operator.claim_value_score) >= 70,
  ).length;
  const unclaimedCompetitorTargets = data.claimQueue.filter((operator) => !operator.is_claimed).length;
  const staleIntel = data.intel.filter((row) => {
    const age = daysSince(row.last_checked);
    return age == null || age > 14;
  }).length;
  const topClaimValue = data.claimQueue.reduce(
    (max, operator) => Math.max(max, numberValue(operator.claim_value_score)),
    0,
  );
  const mostExposedMarkets = data.intel
    .filter((row) => normalizeStatus(row.our_status) === "BEHIND" || numberValue(row.coverage_delta) < 0)
    .slice(0, 12);
  const topClaimTargets = data.claimQueue
    .filter((operator) => !operator.is_claimed)
    .slice(0, 5);

  return (
    <div className="min-h-full bg-[#070707] text-zinc-100">
      <header className="border-b border-white/10 bg-[#0b0b0b] px-8 py-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ffb400]">
              Admin authority required
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
              Competitor Intel Dashboard
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
              Internal displacement board for competitor coverage, market gaps,
              and high-value operator claim targets. This page reads existing
              Supabase intelligence only and stays behind the admin gate.
            </p>
          </div>
          <div className="rounded-lg border border-[#ffb400]/25 bg-[#ffb400]/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#ffcf66]">
            Noindex | Server-side | Read-only
          </div>
        </div>
      </header>

      <main className="space-y-8 p-8">
        {!data.configured ? (
          <Alert tone="danger" title="Supabase admin connection unavailable">
            {data.errors[0]}
          </Alert>
        ) : null}

        {data.errors.length > 0 ? (
          <Alert tone="warning" title="Partial data loaded">
            {data.errors.join(" ")}
          </Alert>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Tracked competitors" value={trackedCompetitors} />
          <MetricCard label="Tracked markets" value={trackedMarkets} />
          <MetricCard label="Behind markets" value={statusCounts.BEHIND} tone="danger" />
          <MetricCard label="Net coverage delta" value={netCoverageDelta} tone={netCoverageDelta < 0 ? "danger" : "success"} />
          <MetricCard label="High-value claim targets" value={highValueClaims} tone="warning" />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <ActionCard
            title="P0 displacement markets"
            value={`${mostExposedMarkets.length} exposed`}
            tone="danger"
            body="Work the lowest coverage deltas first: claim targets, refresh local directory content, and run acquisition outreach before sponsor sales."
          />
          <ActionCard
            title="P1 steal-back queue"
            value={`${unclaimedCompetitorTargets} unclaimed`}
            tone="warning"
            body={`Top claim value score is ${topClaimValue}. Prioritize owner contact, proof request, and competitor-source cleanup for these operators.`}
          />
          <ActionCard
            title="P1 stale intel refresh"
            value={`${staleIntel} stale`}
            tone="neutral"
            body="Refresh records older than 14 days before making paid territory or market coverage decisions from this dashboard."
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          <StatusCard status="WINNING" count={statusCounts.WINNING} />
          <StatusCard status="TIED" count={statusCounts.TIED} />
          <StatusCard status="BEHIND" count={statusCounts.BEHIND} />
          <StatusCard status="UNKNOWN" count={statusCounts.UNKNOWN} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Panel
            title="Coverage Delta Watchlist"
            description="Markets where competitor coverage is tied or ahead. Lowest coverage deltas are prioritized first."
          >
            {mostExposedMarkets.length === 0 ? (
              <EmptyState>No losing or negative-delta markets are currently returned by competitor_intel.</EmptyState>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="min-w-[760px] w-full border-collapse text-left text-sm">
                  <thead className="bg-white/[0.03] text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    <tr>
                      <th className="px-4 py-3">Market</th>
                      <th className="px-4 py-3">Competitor</th>
                      <th className="px-4 py-3 text-right">Delta</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Checked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {mostExposedMarkets.map((row) => {
                      const status = normalizeStatus(row.our_status);
                      return (
                        <tr key={row.id} className="bg-[#0b0b0b]">
                          <td className="px-4 py-4">
                            <div className="font-bold text-white">
                              {text(row.state, "Global")}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {text(row.country_code, "Country unknown")}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-zinc-200">{row.competitor_name}</div>
                            {row.competitor_url ? (
                              <a
                                href={row.competitor_url}
                                className="text-xs text-[#ffb400] hover:text-[#ffd36c]"
                                rel="noreferrer"
                                target="_blank"
                              >
                                Source
                              </a>
                            ) : null}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className={numberValue(row.coverage_delta) < 0 ? "font-black text-red-200" : "font-black text-zinc-200"}>
                              {numberValue(row.coverage_delta) > 0 ? "+" : ""}
                              {numberValue(row.coverage_delta)}
                            </div>
                            <div className="text-xs text-zinc-500">
                              HC {numberValue(row.our_operator_count)} / Comp {numberValue(row.competitor_operator_count)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusClass(status)}`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs text-zinc-500">{formatDate(row.last_checked)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel
            title="Steal-Back Claim Queue"
            description="Competitor-sourced operators ordered by the existing claim_value_score field."
          >
            {data.claimQueue.length === 0 ? (
              <EmptyState>No competitor-sourced operators are currently queued.</EmptyState>
            ) : (
              <div className="space-y-3">
                {data.claimQueue.slice(0, 12).map((operator) => (
                  <div key={operator.id} className="rounded-lg border border-white/10 bg-[#0b0b0b] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-black leading-tight text-white">{operator.company_name}</h3>
                        <p className="mt-1 text-xs text-zinc-500">
                          {text(operator.region, text(operator.state, "Region unknown"))} | {text(operator.country_code, "Country unknown")}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-[#ffb400]">
                          {numberValue(operator.claim_value_score)}
                        </div>
                        <div className="text-[10px] uppercase tracking-wide text-zinc-500">claim value</div>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                      <DataPill label="Priority" value={operator.claim_priority ?? "unset"} className={priorityClass(operator.claim_priority)} />
                      <DataPill label="Source" value={operator.competitor_source ?? operator.source ?? "competitor"} />
                      <DataPill label="Claimed" value={operator.is_claimed ? "yes" : "no"} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/admin/directory?operator=${operator.id}`}
                        className="rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-[#ffb400]/50 hover:text-[#ffb400]"
                      >
                        Review operator
                      </Link>
                      {operator.competitor_profile_url ? (
                        <a
                          href={operator.competitor_profile_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-[#ffb400]/50 hover:text-[#ffb400]"
                        >
                          Competitor source
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </section>

        <Panel
          title="Immediate Claim Plays"
          description="Unclaimed competitor-sourced operators to route into outreach or manual review before competitors keep the market relationship."
        >
          {topClaimTargets.length === 0 ? (
            <EmptyState>No unclaimed competitor-sourced operators are currently returned.</EmptyState>
          ) : (
            <div className="grid gap-3 lg:grid-cols-5">
              {topClaimTargets.map((operator) => (
                <div key={operator.id} className="rounded-lg border border-white/10 bg-[#0b0b0b] p-4">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-[#ffb400]">
                    Score {numberValue(operator.claim_value_score)}
                  </div>
                  <h3 className="mt-2 text-sm font-black leading-tight text-white">{operator.company_name}</h3>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    {text(operator.region, text(operator.state, "Region unknown"))} / {text(operator.country_code, "Country unknown")}
                  </p>
                  <div className="mt-3 text-[11px] text-zinc-500">
                    {operator.competitor_source ?? operator.source ?? "competitor sourced"}
                  </div>
                  <Link
                    href={`/admin/directory?operator=${operator.id}`}
                    className="mt-4 inline-flex rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-[#ffb400]/50 hover:text-[#ffb400]"
                  >
                    Open review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="All Competitor Coverage Records"
          description="Full read-only table from competitor_intel. Use this to decide where claim, content, and acquisition work should move next."
        >
          {data.intel.length === 0 ? (
            <EmptyState>No competitor_intel rows are available in this environment.</EmptyState>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="min-w-[980px] w-full border-collapse text-left text-sm">
                <thead className="bg-white/[0.03] text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Competitor</th>
                    <th className="px-4 py-3">Country</th>
                    <th className="px-4 py-3">State / Region</th>
                    <th className="px-4 py-3 text-right">HC operators</th>
                    <th className="px-4 py-3 text-right">Competitor</th>
                    <th className="px-4 py-3 text-right">Delta</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {data.intel.map((row) => {
                    const status = normalizeStatus(row.our_status);
                    return (
                      <tr key={row.id} className="bg-[#0b0b0b]">
                        <td className="px-4 py-4 font-semibold text-white">{row.competitor_name}</td>
                        <td className="px-4 py-4 text-zinc-400">{text(row.country_code, "-")}</td>
                        <td className="px-4 py-4 text-zinc-400">{text(row.state, "-")}</td>
                        <td className="px-4 py-4 text-right text-zinc-300">{numberValue(row.our_operator_count)}</td>
                        <td className="px-4 py-4 text-right text-zinc-300">{numberValue(row.competitor_operator_count)}</td>
                        <td className="px-4 py-4 text-right font-black text-zinc-100">
                          {numberValue(row.coverage_delta) > 0 ? "+" : ""}
                          {numberValue(row.coverage_delta)}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusClass(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td className="max-w-xs px-4 py-4 text-xs leading-5 text-zinc-500">
                          {row.notes ?? "No notes"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "danger" | "warning" | "success";
}) {
  const toneClass =
    tone === "danger"
      ? "text-red-200"
      : tone === "warning"
        ? "text-amber-200"
        : tone === "success"
          ? "text-emerald-200"
          : "text-white";

  return (
    <div className="rounded-lg border border-white/10 bg-[#0b0b0b] p-5">
      <div className={`text-3xl font-black tracking-tight ${toneClass}`}>{value}</div>
      <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</div>
    </div>
  );
}

function StatusCard({ status, count }: { status: StatusKey; count: number }) {
  return (
    <div className={`rounded-lg border p-5 ${statusClass(status)}`}>
      <div className="text-sm font-black uppercase tracking-[0.18em]">{status}</div>
      <div className="mt-3 text-3xl font-black">{count}</div>
    </div>
  );
}

function ActionCard({
  title,
  value,
  body,
  tone = "neutral",
}: {
  title: string;
  value: string;
  body: string;
  tone?: "neutral" | "danger" | "warning";
}) {
  const toneClass =
    tone === "danger"
      ? "border-red-500/30 bg-red-500/10 text-red-100"
      : tone === "warning"
        ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
        : "border-white/10 bg-white/[0.03] text-zinc-100";

  return (
    <div className={`rounded-xl border p-5 ${toneClass}`}>
      <div className="text-[11px] font-black uppercase tracking-[0.18em] opacity-70">{title}</div>
      <div className="mt-3 text-2xl font-black tracking-tight">{value}</div>
      <p className="mt-3 text-sm leading-6 opacity-80">{body}</p>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-[#090909]">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-lg font-black tracking-tight text-white">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Alert({
  tone,
  title,
  children,
}: {
  tone: "danger" | "warning";
  title: string;
  children: ReactNode;
}) {
  const className =
    tone === "danger"
      ? "border-red-500/30 bg-red-500/10 text-red-100"
      : "border-amber-400/30 bg-amber-400/10 text-amber-100";
  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      <h2 className="font-black">{title}</h2>
      <p className="mt-1 text-sm opacity-90">{children}</p>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-zinc-500">
      {children}
    </div>
  );
}

function DataPill({
  label,
  value,
  className = "text-zinc-300",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">{label}</div>
      <div className={`mt-1 truncate font-bold ${className}`}>{value}</div>
    </div>
  );
}
