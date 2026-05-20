import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildStarterVideoObject,
  getStarterVideoBySlug,
  getStarterVideos,
} from "../../lib/media/starter-videos";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("starter video watch pages", () => {
  it("has public video, thumbnail, and caption assets for every starter video", () => {
    const videos = getStarterVideos();

    expect(videos).toHaveLength(12);
    for (const video of videos) {
      expect(video.watchPage).toBe(`/videos/${video.slug}`);
      expect(video.transcript.length).toBeGreaterThan(160);
      expect(existsSync(join(process.cwd(), "public", video.videoPath))).toBe(true);
      expect(existsSync(join(process.cwd(), "public", video.thumbnailPath))).toBe(true);
      expect(existsSync(join(process.cwd(), "public", video.captionsPath))).toBe(true);
      expect(getStarterVideoBySlug(video.slug)?.id).toBe(video.id);
    }
  });

  it("emits VideoObject-ready schema data", () => {
    const video = getStarterVideos()[0];
    const schema = buildStarterVideoObject(video);

    expect(schema["@type"]).toBe("VideoObject");
    expect(schema.contentUrl).toContain(video.videoPath);
    expect(schema.thumbnailUrl[0]).toContain(video.thumbnailPath);
    expect(schema.transcript).toContain(video.script[0]);
  });

  it("renders watch pages with transcript, captions, and next-action paths", () => {
    const page = read("app/(public)/videos/[slug]/page.tsx");

    expect(page).toContain("VideoObject");
    expect(page).toContain("<track kind=\"captions\"");
    expect(page).toContain("Transcript");
    expect(page).toContain("Ask Haul Command");
    expect(page).toContain("Related pages");
  });
});
