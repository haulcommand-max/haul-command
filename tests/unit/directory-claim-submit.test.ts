import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("directory claim submit API", () => {
  it("persists claims to the existing moderated hc_claim_requests table", () => {
    const route = read("app/api/directory/claim/route.ts");

    expect(route).toContain("getSupabaseAdmin");
    expect(route).toContain(".from('hc_claim_requests')");
    expect(route).toContain("place_id: input.directoryId");
    expect(route).toContain("requester_user_id: user.id");
    expect(route).toContain("status: 'pending'");
    expect(route).toContain("evidence:");
  });

  it("uses auth-aware fields and avoids fake approval", () => {
    const route = read("app/api/directory/claim/route.ts");

    expect(route).toContain("auth.getUser()");
    expect(route).toContain("isEmailConfirmed(user)");
    expect(route).toContain("EMAIL_CONFIRMATION_REQUIRED");
    expect(route).toContain("Approval is not automatic");
    expect(route).not.toContain("pending_verification");
    expect(route).not.toContain("console.log(`[Directory Auth]");
  });

  it("does not create or depend on a directory submit route without a compatible intake table", () => {
    expect(() => read("app/directory/submit/page.tsx")).toThrow();
    expect(() => read("app/api/directory/submit/route.ts")).toThrow();
  });
});
