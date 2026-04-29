import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildRegulatoryJsonLd, getWatchItem, isIndexableRegulatoryItem } from '@/lib/regulatory-watch';
import { RegulatoryWatchCard } from '@/components/regulatory/RegulatoryWatchCard';
import { CommentDeadlineCountdown } from '@/components/regulatory/CommentDeadlineCountdown';

interface PageProps {
  params: Promise<{ docketId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { docketId } = await params;
  const item = await getWatchItem(decodeURIComponent(docketId));

  if (!item) {
    return { title: 'FMCSA regulatory watch item not found | Haul Command', robots: { index: false, follow: false } };
  }

  const indexable = isIndexableRegulatoryItem(item);
  return {
    title: `${item.title} | Haul Command Regulatory Watch`,
    description: item.plain_english ?? item.summary ?? `Track ${item.docket_id} with Haul Command Regulatory Watch.`,
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    alternates: {
      canonical: item.page_slug ? `https://www.haulcommand.com/${item.page_slug}` : `https://www.haulcommand.com/regulations/us/fmcsa/${item.docket_id}`,
    },
  };
}

export default async function FmcsaDocketPage({ params }: PageProps) {
  const { docketId } = await params;
  const item = await getWatchItem(decodeURIComponent(docketId));

  if (!item) notFound();

  const jsonLd = buildRegulatoryJsonLd(item);
  const sourceUrl = item.source_urls[0] ?? 'https://www.regulations.gov/';
  const indexable = isIndexableRegulatoryItem(item);

  return (
    <main className="min-h-screen bg-[#070a11] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {!indexable && (
        <div className="border-b border-amber-400/20 bg-amber-400/10 px-4 py-2 text-center text-xs font-semibold text-amber-100">
          Preview/noindex: this regulatory item requires human review before public indexing.
        </div>
      )}

      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <Link href="/regulations" className="hover:text-white">Regulations</Link>
          <span>/</span>
          <Link href="/regulatory-radar" className="hover:text-white">Regulatory Radar</Link>
          <span>/</span>
          <span>{item.docket_id}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <article>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-[#C6923A]/40 bg-[#C6923A]/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#f2c76b]">
                {item.agency_name} docket
              </span>
              <CommentDeadlineCountdown deadline={item.comment_deadline} status={item.status} />
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">{item.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{item.plain_english}</p>

            {item.status === 'comment_open' && item.comment_deadline && (
              <div className="mt-8 rounded-2xl border border-red-400/30 bg-red-500/10 p-5">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-red-100">Public comment open</div>
                <p className="mt-2 text-xl font-black text-white">Comment deadline: May 15, 2026</p>
                <p className="mt-2 text-sm leading-6 text-red-100/90">Safety directors, carriers, pilot car operators, insurers, and equipment suppliers should review whether beacon-only warning systems are adequate across hills, curves, fog, dust, construction zones, and stalled-vehicle power failures.</p>
                <a href={sourceUrl} className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-bold text-black" target="_blank" rel="noreferrer">
                  View FMCSA docket
                </a>
              </div>
            )}

            <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-2xl font-black">Plain-English summary</h2>
              <p className="mt-4 leading-7 text-slate-300">{item.summary}</p>
              <p className="mt-4 text-sm text-slate-400">Source: <a className="text-[#C6923A] underline" href={sourceUrl} target="_blank" rel="noreferrer">FMCSA Docket {item.docket_id}</a></p>
            </section>

            <section className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-5">
                <h2 className="text-xl font-black text-emerald-100">Arguments for beacons</h2>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-emerald-50/90">
                  <li>Cab-mounted beacons may be visible without requiring a human driver to exit the vehicle.</li>
                  <li>Automated activation can reduce exposure for driverless vehicles stopped on high-speed roads.</li>
                  <li>Telemetry and remote operations may support faster incident awareness if reporting is required.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-5">
                <h2 className="text-xl font-black text-red-100">Arguments against beacon-only warning</h2>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-red-50/90">
                  <li>Physical triangles create an advance warning zone behind a stopped truck.</li>
                  <li>Curves, hills, fog, dust, and work zones can hide a cab-mounted beacon until drivers are too close.</li>
                  <li>Power loss, equipment failure, or damaged beacon systems may remove the only warning layer.</li>
                </ul>
              </div>
            </section>

            <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-2xl font-black">Corridor and role implications</h2>
              <p className="mt-4 leading-7 text-slate-300">Haul Command tracks this because roadside warning-device exemptions can affect corridor risk, pilot car emergency procedures, carrier liability, equipment demand, insurance review, and autonomous freight recovery roles.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {item.affected_roles.map((role) => <span key={role} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">{role.replace(/_/g, ' ')}</span>)}
              </div>
            </section>

            <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-2xl font-black">Affected rules</h2>
              <ul className="mt-4 grid gap-3 md:grid-cols-3">
                {item.affected_rules.map((rule) => <li key={rule} className="rounded-xl border border-white/10 bg-slate-950 p-4 text-sm font-semibold text-slate-200">{rule}</li>)}
              </ul>
            </section>

            <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-2xl font-black">Last verified and corrections</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">Last verified: {new Date(item.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <Link href="/contact" className="mt-4 inline-flex rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/10">Report a correction</Link>
            </section>
          </article>

          <aside className="space-y-5">
            <RegulatoryWatchCard {...item} />
            <div className="rounded-2xl border border-[#C6923A]/30 bg-[#C6923A]/10 p-5">
              <h2 className="text-lg font-black text-[#f2c76b]">Regulatory Radar</h2>
              <p className="mt-2 text-sm leading-6 text-slate-200">Get alerts when exemptions, comment windows, and equipment rules affect your role or corridor.</p>
              <Link href="/regulatory-radar" className="mt-4 inline-flex rounded-xl bg-[#C6923A] px-4 py-2 text-sm font-bold text-black">Track rule changes</Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
