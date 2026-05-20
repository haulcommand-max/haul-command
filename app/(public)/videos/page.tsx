import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site-url";
import { buildStarterVideoCollection, getStarterVideos } from "@/lib/media/starter-videos";

export const metadata: Metadata = {
  title: "Heavy Haul Video Library | Haul Command",
  description: "Watch Haul Command videos for pilot cars, escort requirements, route surveys, permit costs, corridor planning, operator profiles, and sponsor education.",
  alternates: { canonical: "https://www.haulcommand.com/videos" },
  openGraph: {
    title: "Heavy Haul Video Library | Haul Command",
    description: "Short heavy-haul videos with transcripts, captions, VideoObject schema, and next-action paths.",
    url: "https://www.haulcommand.com/videos",
    siteName: "Haul Command",
    type: "website",
  },
};

export default function VideosPage() {
  const videos = getStarterVideos();

  return (
    <main className="min-h-screen bg-[#0b0f14] text-white">
      <JsonLd data={buildStarterVideoCollection()} />
      <section className="border-b border-white/10 bg-[#0f1720]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#f1a91b]">Video command library</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            Heavy-haul videos that turn answers into action.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">
            Each video includes captions, transcript, schema, internal links, and a direct next step for brokers, carriers, operators, sponsors, or training users.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/directory" className="rounded-md bg-[#f1a91b] px-4 py-2 text-sm font-black text-black">
              Find support
            </Link>
            <Link href="/loads/post" className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white">
              Post demand
            </Link>
            <Link href="/training" className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white">
              Training
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
        {videos.map((video) => (
          <Link
            key={video.id}
            href={video.watchPage}
            className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] transition hover:border-[#f1a91b]/70 hover:bg-white/[0.07]"
          >
            <div className="aspect-video overflow-hidden bg-black">
              <img
                src={video.thumbnailPath}
                alt={`${video.title} video thumbnail`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                <span>{video.engine}</span>
                <span>{video.durationSeconds}s</span>
              </div>
              <h2 className="mt-3 text-lg font-black leading-tight text-white">{video.title}</h2>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{video.hook}</p>
              <div className="mt-4 text-sm font-bold text-[#f1a91b]">{video.cta}</div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
