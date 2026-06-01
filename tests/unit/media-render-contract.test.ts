import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildMediaRenderInsert, listMediaTemplates, normalizeMediaRenderRequest } from "@/lib/contracts/mediaRender";
import { buildInsuranceSponsorMediaRequest, NELSON_INSURANCE_SEED_PARTNER } from "@/lib/insurance/insurance-os";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("media render contract", () => {
  it("maps Haul Command objects to industry-specific media templates", () => {
    const request = normalizeMediaRenderRequest({
      objectType: "corridor",
      objectId: "houston-dallas",
      videoFormat: "vertical",
      country: "US",
      role: "pilot_car_operator",
    });

    expect(request.object_type).toBe("corridor");
    expect(request.template_id).toBe("corridor-intelligence");
    expect(request.video_format).toBe("vertical");
  });

  it("keeps Graphify as a renderable report type without claiming a live vendor install", () => {
    const insert = buildMediaRenderInsert({ object_type: "graphify_report", object_id: "market-map-fl", source_page: "/hq/markets/fl" });

    expect(insert.object_type).toBe("graphify_report");
    expect(insert.template_id).toBe("graphify-market-map-video");
    expect(insert.render_status).toBe("queued");
  });

  it("publishes the full template catalog for dashboards and workers", () => {
    expect(listMediaTemplates()).toEqual(
      expect.arrayContaining([
        { object_type: "claim", template_id: "claim-profile-proof" },
        { object_type: "adgrid_sponsor", template_id: "adgrid-sponsor-video" },
        { object_type: "routeintel_movie", template_id: "routeintel-route-movie" },
      ]),
    );
  });

  it("renders insurance partner sponsor creatives through the existing AdGrid media template", () => {
    const insert = buildMediaRenderInsert(buildInsuranceSponsorMediaRequest({
      partner: NELSON_INSURANCE_SEED_PARTNER,
      country: "US",
      role: "pilot-car-operator",
      demandEventId: "demand-123",
    }));

    expect(insert.object_type).toBe("adgrid_sponsor");
    expect(insert.object_id).toBe("nelson-insurance-agency");
    expect(insert.template_id).toBe("adgrid-sponsor-video");
    expect(insert.sponsor_id).toBe("nelson-insurance-agency");
    expect(insert.demand_event_id).toBe("demand-123");
    expect(insert.script_hints.join(" ")).toContain("licensed insurance professionals");
    expect(insert.script_hints.join(" ")).not.toMatch(/policy_number|share_token|file_url/i);
  });

  it("does not let missing training videos mark lessons complete from the client", () => {
    const videoPlayer = read("components/training/VideoPlayer.tsx");

    expect(videoPlayer).toContain("Completion credit is not issued from a missing video");
    expect(videoPlayer).not.toContain("Skip Video & Mark Read");
    expect(videoPlayer).not.toContain("onProgress?.(100)");
  });

  it("verifies lessons and video watch gates before writing training progress", () => {
    const route = read("app/api/training/progress/route.ts");

    expect(route).toContain(".select('module_id, content_type, video_url')");
    expect(route).toContain("lesson_not_found");
    expect(route.indexOf("const { data: lesson } = await supabase")).toBeLessThan(
      route.indexOf("await supabase.from('user_lesson_progress').upsert"),
    );
    expect(route).toContain("lesson.content_type === 'video' && requestedComplete && !lesson.video_url");
    expect(route).not.toContain("lesson.content_type === 'video' && requestedComplete && watchPercent < 90");
    expect(route).toContain("lesson.content_type === 'video' && requestedComplete");
    expect(route).toContain("verified_watch_evidence_required");
  });

  it("keeps media render queue and result reads behind internal auth", () => {
    const route = read("app/api/media/render/route.ts");
    const postBody = route.slice(route.indexOf("export async function POST"), route.indexOf("export async function GET"));
    const getBody = route.slice(route.indexOf("export async function GET"));

    expect(route).toContain('import { requireInternalRequest } from "@/lib/security/internal-request-auth"');
    expect(route.match(/const authFailure = requireInternalRequest\(request\)/g)?.length).toBe(2);
    expect(postBody.indexOf("const authFailure = requireInternalRequest(request)")).toBeLessThan(
      postBody.indexOf("normalizeMediaRenderRequest"),
    );
    expect(getBody.indexOf("const authFailure = requireInternalRequest(request)")).toBeLessThan(
      getBody.indexOf("getSupabaseAdmin()"),
    );
  });
});
