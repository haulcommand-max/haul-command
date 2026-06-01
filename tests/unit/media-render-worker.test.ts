import { describe, expect, it, vi } from "vitest";
import { buildHyperframesRenderPayload, runMediaRenderWorker } from "@/workers/media-render.worker";

type FakeJob = Parameters<typeof buildHyperframesRenderPayload>[0];

type FakeUpdate = {
  table: string;
  payload: Record<string, unknown>;
};

function createSupabaseFake(jobs: FakeJob[]) {
  const updates: FakeUpdate[] = [];
  const inserts: FakeUpdate[] = [];

  return {
    updates,
    inserts,
    from(table: string) {
      const query = {
        select() {
          return query;
        },
        in() {
          return query;
        },
        lt() {
          return query;
        },
        order() {
          return query;
        },
        limit() {
          return Promise.resolve({ data: jobs, error: null });
        },
        update(payload: Record<string, unknown>) {
          updates.push({ table, payload });
          return {
            eq() {
              return Promise.resolve({ error: null });
            },
          };
        },
        insert(payload: Record<string, unknown>) {
          inserts.push({ table, payload });
          return Promise.resolve({ error: null });
        },
      };
      return query;
    },
  };
}

describe("media render worker", () => {
  it("builds a HyperFrames-ready payload from the Supabase queue row", () => {
    const payload = buildHyperframesRenderPayload({
      id: "job-1",
      object_type: "claim",
      object_id: "operator-1",
      object_label: "Florida high-pole operator",
      country: "US",
      region: "FL",
      city: null,
      corridor: "I-75 Florida",
      role: "high_pole_operator",
      language: "en",
      locale: "en-US",
      template_id: "claim-profile-proof",
      video_format: "fifteen_second",
      tone: "urgent-proof",
      source_page: "/directory/us/operator-1",
      script_hints: ["claim", "gear proof"],
      cta: "Claim your profile",
      priority: "high",
      worker_attempts: 0,
    });

    expect(payload.brand).toBe("Haul Command");
    expect(payload.template_id).toBe("claim-profile-proof");
    expect(payload.cta).toBe("Claim your profile");
  });

  it("leaves jobs queued when no HyperFrames renderer endpoint is configured", async () => {
    const supabase = createSupabaseFake([{ id: "job-1", worker_attempts: 0 }]);
    const result = await runMediaRenderWorker({ supabase, rendererEndpoint: null });

    expect(result.configured).toBe(false);
    expect(result.skipped_count).toBe(1);
    expect(supabase.updates).toHaveLength(0);
  });

  it("submits queued jobs to the configured renderer endpoint and records the provider", async () => {
    const supabase = createSupabaseFake([
      {
        id: "job-1",
        object_type: "claim",
        object_id: "operator-1",
        object_label: "Operator",
        country: "US",
        region: "FL",
        city: null,
        corridor: null,
        role: "pilot_car_operator",
        language: "en",
        locale: "en-US",
        template_id: "claim-profile-proof",
        video_format: "fifteen_second",
        tone: null,
        source_page: "/directory/us/operator-1",
        script_hints: [],
        cta: "Claim profile",
        priority: "normal",
        worker_attempts: 0,
      },
    ]);
    const fetchImpl = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>().mockResolvedValue({
      ok: true,
      json: async () => ({ external_job_id: "hf-1", storage_url: "https://cdn.example/video.mp4" }),
    } as Response);

    const result = await runMediaRenderWorker({
      supabase,
      rendererEndpoint: "https://renderer.example/render",
      rendererToken: "token",
      fetchImpl,
    });

    expect(result.submitted_count).toBe(1);
    expect(result.visual_assets_registered).toBe(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://renderer.example/render",
      expect.objectContaining({ method: "POST" }),
    );
    expect(supabase.inserts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table: "visual_assets",
          payload: expect.objectContaining({
            asset_type: "hero_video",
            storage_bucket: "visual-assets",
            cdn_url: "https://cdn.example/video.mp4",
            format: "mp4",
            approval_status: "pending_review",
          }),
        }),
      ]),
    );
    expect(supabase.updates.at(-1).payload).toEqual(
      expect.objectContaining({
        external_provider: "hyperframes",
        render_status: "rendered",
        performance_metrics: expect.objectContaining({ visual_asset_registered: true }),
      }),
    );
  });
});
