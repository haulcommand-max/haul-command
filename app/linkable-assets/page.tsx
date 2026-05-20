import type { Metadata } from "next";
import Link from "next/link";
import { getLinkableAssetScore, getLinkableAssets } from "@/lib/growth/linkable-asset-registry";

export const metadata: Metadata = {
  title: "Linkable Asset Library | Haul Command",
  description:
    "Source-review queue for Haul Command maps, guides, checklists, visuals, videos, and embed assets used in PR and authority building.",
  robots: {
    index: false,
    follow: true,
  },
};

function statusLabel(status: string): string {
  if (status === "source_review") return "Source review";
  if (status === "active") return "Active";
  return "Draft";
}

export default function LinkableAssetsPage() {
  const assets = getLinkableAssets();

  return (
    <main className="min-h-screen bg-[#0B0F14] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(241,169,27,0.18),transparent_36rem)]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F1A91B]">Link + PR + Share Engine</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">Haul Command Linkable Asset Library</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/70">
            Maps, checklists, visuals, source desks, videos, and embed-ready assets move through this queue before they are pitched,
            indexed, or used in journalist outreach. Draft assets stay noindexed until source confidence and methodology are strong enough.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <div className="text-3xl font-black text-white">{assets.length}</div>
              <div className="mt-1 text-sm text-white/55">asset briefs staged</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <div className="text-3xl font-black text-white">{assets.filter((asset) => asset.indexabilityStatus === "noindex").length}</div>
              <div className="mt-1 text-sm text-white/55">held from indexing until sourced</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <div className="text-3xl font-black text-white">{assets.filter((asset) => asset.media.embedCode !== "blocked").length}</div>
              <div className="mt-1 text-sm text-white/55">embed paths planned</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-4 md:grid-cols-2">
          {assets.map((asset) => {
            const score = getLinkableAssetScore(asset);
            return (
              <Link
                key={asset.slug}
                href={`/linkable-assets/${asset.slug}`}
                className="group rounded-lg border border-white/10 bg-white/[0.035] p-5 transition hover:border-[#F1A91B]/60 hover:bg-white/[0.055]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#F1A91B]/30 bg-[#F1A91B]/10 px-2.5 py-1 text-xs font-semibold text-[#F1A91B]">
                    {statusLabel(asset.status)}
                  </span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold text-white/55">
                    {asset.indexabilityStatus === "index" ? "Index ready" : "Noindex"}
                  </span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold text-white/55">
                    Linkability {score.linkabilityScore}/100
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-bold text-white group-hover:text-[#F1A91B]">{asset.title}</h2>
                <p className="mt-3 text-sm leading-6 text-white/65">{asset.summary}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {asset.topicTags.slice(0, 4).map((tag) => (
                    <span key={tag} className="rounded border border-white/10 px-2 py-1 text-xs text-white/45">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
