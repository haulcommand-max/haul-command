import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Escort Requirement Checker | Haul Command",
  description:
    "Route oversize load requirement intent to source-cautious escort requirement checks, jurisdiction pages, and permit authority verification steps.",
  alternates: {
    canonical: "https://www.haulcommand.com/tools/escort-requirement-checker",
  },
};

const requirementChecks = [
  {
    label: "Load dimensions",
    detail:
      "Width, height, length, weight, overhang, and commodity can each change escort, route survey, and police coordination requirements.",
  },
  {
    label: "Jurisdiction path",
    detail:
      "Every state, province, country, bridge authority, port, and municipality on the route can add conditions to the permit.",
  },
  {
    label: "Movement conditions",
    detail:
      "Night movement, weekend curfews, holiday limits, weather, construction, and local law enforcement availability can change the final answer.",
  },
];

const sourcePaths = [
  {
    href: "/escort-requirements",
    title: "State escort requirement guides",
    body: "Start with the source-backed requirement library before turning the move into a dispatch or pricing workflow.",
  },
  {
    href: "/tools/state-requirements",
    title: "Requirement quick reference",
    body: "Use the cheatsheet as a planning shortcut, then verify the current permit language with the authority of record.",
  },
  {
    href: "/regulations",
    title: "Regulation hub",
    body: "Check country and jurisdiction summaries when the move crosses borders or leaves the United States.",
  },
];

export default function EscortRequirementCheckerPage() {
  return (
    <main className="min-h-screen bg-[#080b10] text-white">
      <section className="border-b border-amber-400/15 bg-[linear-gradient(180deg,#101820,#080b10)] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 text-xs font-black uppercase tracking-[0.14em] text-amber-300">
            Requirement routing
          </div>
          <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            Escort Requirement Checker
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-300 sm:text-lg">
            Use this page to check what usually drives pilot car, height pole,
            police escort, and route survey requirements before a load is quoted
            or dispatched. This is a planning screen, not a legal determination.
          </p>
          <div className="mt-6 rounded-lg border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
            Local permit authority must verify final legal requirements before
            dispatch. Permit offices, bridge owners, police agencies, ports, and
            municipalities can impose conditions that override planning guidance.
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        {requirementChecks.map((check) => (
          <article
            key={check.label}
            className="rounded-lg border border-white/10 bg-white/[0.04] p-5"
          >
            <h2 className="text-lg font-black text-white">{check.label}</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{check.detail}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-white/10 bg-black/35 p-5">
          <h2 className="text-xl font-black text-white">Source-cautious next steps</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">
            Requirement intent should stay on requirement and regulation surfaces.
            Use pricing tools only after the route, dimensions, and permit
            conditions have been checked against the authority of record.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {sourcePaths.map((path) => (
              <Link
                key={path.href}
                href={path.href}
                className="rounded-lg border border-amber-400/20 bg-amber-400/8 p-4 transition hover:border-amber-300/60 hover:bg-amber-400/12"
              >
                <span className="block text-sm font-black text-amber-200">{path.title}</span>
                <span className="mt-2 block text-xs leading-5 text-zinc-300">{path.body}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
