import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("claim session auth boundary", () => {
  it("starts claim sessions with the authenticated confirmed user only", () => {
    const route = read("app/api/claim/start/route.ts");
    const service = read("server/services/claimService.ts");

    expect(route).toContain("auth.getUser()");
    expect(route).toContain("isEmailConfirmed(user)");
    expect(route).toContain("EMAIL_CONFIRMATION_REQUIRED");
    expect(route).toContain("ClaimService.startClaimSession(entity_id, user.id)");
    expect(route).not.toContain("user_id } = body");
    expect(route).not.toContain("entity_id, user_id");

    expect(service).not.toContain("owner_user_id: user_id");
    expect(service).toContain("claim_status: \"claim_started\"");
    expect(service).toContain(".is(\"owner_user_id\", null)");
  });

  it("submits claim steps only for sessions owned by the authenticated confirmed user", () => {
    const route = read("app/api/claim/step/route.ts");
    const service = read("server/services/claimService.ts");

    expect(route).toContain("auth.getUser()");
    expect(route).toContain("isEmailConfirmed(user)");
    expect(route).toContain("ClaimService.submitClaimStep(session_id, user.id, step_name, payload || {})");
    expect(service).toContain("submitClaimStep(session_id: string, user_id: string");
    expect(service).toContain(".eq(\"user_id\", user_id)");
  });

  it("keeps unclaimed profile CTAs on the canonical claim route", () => {
    const sidebar = read("components/directory/ProfileClaimSidebar.tsx");

    expect(sidebar).toContain("claimHash ? `/claim?hash=${encodeURIComponent(claimHash)}`");
    expect(sidebar).toContain("`/claim?entity=${encodeURIComponent(profileId)}`");
    expect(sidebar).not.toContain("`/claim/${claimHash}`");
    expect(sidebar).not.toContain("`/claim/${profileId}`");
  });

  it("binds legacy seeded claim hashes to the authenticated user instead of client userId", () => {
    const route = read("app/api/claim/route.ts");

    expect(route).toContain("auth.getUser()");
    expect(route).toContain("isEmailConfirmed(user)");
    expect(route).toContain("EMAIL_CONFIRMATION_REQUIRED");
    expect(route).toContain("user_id: user.id");
    expect(route).toContain("oldTempId !== user.id");
    expect(route).not.toContain("hash, userId");
    expect(route).not.toContain("user_id: userId");
  });
});
