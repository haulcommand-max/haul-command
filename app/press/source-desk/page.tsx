import type { Metadata } from "next";
import Link from "next/link";
import { buildJournalistModePrompt } from "@/lib/growth/link-pr-share-engine";

export const metadata: Metadata = {
  title: "Journalist Source Desk | Haul Command",
  description:
    "A source desk for journalists, podcasters, and newsletter editors looking for heavy-haul quotes, data, operators, visuals, and background.",
  robots: {
    index: false,
    follow: true,
  },
};

const sourceDeskIntents = [
  {
    key: "quote",
    title: "Need a Quote",
    prompt: buildJournalistModePrompt("quote"),
    detail: "Best for deadline-driven stories that need a plain-language heavy-haul, pilot-car, broker, safety, or data perspective.",
  },
  {
    key: "data",
    title: "Need Data",
    prompt: buildJournalistModePrompt("data"),
    detail: "Best for source-backed market snapshots, role context, terminology, regulations, and linkable asset methodology questions.",
  },
  {
    key: "source",
    title: "Need a Source",
    prompt: buildJournalistModePrompt("source"),
    detail: "Best for finding an operator, broker, insurer, trainer, permit specialist, or infrastructure contact by country, region, or topic.",
  },
  {
    key: "visual",
    title: "Need a Visual",
    prompt: buildJournalistModePrompt("visual"),
    detail: "Best for maps, diagrams, checklists, short videos, embeddable cards, and public safety explainers.",
  },
];

export default function PressSourceDeskPage() {
  return (
    <main className="min-h-screen bg-[#0B0F14] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(241,169,27,0.18),transparent_34rem)]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Link href="/press" className="text-sm font-semibold text-[#F1A91B] hover:text-[#d4950e]">
            Back to press
          </Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-[#F1A91B]">Journalist Source Desk</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">Quotes, data, sources, and visuals for heavy-haul coverage</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/70">
            Use this intake path when a story needs source-backed context about oversize transport, pilot cars, route support,
            safety, market structure, or heavy-haul operations. LiveKit voice intake can attach to these prompts without changing
            the public route contract.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="mailto:press@haulcommand.com?subject=Haul%20Command%20source%20request"
              className="rounded-md bg-[#F1A91B] px-4 py-2 text-sm font-semibold text-[#0B0F14] hover:bg-[#d4950e]"
            >
              Email source request
            </a>
            <Link href="/linkable-assets" className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white/75 hover:border-[#F1A91B]/60 hover:text-[#F1A91B]">
              View asset library
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12" data-livekit-mode="journalist-source-desk">
        <div className="grid gap-4 md:grid-cols-2">
          {sourceDeskIntents.map((intent) => (
            <article key={intent.key} className="rounded-lg border border-white/10 bg-white/[0.035] p-6">
              <h2 className="text-xl font-bold text-white">{intent.title}</h2>
              <p className="mt-3 text-sm leading-6 text-white/65">{intent.detail}</p>
              <div className="mt-5 rounded-md border border-[#F1A91B]/25 bg-[#F1A91B]/10 p-4">
                <p className="text-sm leading-6 text-amber-100">{intent.prompt}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-white/10 bg-white/[0.035] p-6">
          <h2 className="text-xl font-bold text-white">Source Request Guardrails</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-md border border-white/10 bg-[#0B0F14] p-4">
              <h3 className="font-semibold text-white">No unverified claims</h3>
              <p className="mt-2 text-sm leading-6 text-white/60">Market, demand, safety, and certification claims need source notes before publication or pitching.</p>
            </div>
            <div className="rounded-md border border-white/10 bg-[#0B0F14] p-4">
              <h3 className="font-semibold text-white">No private data</h3>
              <p className="mt-2 text-sm leading-6 text-white/60">Journalist support should use public, permissioned, aggregated, or anonymized context only.</p>
            </div>
            <div className="rounded-md border border-white/10 bg-[#0B0F14] p-4">
              <h3 className="font-semibold text-white">No link schemes</h3>
              <p className="mt-2 text-sm leading-6 text-white/60">Outreach should lead with useful context, not generic link requests or mass-pitched AI copy.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
