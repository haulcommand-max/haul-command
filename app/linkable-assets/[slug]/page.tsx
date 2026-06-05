import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareEmbedPanel } from "@/components/link-pr/ShareEmbedPanel";
import {
  canIndexLinkableAsset,
  getLinkableAssetBySlug,
  getLinkableAssetScore,
  getLinkableAssets,
} from "@/lib/growth/linkable-asset-registry";

type LinkableAssetPageProps = {
  params: Promise<{ slug: string }>;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://haulcommand.com";

export function generateStaticParams() {
  return getLinkableAssets().map((asset) => ({ slug: asset.slug }));
}

export async function generateMetadata({ params }: LinkableAssetPageProps): Promise<Metadata> {
  const { slug } = await params;
  const asset = getLinkableAssetBySlug(slug);
  if (!asset) {
    return {
      title: "Linkable Asset | Haul Command",
      robots: { index: false, follow: true },
    };
  }

  const indexable = canIndexLinkableAsset(asset);
  return {
    title: `${asset.title} | Haul Command`,
    description: asset.summary,
    alternates: {
      canonical: `/linkable-assets/${asset.slug}`,
    },
    robots: {
      index: indexable,
      follow: true,
    },
  };
}

function mediaStatusLabel(status: string): string {
  if (status === "ready") return "Ready";
  if (status === "blocked") return "Blocked";
  return "Planned";
}

export default async function LinkableAssetDetailPage({ params }: LinkableAssetPageProps) {
  const { slug } = await params;
  const asset = getLinkableAssetBySlug(slug);
  if (!asset) notFound();

  const score = getLinkableAssetScore(asset);
  const canonicalUrl = `${SITE_URL}/linkable-assets/${asset.slug}`;

  return (
    <main className="min-h-screen bg-[#0B0F14] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(241,169,27,0.18),transparent_34rem)]">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <Link href="/linkable-assets" className="text-sm font-semibold text-[#F1A91B] hover:text-[#d4950e]">
            Back to asset library
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#F1A91B]/30 bg-[#F1A91B]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#F1A91B]">
              {asset.status === "source_review" ? "Source review" : asset.status}
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
              {canIndexLinkableAsset(asset) ? "Index eligible" : "Noindex until sourced"}
            </span>
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">{asset.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/70">{asset.summary}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          <section className="rounded-lg border border-white/10 bg-white/[0.035] p-6">
            <h2 className="text-xl font-bold text-white">Methodology and Source Status</h2>
            <p className="mt-3 text-sm leading-6 text-white/68">{asset.methodologyNote}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-white/10 bg-[#0B0F14] p-4">
                <div className="text-2xl font-black text-white">{asset.sourceConfidence}/100</div>
                <div className="mt-1 text-xs text-white/45">source confidence</div>
              </div>
              <div className="rounded-md border border-white/10 bg-[#0B0F14] p-4">
                <div className="text-2xl font-black text-white">{score.linkabilityScore}/100</div>
                <div className="mt-1 text-xs text-white/45">linkability</div>
              </div>
              <div className="rounded-md border border-white/10 bg-[#0B0F14] p-4">
                <div className="text-2xl font-black text-white">{score.shareabilityScore}/100</div>
                <div className="mt-1 text-xs text-white/45">shareability</div>
              </div>
            </div>
            {asset.sourceUrls.length > 0 ? (
              <ul className="mt-5 space-y-2">
                {asset.sourceUrls.map((sourceUrl) => (
                  <li key={sourceUrl}>
                    <a href={sourceUrl} className="text-sm text-[#F1A91B] hover:text-[#d4950e]" rel="noopener noreferrer" target="_blank">
                      {sourceUrl}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 rounded-md border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
                Source list pending. This asset should not be indexed, pitched, or represented as verified until official source links are added.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.035] p-6">
            <h2 className="text-xl font-bold text-white">Media and Embed Plan</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Object.entries(asset.media).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between rounded-md border border-white/10 bg-[#0B0F14] px-4 py-3">
                  <span className="text-sm capitalize text-white/70">{key.replace(/([A-Z])/g, " $1")}</span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold text-white/55">{mediaStatusLabel(value)}</span>
                </div>
              ))}
            </div>
          </section>

          <ShareEmbedPanel
            title={asset.title}
            description={asset.summary}
            canonicalUrl={canonicalUrl}
            campaign={asset.slug.replace(/-/g, "_")}
            embedAvailable={asset.media.embedCode === "ready"}
          />
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <h2 className="text-lg font-bold text-white">Journalist Angle</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">{asset.journalistPitchAngle}</p>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <h2 className="text-lg font-bold text-white">Podcast Talking Points</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-white/65">
              {asset.podcastTalkingPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <h2 className="text-lg font-bold text-white">Connected Surfaces</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {asset.relatedRoutes.map((route) => (
                <Link key={route} href={route} className="rounded border border-white/10 px-2.5 py-1 text-xs font-semibold text-white/60 hover:border-[#F1A91B]/50 hover:text-[#F1A91B]">
                  {route}
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
