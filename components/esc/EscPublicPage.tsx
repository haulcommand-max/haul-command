import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

import type { EscPublicPage } from "@/lib/esc/esc-public-content";

export function EscPublicPage({ page }: { page: EscPublicPage }) {
  return (
    <main className="min-h-screen bg-[#070707] text-zinc-100">
      <section className="border-b border-amber-500/15 bg-[radial-gradient(circle_at_top,rgba(245,166,35,0.14),transparent_38%),linear-gradient(180deg,#101010,#070707)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-black/45 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-amber-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            {page.eyebrow}
          </div>
          <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl">
            {page.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-300 sm:text-lg">
            {page.description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={page.primaryCta.href}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-400 px-5 py-3 text-sm font-black text-black shadow-[0_18px_50px_rgba(245,166,35,0.18)] transition hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              {page.primaryCta.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
            {page.secondaryCta ? (
              <Link
                href={page.secondaryCta.href}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-amber-400/30 bg-black/45 px-5 py-3 text-sm font-bold text-amber-100 transition hover:border-amber-300/70 hover:bg-amber-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                {page.secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        {page.sections.map((section) => (
          <article
            key={section.heading}
            className="rounded-lg border border-white/10 bg-black/42 p-5 shadow-[0_16px_60px_rgba(0,0,0,0.24)]"
          >
            <h2 className="text-xl font-black text-white">{section.heading}</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{section.body}</p>
            <ul className="mt-5 space-y-3">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3 text-sm leading-6 text-zinc-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-400" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/8 p-5">
          <h2 className="text-lg font-black text-white">Connected Haul Command paths</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {page.relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-10 items-center rounded-full border border-amber-400/25 bg-black/45 px-4 text-sm font-bold text-amber-100 transition hover:border-amber-300/70 hover:bg-amber-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
