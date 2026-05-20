import { describe, expect, it } from "vitest";
import { buildStarterVideoPacketMarkdown, getStarterVideoPackets } from "../../scripts/media/generate-video-packets.mjs";

describe("starter video packet generator", () => {
  it("creates a practical no-Elai starter set for today", () => {
    const packets = getStarterVideoPackets();

    expect(packets.length).toBeGreaterThanOrEqual(10);
    expect(packets.every((packet) => packet.engine !== "heygen_avatar")).toBe(true);
    expect(packets.every((packet) => packet.engine !== "elai")).toBe(true);
    expect(packets.every((packet) => packet.money_path && packet.money_path !== "none")).toBe(true);
    expect(packets.every((packet) => packet.source_page.startsWith("/"))).toBe(true);
    expect(packets.every((packet) => packet.watch_page.startsWith("/videos/"))).toBe(true);
    expect(packets.every((packet) => packet.cta.length > 0)).toBe(true);
  });

  it("exports production-ready metadata and packet requirements", () => {
    const markdown = buildStarterVideoPacketMarkdown();

    expect(markdown).toContain("Required packet: transcript, captions, thumbnail");
    expect(markdown).toContain("Remotion");
    expect(markdown).toContain("HyperFrames");
    expect(markdown).toContain("avoid Elai");
  });
});
