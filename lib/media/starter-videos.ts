import starterSet from "@/docs/media/video-packets/starter-set.json";

export type StarterVideoPacket = {
  id: string;
  slug: string;
  priority: number;
  title: string;
  lane: string;
  engine: string;
  moneyPath: string;
  audience: string;
  sourcePage: string;
  secondaryPages: string[];
  watchPage: string;
  hook: string;
  script: string[];
  captions: string[];
  cta: string;
  youtube: {
    title: string;
    description: string;
    tags: string[];
  };
  durationSeconds: number;
  videoPath: string;
  thumbnailPath: string;
  captionsPath: string;
  transcript: string;
};

type RawStarterPacket = {
  id: string;
  priority: number;
  title: string;
  lane: string;
  engine: string;
  money_path: string;
  audience: string;
  source_page: string;
  secondary_pages: string[];
  watch_page: string;
  hook: string;
  script: string[];
  captions: string[];
  cta: string;
  youtube: {
    title: string;
    description: string;
    tags: string[];
  };
};

type RawStarterSet = {
  packets: RawStarterPacket[];
};

const PUBLIC_VIDEO_DIR = "/media/starter-videos";

function slugFromWatchPage(watchPage: string) {
  const slug = watchPage.split("/").filter(Boolean).pop();
  return slug || watchPage;
}

function durationSecondsFor(packet: RawStarterPacket) {
  return 4 + packet.script.length * 5 + 5;
}

function toIsoDuration(seconds: number) {
  return `PT${Math.max(1, Math.round(seconds))}S`;
}

function buildTranscript(packet: RawStarterPacket) {
  return [packet.hook, ...packet.script, packet.cta].join("\n\n");
}

export function getStarterVideos(): StarterVideoPacket[] {
  const raw = starterSet as RawStarterSet;
  return raw.packets
    .map((packet) => ({
      id: packet.id,
      slug: slugFromWatchPage(packet.watch_page),
      priority: packet.priority,
      title: packet.title,
      lane: packet.lane,
      engine: packet.engine,
      moneyPath: packet.money_path,
      audience: packet.audience,
      sourcePage: packet.source_page,
      secondaryPages: packet.secondary_pages,
      watchPage: packet.watch_page,
      hook: packet.hook,
      script: packet.script,
      captions: packet.captions,
      cta: packet.cta,
      youtube: packet.youtube,
      durationSeconds: durationSecondsFor(packet),
      videoPath: `${PUBLIC_VIDEO_DIR}/${packet.id}.webm`,
      thumbnailPath: `${PUBLIC_VIDEO_DIR}/${packet.id}.png`,
      captionsPath: `${PUBLIC_VIDEO_DIR}/${packet.id}.vtt`,
      transcript: buildTranscript(packet),
    }))
    .sort((a, b) => a.priority - b.priority);
}

export function getStarterVideoBySlug(slug: string) {
  return getStarterVideos().find((video) => video.slug === slug || video.id === slug) ?? null;
}

export function getStarterVideoStaticParams() {
  return getStarterVideos().map((video) => ({ slug: video.slug }));
}

export function buildStarterVideoObject(video: StarterVideoPacket, siteUrl = "https://www.haulcommand.com") {
  const canonicalUrl = `${siteUrl}${video.watchPage}`;
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.youtube.title,
    description: video.youtube.description,
    thumbnailUrl: [`${siteUrl}${video.thumbnailPath}`],
    uploadDate: "2026-05-20",
    duration: toIsoDuration(video.durationSeconds),
    contentUrl: `${siteUrl}${video.videoPath}`,
    embedUrl: canonicalUrl,
    transcript: video.transcript,
    publisher: {
      "@type": "Organization",
      name: "Haul Command",
      url: siteUrl,
    },
    potentialAction: {
      "@type": "WatchAction",
      target: canonicalUrl,
    },
  };
}

export function buildStarterVideoCollection(siteUrl = "https://www.haulcommand.com") {
  const videos = getStarterVideos();
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Haul Command Video Library",
    description: "Short, source-backed heavy-haul videos with transcripts, captions, and next-action paths.",
    url: `${siteUrl}/videos`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: videos.map((video, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: video.title,
        url: `${siteUrl}${video.watchPage}`,
      })),
    },
  };
}
