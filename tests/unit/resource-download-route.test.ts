import { beforeEach, describe, expect, it, vi } from "vitest";

const upsertMock = vi.fn();
const updateMock = vi.fn();
const eqMock = vi.fn();
const fromMock = vi.fn();
const addSubscriberMock = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: fromMock,
  })),
}));

vi.mock("@/lib/email/listmonk-client", () => ({
  addSubscriber: addSubscriberMock,
}));

function jsonRequest(body: Record<string, unknown>) {
  return new Request("https://haulcommand.test/api/leads/resource-download", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      referer: "https://haulcommand.test/resources",
    },
    body: JSON.stringify(body),
  }) as any;
}

describe("resource download lead capture route", () => {
  beforeEach(() => {
    vi.resetModules();
    upsertMock.mockReset();
    updateMock.mockReset();
    eqMock.mockReset();
    fromMock.mockReset();
    addSubscriberMock.mockReset();

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
    process.env.LISTMONK_RESOURCE_LIST_ID = "2";

    eqMock.mockResolvedValue({ error: null });
    updateMock.mockReturnValue({ eq: vi.fn(() => ({ eq: eqMock })) });
    fromMock.mockReturnValue({ upsert: upsertMock, update: updateMock });
    upsertMock.mockResolvedValue({ error: null });
    addSubscriberMock.mockResolvedValue({ id: 42 });
  });

  it("rejects invalid JSON email submissions", async () => {
    const { POST } = await import("@/app/api/leads/resource-download/route");

    const res = await POST(jsonRequest({ email: "not-an-email" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Valid email required");
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("captures JSON leads before subscribing them to Listmonk", async () => {
    const { POST } = await import("@/app/api/leads/resource-download/route");

    const res = await POST(jsonRequest({
      email: "Buyer@Example.COM ",
      name: "Buyer",
      source: "resource_hub_download",
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ ok: true, listmonk_id: 42 });
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "buyer@example.com",
        name: "Buyer",
        source: "resource_hub_download",
        status: "new",
      }),
      { onConflict: "email,source", ignoreDuplicates: true },
    );
    expect(addSubscriberMock).toHaveBeenCalledWith(
      "buyer@example.com",
      "Buyer",
      [2],
      expect.objectContaining({ source: "resource_hub_download" }),
    );
  });

  it("does not pretend success when Supabase capture fails", async () => {
    upsertMock.mockResolvedValueOnce({ error: { message: "relation missing" } });
    const { POST } = await import("@/app/api/leads/resource-download/route");

    const res = await POST(jsonRequest({ email: "ops@example.com" }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain("Lead capture failed");
    expect(addSubscriberMock).not.toHaveBeenCalled();
  });

  it("still returns success when Listmonk is down after Supabase capture", async () => {
    addSubscriberMock.mockRejectedValueOnce(new Error("listmonk offline"));
    const { POST } = await import("@/app/api/leads/resource-download/route");

    const res = await POST(jsonRequest({ email: "operator@example.com" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ ok: true, listmonk_id: null });
    expect(upsertMock).toHaveBeenCalled();
  });
});
