import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site-url";
import {
  buildStarterVideoObject,
  getStarterVideoBySlug,
  getStarterVideoStaticParams,
} from "@/lib/media/starter-videos";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const generateStaticParams = getStarterVideoStaticParams;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const video = getStarterVideoBySlug(slug);
  if (!video) return {};

  return {
    title: `${video.title} | Haul Command Video`,
    description: video.youtube.description,
    alternates: { canonical: absoluteUrl(video.watchPage) },
    openGraph: {
      title: video.youtube.title,
      description: video.youtube.description,
      url: absoluteUrl(video.watchPage),
      siteName: "Haul Command",
      type: "video.other",
      images: [{ url: absoluteUrl(video.thumbnailPath), alt: `${video.title} thumbnail` }],
      videos: [{ url: absoluteUrl(video.videoPath), type: "video/webm" }],
    },
  };
}

export default async function VideoWatchPage({ params }: PageProps) {
  const { slug } = await params;
  const video = getStarterVideoBySlug(slug);
  if (!video) notFound();

  const relatedLinks = [video.sourcePage, ...video.secondaryPages].filter(Boolean);

  return (
    <main className="min-h-screen bg-[#0b0f14] text-white">
      <JsonLd data={buildStarterVideoObject(video)} />

      <section className="border-b border-white/10 bg-[#0f1720]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/videos" className="text-sm font-bold text-[#f1a91b]">
            Video library
          </Link>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{video.title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">{video.hook}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Money path</div>
              <div className="mt-2 text-lg font-black text-white">{video.moneyPath.replace(/_/g, " ")}</div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{video.audience}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div>
          <div className="overflow-hidden rounded-lg border border-white/10 bg-black">
            <video
              className="aspect-video w-full bg-black"
              controls
              poster={video.thumbnailPath}
              preload="metadata"
            >
              <source src={video.videoPath} type="video/webm" />
              <track kind="captions" src={video.captionsPath} srcLang="en" label="English captions" default />
            </video>
          </div>

          <section className="mt-8 rounded-lg border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-xl font-black">Transcript</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
              <p>{video.hook}</p>
              {video.script.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p className="font-bold text-white">{video.cta}</p>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-[#f1a91b]/30 bg-[#f1a91b]/10 p-5">
            <h2 className="text-lg font-black text-white">Next action</h2>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Ask Haul Command to walk you through this, then move into the correct tool, directory, training, or claim path.
            </p>
            <div className="mt-4 grid gap-2">
              <Link href="/chat" className="rounded-md bg-[#f1a91b] px-4 py-2 text-center text-sm font-black text-black">
                Ask Haul Command
              </Link>
              <Link href={video.sourcePage} className="rounded-md border border-white/15 px-4 py-2 text-center text-sm font-semibold text-white">
                {video.cta}
              </Link>
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-lg font-black">Related pages</h2>
            <div className="mt-4 grid gap-2">
              {relatedLinks.map((href) => (
                <Link key={href} href={href} className="rounded-md border border-white/10 px-3 py-2 text-sm text-slate-200 hover:border-[#f1a91b]/60">
                  {href}
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-lg font-black">Publishing packet</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>VideoObject schema: ready</li>
              <li>Transcript: visible</li>
              <li>Captions: attached</li>
              <li>Thumbnail: attached</li>
              <li>Sitemap path: public route</li>
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}
