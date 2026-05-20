import { describe, expect, it } from "vitest";
import { buildCompositionHtml, buildStarterRenderPlan } from "../../scripts/media/render-starter-video.mjs";
import { getStarterVideoPackets } from "../../scripts/media/generate-video-packets.mjs";

describe("starter video renderer", () => {
  it("builds a timed render plan from a packet", () => {
    const [packet] = getStarterVideoPackets();
    const plan = buildStarterRenderPlan(packet);

    expect(plan.id).toBe("what-is-a-pilot-car");
    expect(plan.durationSeconds).toBeGreaterThan(30);
    expect(plan.scenes[0].kind).toBe("intro");
    expect(plan.scenes.at(-1)?.kind).toBe("cta");
  });

  it("builds a self-contained Haul Command composition", () => {
    const [packet] = getStarterVideoPackets();
    const plan = buildStarterRenderPlan(packet);
    const html = buildCompositionHtml(packet, plan);

    expect(html).toContain("HAUL COMMAND");
    expect(html).toContain("window.__setFrame");
    expect(html).toContain(packet.title);
    expect(html).toContain(packet.source_page);
  });
});
